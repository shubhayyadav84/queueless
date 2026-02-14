import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Load env vars
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Error:', error.message);
  }
};
connectDB();

// User Schema
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['patient', 'owner', 'staff'], default: 'patient' },
  isVerified: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// OTP Store (in-memory for demo)
const otpStore = new Map();

const generateOTP = (phone) => {
  const otp = process.env.DEMO_MODE === 'true' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  return otp;
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Express App
const app = express();
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'QueueLess API is running' });
});

// Send OTP
app.post('/api/auth/send-otp', [
  body('phone').isMobilePhone()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { phone } = req.body;
    const otp = generateOTP(phone);
    console.log(`OTP for ${phone}: ${otp}`);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      demoOtp: process.env.DEMO_MODE === 'true' ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', [
  body('phone').isMobilePhone(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { phone, otp, name, role = 'patient' } = req.body;
    
    const record = otpStore.get(phone);
    if (!record || record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name required',
          requiresRegistration: true 
        });
      }
      user = await User.create({ phone, name, role, isVerified: true });
      isNewUser = true;
    } else {
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);
    otpStore.delete(phone);

    res.status(200).json({
      success: true,
      message: isNewUser ? 'Registration successful' : 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default app;
