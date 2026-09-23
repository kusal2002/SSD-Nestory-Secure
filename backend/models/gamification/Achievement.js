const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Achievement name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required']
    },
    icon: {
      type: String,
      default: '⭐'
    },
    category: {
      type: String,
      enum: ['reading', 'consistency', 'milestone', 'social', 'exploration'],
      default: 'milestone'
    },
    type: {
      type: String,
      enum: ['one_time', 'repeatable', 'progressive'],
      default: 'one_time'
    },
    targetValue: {
      type: Number,
      required: [true, 'Target value is required'],
      min: 1
    },
    currentProgress: {
      type: Number,
      default: 0
    },
    reward: {
      points: {
        type: Number,
        default: 50,
        min: 0
      },
      badge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
        default: null
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium'
    },
    prerequisites: [{
      type: String, // Achievement names that must be completed first
      default: []
    }],
    order: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Achievement', achievementSchema);
