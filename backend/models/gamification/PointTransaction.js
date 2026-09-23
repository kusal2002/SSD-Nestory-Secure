const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      default: null
    },
    points: {
      type: Number,
      required: [true, 'Points amount is required']
    },
    type: {
      type: String,
      enum: ['earn', 'spend', 'bonus', 'penalty', 'adjustment'],
      required: true
    },
    source: {
      type: String,
      enum: ['story_read', 'assignment_completed', 'badge_earned', 'streak_bonus', 'achievement', 'manual', 'daily_login', 'quiz_completed'],
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    reference: {
      model: {
        type: String,
        enum: ['Story', 'Assignment', 'Badge', 'Achievement', 'Quiz', 'None'],
        default: 'None'
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      }
    },
    balanceBefore: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
pointTransactionSchema.index({ user: 1, createdAt: -1 });
pointTransactionSchema.index({ child: 1, createdAt: -1 });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
