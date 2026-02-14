import mongoose from 'mongoose';

const queueTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  queue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'checked-in', 'being-served', 'completed', 'skipped', 'no-show', 'cancelled'],
    default: 'waiting'
  },
  isPriority: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date
  },
  servedTime: {
    type: Date
  },
  estimatedTime: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

queueTokenSchema.index({ user: 1, queue: 1, status: 1 });
queueTokenSchema.index({ queue: 1, tokenNumber: 1 });

const QueueToken = mongoose.model('QueueToken', queueTokenSchema);
export default QueueToken;
