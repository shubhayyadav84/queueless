import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['patient', 'owner', 'staff'],
    default: 'patient'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  ownedBusinesses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  }],
  staffBusinesses: [{
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
export default User;
