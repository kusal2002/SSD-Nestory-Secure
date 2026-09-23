const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Badge name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Badge description is required']
    },
    icon: {
      type: String,
      default: '🏆'
    },
    category: {
      type: String,
      enum: ['reading', 'streak', 'achievement', 'social', 'special'],
      default: 'achievement'
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'bronze'
    },
    points: {
      type: Number,
      default: 10,
      min: [0, 'Points cannot be negative']
    },
    criteria: {
      type: {
        type: String,
        enum: ['story_count', 'days_streak', 'total_points', 'assignments_completed', 'custom'],
        required: true
      },
      threshold: {
        type: Number,
        required: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Badge', badgeSchema);
