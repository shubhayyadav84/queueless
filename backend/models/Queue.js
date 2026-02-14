import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  queueId: {
    type: String,
    required: true,
    unique: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['virtual', 'appointment'],
    required: true
  },
  currentToken: {
    type: Number,
    default: 0
  },
  nextToken: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active'
  },
  settings: {
    avgServiceTime: {
      type: Number,
      default: 15
    },
    maxTokensPerDay: {
      type: Number,
      default: 100
    },
    allowPriority: {
      type: Boolean,
      default: false
    },
    priorityFee: {
      type: Number,
      default: 0
    }
  },
  schedule: {
    startTime: String,
    endTime: String,
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
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

queueSchema.pre('save', function(next) {
  if (!this.queueId) {
    this.queueId = 'Q' + Date.now().toString(36).toUpperCase();
  }
  next();
});

const Queue = mongoose.model('Queue', queueSchema);
export default Queue;
