import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['token_created', 'token_cancelled', 'token_checked_in', 'token_served', 'token_skipped', 'token_no_show', 'queue_next', 'queue_updated', 'staff_assigned', 'staff_removed', 'queue_created', 'queue_updated_config', 'payment_processed']
  },
  queue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue'
  },
  token: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QueueToken'
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
  performedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['patient', 'owner', 'staff', 'system']
    }
  },
  details: {
    fromToken: Number,
    toToken: Number,
    reason: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

activityLogSchema.index({ queue: 1, createdAt: -1 });
activityLogSchema.index({ business: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
