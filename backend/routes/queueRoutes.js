import express from 'express';
import { body, validationResult } from 'express-validator';
import { Queue, Business, QueueToken, ActivityLog } from '../models/index.js';
import { protect, requireRole } from '../middleware/auth.js';
import { generateQueueId } from '../utils/generateToken.js';

const router = express.Router();

// @route   POST /api/queues
// @desc    Create a new queue
// @access  Private (Owner only)
router.post('/', protect, requireRole('owner'), [
  body('businessId').isMongoId(),
  body('name').trim().isLength({ min: 2 }),
  body('purpose').trim().isLength({ min: 2 }),
  body('type').isIn(['virtual', 'appointment'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { businessId, name, purpose, type, settings, schedule } = req.body;

    const business = await Business.findOne({ _id: businessId, owner: req.user._id });
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found or not authorized' });
    }

    const queueId = generateQueueId();

    const queue = await Queue.create({
      queueId,
      business: businessId,
      name,
      purpose,
      type,
      settings,
      schedule,
      currentToken: 0,
      nextToken: 1
    });

    await ActivityLog.create({
      action: 'queue_created',
      queue: queue._id,
      business: businessId,
      performedBy: { user: req.user._id, role: 'owner' },
      details: { metadata: { name, purpose, type } }
    });

    res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      queue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/queues/search
// @desc    Search queue by Queue ID
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { queueId } = req.query;
    
    if (!queueId) {
      return res.status(400).json({ success: false, message: 'Queue ID is required' });
    }

    const queue = await Queue.findOne({ queueId: queueId.toUpperCase(), isActive: true })
      .populate('business', 'name category address contact');

    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const waitingCount = await QueueToken.countDocuments({
      queue: queue._id,
      status: { $in: ['waiting', 'checked-in'] }
    });

    res.status(200).json({
      success: true,
      queue: {
        ...queue.toObject(),
        waitingCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/queues/business/:businessId
// @desc    Get all queues for a business
// @access  Public
router.get('/business/:businessId', async (req, res) => {
  try {
    const queues = await Queue.find({ 
      business: req.params.businessId, 
      isActive: true 
    }).select('-__v');

    const queuesWithStats = await Promise.all(queues.map(async (queue) => {
      const waitingCount = await QueueToken.countDocuments({
        queue: queue._id,
        status: { $in: ['waiting', 'checked-in'] }
      });
      return { ...queue.toObject(), waitingCount };
    }));

    res.status(200).json({
      success: true,
      queues: queuesWithStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/queues/:id
// @desc    Get single queue with full stats
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id)
      .populate('business', 'name category address contact settings');

    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const waitingTokens = await QueueToken.find({
      queue: queue._id,
      status: { $in: ['waiting', 'checked-in'] }
    }).sort({ tokenNumber: 1 }).populate('user', 'name');

    const beingServed = await QueueToken.findOne({
      queue: queue._id,
      status: 'being-served'
    }).populate('user', 'name');

    const waitingCount = waitingTokens.length;
    const estimatedWaitMinutes = waitingCount * (queue.settings?.avgServiceTime || 15);

    res.status(200).json({
      success: true,
      queue: {
        ...queue.toObject(),
        waitingCount,
        estimatedWaitMinutes,
        waitingTokens: waitingTokens.slice(0, 5),
        beingServed
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/queues/:id
// @desc    Update queue
// @access  Private (Owner only)
router.put('/:id', protect, requireRole('owner'), async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id).populate('business', 'owner');
    
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    if (queue.business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = req.body;
    delete updates.queueId;
    delete updates.business;
    delete updates.currentToken;
    delete updates.nextToken;

    Object.assign(queue, updates);
    await queue.save();

    res.status(200).json({
      success: true,
      message: 'Queue updated successfully',
      queue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/queues/:id/pause
// @desc    Pause queue
// @access  Private (Owner or Staff)
router.post('/:id/pause', protect, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id).populate('business', 'owner staff');
    
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const isOwner = queue.business.owner.toString() === req.user._id.toString();
    const isStaff = queue.business.staff.some(s => s.user.toString() === req.user._id.toString());

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    queue.status = 'paused';
    await queue.save();

    res.status(200).json({
      success: true,
      message: 'Queue paused',
      queue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/queues/:id/resume
// @desc    Resume queue
// @access  Private (Owner or Staff)
router.post('/:id/resume', protect, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id).populate('business', 'owner staff');
    
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const isOwner = queue.business.owner.toString() === req.user._id.toString();
    const isStaff = queue.business.staff.some(s => s.user.toString() === req.user._id.toString());

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    queue.status = 'active';
    await queue.save();

    res.status(200).json({
      success: true,
      message: 'Queue resumed',
      queue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/queues/:id/next
// @desc    Move to next token
// @access  Private (Owner or Staff)
router.post('/:id/next', protect, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id).populate('business', 'owner staff');
    
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const isOwner = queue.business.owner.toString() === req.user._id.toString();
    const isStaff = queue.business.staff.some(s => s.user.toString() === req.user._id.toString());

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { skipCurrent = false } = req.body;
    const fromToken = queue.currentToken;

    if (queue.currentToken > 0 && !skipCurrent) {
      await QueueToken.findOneAndUpdate(
        { queue: queue._id, tokenNumber: queue.currentToken, status: 'being-served' },
        { status: 'completed', servedTime: new Date() }
      );
    }

    const nextToken = await QueueToken.findOne({
      queue: queue._id,
      status: { $in: ['waiting', 'checked-in'] },
      tokenNumber: { $gt: queue.currentToken }
    }).sort({ tokenNumber: 1 });

    if (!nextToken) {
      return res.status(400).json({ success: false, message: 'No more tokens in queue' });
    }

    queue.currentToken = nextToken.tokenNumber;
    await queue.save();

    nextToken.status = 'being-served';
    await nextToken.save();

    await ActivityLog.create({
      action: 'queue_next',
      queue: queue._id,
      business: queue.business._id,
      token: nextToken._id,
      performedBy: { user: req.user._id, role: isOwner ? 'owner' : 'staff' },
      details: { fromToken, toToken: queue.currentToken }
    });

    const io = req.app.get('io');
    io.to(`queue_${queue._id}`).emit('queueUpdate', {
      queueId: queue._id,
      currentToken: queue.currentToken,
      action: 'next'
    });

    res.status(200).json({
      success: true,
      message: 'Moved to next token',
      currentToken: queue.currentToken,
      servingToken: nextToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/queues/:id/skip/:tokenNumber
// @desc    Skip a token
// @access  Private (Owner or Staff)
router.post('/:id/skip/:tokenNumber', protect, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id).populate('business', 'owner staff');
    
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const isOwner = queue.business.owner.toString() === req.user._id.toString();
    const isStaff = queue.business.staff.some(s => s.user.toString() === req.user._id.toString());

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const token = await QueueToken.findOne({
      queue: queue._id,
      tokenNumber: req.params.tokenNumber
    });

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    token.status = 'skipped';
    await token.save();

    await ActivityLog.create({
      action: 'token_skipped',
      queue: queue._id,
      business: queue.business._id,
      token: token._id,
      performedBy: { user: req.user._id, role: isOwner ? 'owner' : 'staff' },
      details: { metadata: { tokenNumber: req.params.tokenNumber } }
    });

    const io = req.app.get('io');
    io.to(`queue_${queue._id}`).emit('tokenSkipped', {
      queueId: queue._id,
      tokenNumber: req.params.tokenNumber
    });

    res.status(200).json({
      success: true,
      message: 'Token skipped'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/queues/:id/noshow/:tokenNumber
// @desc    Mark token as no-show
// @access  Private (Owner or Staff)
router.post('/:id/noshow/:tokenNumber', protect, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id).populate('business', 'owner staff');
    
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const isOwner = queue.business.owner.toString() === req.user._id.toString();
    const isStaff = queue.business.staff.some(s => s.user.toString() === req.user._id.toString());

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const token = await QueueToken.findOne({
      queue: queue._id,
      tokenNumber: req.params.tokenNumber
    });

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    token.status = 'no-show';
    await token.save();

    await ActivityLog.create({
      action: 'token_no_show',
      queue: queue._id,
      business: queue.business._id,
      token: token._id,
      performedBy: { user: req.user._id, role: isOwner ? 'owner' : 'staff' },
      details: { metadata: { tokenNumber: req.params.tokenNumber } }
    });

    const io = req.app.get('io');
    io.to(`queue_${queue._id}`).emit('tokenNoShow', {
      queueId: queue._id,
      tokenNumber: req.params.tokenNumber
    });

    res.status(200).json({
      success: true,
      message: 'Token marked as no-show'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
