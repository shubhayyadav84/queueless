import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { generateOTP, verifyOTP } from '../utils/otpStore.js';
import { generateToken } from '../utils/generateToken.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number
// @access  Public
router.post('/send-otp', [
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { phone } = req.body;
    const otp = generateOTP(phone);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      ...(process.env.DEMO_MODE === 'true' && { demoOtp: otp })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register user
// @access  Public
router.post('/verify-otp', [
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { phone, otp, name, role = 'patient' } = req.body;
    
    const otpVerification = verifyOTP(phone, otp);
    if (!otpVerification.valid) {
      return res.status(400).json({ success: false, message: otpVerification.message });
    }

    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name is required for new registration',
          requiresRegistration: true 
        });
      }
      
      user = await User.create({
        phone,
        name,
        role,
        isVerified: true
      });
      isNewUser = true;
    } else {
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: isNewUser ? 'Registration successful' : 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('ownedBusinesses', 'name category')
      .populate('staffBusinesses.business', 'name category');
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        ownedBusinesses: user.ownedBusinesses,
        staffBusinesses: user.staffBusinesses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
