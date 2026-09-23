const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema(
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
    dateKey: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    challengeType: {
      type: String,
      enum: ['story_count', 'reading_minutes', 'streak_activity', 'category_explorer', 'assignment_completion'],
      required: true
    },
    targetValue: {
      type: Number,
      required: true,
      min: 1
    },
    currentProgress: {
      type: Number,
      default: 0,
      min: 0
    },
    rewardPoints: {
      type: Number,
      default: 25,
      min: 1
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    generatedBy: {
      type: String,
      enum: ['openai', 'gemini', 'fallback'],
      default: 'fallback'
    },
    metadata: {
      model: {
        type: String,
        default: ''
      },
      promptVersion: {
        type: String,
        default: 'v1'
      }
    }
  },
  {
    timestamps: true
  }
);

dailyChallengeSchema.index({ user: 1, child: 1, dateKey: 1 }, { unique: true });
dailyChallengeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
