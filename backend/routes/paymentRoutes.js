import express from 'express';
import { body, validationResult } from 'express-validator';
import { Payment, QueueToken } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/payments/mock
// @desc    Process mock payment
// @access  Private
router.post('/mock', protect, [
  body('amount').isNumeric(),
  body('type').isIn(['booking_fee', 'priority_fee', 'subscription']),
  body('tokenId').optional().isMongoId()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { amount, type, tokenId, upiId, metadata } = req.body;

    let token = null;
    let business = null;

    if (tokenId) {
      token = await QueueToken.findById(tokenId);
      if (!token) {
        return res.status(404).json({ success: false, message: 'Token not found' });
      }
      business = token.business;
    }

    const payment = await Payment.create({
      user: req.user._id,
      token: tokenId,
      business,
      type,
      amount,
      status: 'pending',
      upiId,
      metadata
    });

    setTimeout(async () => {
      payment.status = 'completed';
      payment.transactionId = 'TXN' + Date.now();
      payment.completedAt = new Date();
      await payment.save();
      
      console.log(`Mock payment ${payment._id} completed`);
    }, 2000);

    res.status(200).json({
      success: true,
      message: 'Payment initiated (mock)',
      payment: {
        id: payment._id,
        amount,
        type,
        status: 'pending'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/payments/status/:paymentId
// @desc    Check payment status
// @access  Private
router.get('/status/:paymentId', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      user: req.user._id
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/payments/my-payments
// @desc    Get user's payment history
// @access  Private
router.get('/my-payments', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('token', 'tokenNumber')
      .populate('business', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
