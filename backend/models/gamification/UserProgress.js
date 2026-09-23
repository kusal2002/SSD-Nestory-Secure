const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema(
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
    totalPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivityDate: {
      type: Date,
      default: null
    },
    badges: [
      {
        badge: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Badge'
        },
        earnedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    achievements: [
      {
        achievement: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Achievement'
        },
        progress: {
          type: Number,
          default: 0
        },
        completed: {
          type: Boolean,
          default: false
        },
        completedAt: {
          type: Date,
          default: null
        }
      }
    ],
    stats: {
      storiesRead: {
        type: Number,
        default: 0
      },
      assignmentsCompleted: {
        type: Number,
        default: 0
      },
      totalReadingTime: {
        type: Number,
        default: 0
      },
      categoriesRead: [{
        type: String
      }],
      earlyMorningReads: {
        type: Number,
        default: 0
      },
      lateNightReads: {
        type: Number,
        default: 0
      },
      monthlyReads: {
        type: Number,
        default: 0
      },
      weeklyReads: {
        type: Number,
        default: 0
      },
      lastMonthlyReset: {
        type: Date,
        default: Date.now
      },
      lastWeeklyReset: {
        type: Date,
        default: Date.now
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
userProgressSchema.index({ user: 1, child: 1 });
userProgressSchema.index({ totalPoints: -1 });

// Calculate level based on points
userProgressSchema.methods.calculateLevel = function() {
  // Level formula: Level = floor(sqrt(totalPoints / 100)) + 1
  this.level = Math.floor(Math.sqrt(this.totalPoints / 100)) + 1;
  return this.level;
};

// Check and update streak
userProgressSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastActivity = this.lastActivityDate;

  if (!lastActivity) {
    this.currentStreak = 1;
    this.longestStreak = 1;
  } else {
    const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.currentStreak += 1;
      if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      this.currentStreak = 1;
    }
    // If daysDiff === 0, same day activity, don't change streak
  }

  this.lastActivityDate = now;
  return this.currentStreak;
};

// Update reading statistics
userProgressSchema.methods.updateReadingStats = function(storyCategory = null, readingTime = 0) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentWeek = this.getWeekNumber(now);

  // Update monthly reads
  const lastResetMonth = this.stats.lastMonthlyReset ? this.stats.lastMonthlyReset.getMonth() : -1;
  const lastResetYear = this.stats.lastMonthlyReset ? this.stats.lastMonthlyReset.getFullYear() : -1;

  if (currentMonth !== lastResetMonth || currentYear !== lastResetYear) {
    this.stats.monthlyReads = 0;
    this.stats.lastMonthlyReset = now;
  }

  // Update weekly reads
  const lastResetWeek = this.stats.lastWeeklyReset ? this.getWeekNumber(this.stats.lastWeeklyReset) : -1;

  if (currentWeek !== lastResetWeek || currentYear !== (this.stats.lastWeeklyReset ? this.stats.lastWeeklyReset.getFullYear() : -1)) {
    this.stats.weeklyReads = 0;
    this.stats.lastWeeklyReset = now;
  }

  this.stats.monthlyReads += 1;
  this.stats.weeklyReads += 1;
  this.stats.totalReadingTime += readingTime;

  // Track categories
  if (storyCategory && !this.stats.categoriesRead.includes(storyCategory)) {
    this.stats.categoriesRead.push(storyCategory);
  }

  // Track time-based reads
  const hour = now.getHours();
  if (hour < 8) {
    this.stats.earlyMorningReads += 1;
  } else if (hour >= 22) {
    this.stats.lateNightReads += 1;
  }

  return this.stats;
};

// Helper method to get week number
userProgressSchema.methods.getWeekNumber = function(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

module.exports = mongoose.model('UserProgress', userProgressSchema);
