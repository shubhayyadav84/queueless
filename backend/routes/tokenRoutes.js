import express from 'express';
import { body, validationResult } from 'express-validator';
import { QueueToken, Queue, Business, ActivityLog, Payment } from '../models/index.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/tokens
// @desc    Book a token in a queue
// @access  Private (Patient)
router.post('/', protect, [
  body('queueId').isMongoId()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { queueId, isPriority = false, notes } = req.body;

    const queue = await Queue.findById(queueId).populate('business');
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    if (queue.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Queue is not active' });
    }

    const existingToken = await QueueToken.findOne({
      user: req.user._id,
      queue: queueId,
      status: { $in: ['waiting', 'checked-in', 'being-served'] }
    });

    if (existingToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active token in this queue',
        token: existingToken
      });
    }

    const tokenNumber = queue.nextToken;
    queue.nextToken += 1;
    await queue.save();

    const estimatedMinutes = (queue.nextToken - queue.currentToken - 1) * (queue.settings?.avgServiceTime || 15);
    const estimatedTime = new Date(Date.now() + estimatedMinutes * 60000);

    const token = await QueueToken.create({
      user: req.user._id,
      queue: queueId,
      business: queue.business._id,
      tokenNumber,
      status: 'waiting',
      isPriority,
      estimatedTime,
      notes
    });

    await ActivityLog.create({
      action: 'token_created',
      queue: queue._id,
      business: queue.business._id,
      token: token._id,
      performedBy: { user: req.user._id, role: 'patient' },
      details: { metadata: { tokenNumber, isPriority } }
    });

    const io = req.app.get('io');
    io.to(`queue_${queue._id}`).emit('tokenCreated', {
      queueId: queue._id,
      token: {
        tokenNumber,
        status: 'waiting',
        estimatedTime
      }
    });

    res.status(201).json({
      success: true,
      message: 'Token booked successfully',
      token: await QueueToken.findById(token._id).populate('queue', 'name purpose queueId')
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/tokens/my-tokens
// @desc    Get current user's tokens
// @access  Private
router.get('/my-tokens', protect, async (req, res) => {
  try {
    const tokens = await QueueToken.find({
      user: req.user._id,
      status: { $in: ['waiting', 'checked-in', 'being-served'] }
    })
      .populate('queue', 'name purpose queueId currentToken business')
      .populate('business', 'name category')
      .sort({ createdAt: -1 });

    const tokensWithPosition = await Promise.all(tokens.map(async (token) => {
      const aheadCount = await QueueToken.countDocuments({
        queue: token.queue._id,
        status: { $in: ['waiting', 'checked-in'] },
        tokenNumber: { $lt: token.tokenNumber }
      });

      return {
        ...token.toObject(),
        peopleAhead: aheadCount
      };
    }));

    res.status(200).json({
      success: true,
      tokens: tokensWithPosition
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/tokens/history
// @desc    Get token history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const tokens = await QueueToken.find({
      user: req.user._id,
      status: { $in: ['completed', 'skipped', 'no-show', 'cancelled'] }
    })
      .populate('queue', 'name purpose queueId')
      .populate('business', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tokens
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/tokens/:id
// @desc    Get single token
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const token = await QueueToken.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('queue', 'name purpose queueId currentToken status')
      .populate('business', 'name category address contact');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const aheadCount = await QueueToken.countDocuments({
      queue: token.queue._id,
      status: { $in: ['waiting', 'checked-in'] },
      tokenNumber: { $lt: token.tokenNumber }
    });

    res.status(200).json({
      success: true,
      token: {
        ...token.toObject(),
        peopleAhead: aheadCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/tokens/:id/cancel
// @desc    Cancel a token
// @access  Private
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const token = await QueueToken.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (!['waiting', 'checked-in'].includes(token.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this token' });
    }

    token.status = 'cancelled';
    await token.save();

    await ActivityLog.create({
      action: 'token_cancelled',
      queue: token.queue,
      business: token.business,
      token: token._id,
      performedBy: { user: req.user._id, role: 'patient' },
      details: { metadata: { tokenNumber: token.tokenNumber } }
    });

    const io = req.app.get('io');
    io.to(`queue_${token.queue}`).emit('tokenCancelled', {
      queueId: token.queue,
      tokenNumber: token.tokenNumber
    });

    res.status(200).json({
      success: true,
      message: 'Token cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/tokens/:id/checkin
// @desc    Check in for a token
// @access  Private
router.post('/:id/checkin', protect, async (req, res) => {
  try {
    const token = await QueueToken.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (token.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Token is not in waiting status' });
    }

    token.status = 'checked-in';
    token.checkInTime = new Date();
    await token.save();

    await ActivityLog.create({
      action: 'token_checked_in',
      queue: token.queue,
      business: token.business,
      token: token._id,
      performedBy: { user: req.user._id, role: 'patient' },
      details: { metadata: { tokenNumber: token.tokenNumber } }
    });

    const io = req.app.get('io');
    io.to(`queue_${token.queue}`).emit('tokenCheckedIn', {
      queueId: token.queue,
      tokenNumber: token.tokenNumber
    });

    res.status(200).json({
      success: true,
      message: 'Checked in successfully',
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/tokens/queue/:queueId
// @desc    Get all tokens for a queue (Owner/Staff only)
// @access  Private
router.get('/queue/:queueId', protect, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.queueId).populate('business', 'owner staff');
    
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const isOwner = queue.business.owner.toString() === req.user._id.toString();
    const isStaff = queue.business.staff.some(s => s.user.toString() === req.user._id.toString());

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.query;
    const query = { queue: req.params.queueId };
    
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['waiting', 'checked-in', 'being-served'] };
    }

    const tokens = await QueueToken.find(query)
      .populate('user', 'name phone')
      .sort({ tokenNumber: 1 });

    res.status(200).json({
      success: true,
      tokens
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/tokens/:id/manual-checkin
// @desc    Manual check-in by staff
// @access  Private (Owner/Staff)
router.post('/:id/manual-checkin', protect, async (req, res) => {
  try {
    const token = await QueueToken.findById(req.params.id).populate('queue');
    
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const queue = await Queue.findById(token.queue._id).populate('business', 'owner staff');
    
    const isOwner = queue.business.owner.toString() === req.user._id.toString();
    const isStaff = queue.business.staff.some(s => s.user.toString() === req.user._id.toString());

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (token.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Token is not in waiting status' });
    }

    token.status = 'checked-in';
    token.checkInTime = new Date();
    await token.save();

    await ActivityLog.create({
      action: 'token_checked_in',
      queue: token.queue,
      business: token.business,
      token: token._id,
      performedBy: { user: req.user._id, role: isOwner ? 'owner' : 'staff' },
      details: { metadata: { tokenNumber: token.tokenNumber, manual: true } }
    });

    const io = req.app.get('io');
    io.to(`queue_${token.queue._id}`).emit('tokenCheckedIn', {
      queueId: token.queue._id,
      tokenNumber: token.tokenNumber
    });

    res.status(200).json({
      success: true,
      message: 'Manual check-in successful',
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
