import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['clinic', 'salon', 'bank', 'government', 'college', 'service_center', 'restaurant', 'repair_center', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staff: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    allowOnlineBooking: {
      type: Boolean,
      default: true
    },
    checkInRequired: {
      type: Boolean,
      default: true
    },
    checkInTimeLimit: {
      type: Number,
      default: 15
    },
    enablePayments: {
      type: Boolean,
      default: false
    },
    bookingFee: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Business = mongoose.model('Business', businessSchema);
export default Business;
