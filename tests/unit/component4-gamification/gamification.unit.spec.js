/**
 * Component 4: AI Reading Companion (Smart Comprehension & Recommendation)
 * UNIT TESTS - Gamification Service
 * Owner: KUSAL
 *
 * Tests gamification logic: points, badges, achievements, streaks, levels, and recommendations
 */

const { TestReport } = require("../../config/test-utils");
const { dummyUserProgress, dummyBadges, dummyAchievements } = require("../../fixtures/dummy-data");
const { test } = require('@playwright/test');

// Mock Gamification Service for unit testing
const mockGamificationService = {
  /**
   * Award points for actions
   */
  awardPoints(userProgress, action, points) {
    if (!userProgress || !action || !points || points < 0) {
      throw new Error("Invalid input for awarding points");
    }

    const previousBalance = userProgress.totalPoints;
    userProgress.totalPoints += points;

    return {
      action,
      pointsAwarded: points,
      previousBalance,
      newBalance: userProgress.totalPoints,
      timestamp: new Date(),
    };
  },

  /**
   * Calculate current level based on points
   */
  calculateLevel(totalPoints) {
    if (!totalPoints || totalPoints < 0) return 1;

    const pointsPerLevel = 100;
    return Math.floor(totalPoints / pointsPerLevel) + 1;
  },

  /**
   * Calculate progress to next level
   */
  calculateLevelProgress(totalPoints) {
    const pointsPerLevel = 100;
    const currentLevel = this.calculateLevel(totalPoints);
    const pointsInCurrentLevel = totalPoints % pointsPerLevel;
    const pointsNeededForNext = pointsPerLevel - pointsInCurrentLevel;

    return {
      currentLevel,
      pointsInLevel: pointsInCurrentLevel,
      pointsNeededForNext,
      progressPercent: Math.round((pointsInCurrentLevel / pointsPerLevel) * 100),
    };
  },

  /**
   * Check if badge criteria is met
   */
  checkBadgeCriteria(userProgress, badge) {
    if (!badge.criteria) return false;

    const criteria = badge.criteria;

    if (criteria.storiesRead && userProgress.storiesRead < criteria.storiesRead) {
      return false;
    }

    if (criteria.streakDays && userProgress.currentStreak < criteria.streakDays) {
      return false;
    }

    if (criteria.totalPoints && userProgress.totalPoints < criteria.totalPoints) {
      return false;
    }

    if (criteria.assignmentsCompleted && userProgress.assignmentsCompleted < criteria.assignmentsCompleted) {
      return false;
    }

    return true;
  },

  /**
   * Award badge to user
   */
  awardBadge(userProgress, badge) {
    if (!this.checkBadgeCriteria(userProgress, badge)) {
      throw new Error("Badge criteria not met");
    }

    if (userProgress.badgesEarned.includes(badge._id)) {
      throw new Error("Badge already earned");
    }

    userProgress.badgesEarned.push(badge._id);
    userProgress.totalPoints += badge.points;

    return {
      badge,
      earnedAt: new Date(),
      pointsAwarded: badge.points,
      newTotalPoints: userProgress.totalPoints,
    };
  },

  /**
   * Validate and update reading streak
   */
  updateStreak(userProgress, readingOccurred = true) {
    const today = new Date().toDateString();
    const lastReadDate = userProgress.lastReadDate ? new Date(userProgress.lastReadDate).toDateString() : null;

    if (!readingOccurred) {
      if (today !== lastReadDate) {
        userProgress.currentStreak = 0;
      }
      return userProgress;
    }

    // Reading occurred
    if (lastReadDate === today) {
      // Already read today, don't increment
      return userProgress;
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (lastReadDate === yesterday) {
      // Continuous streak
      userProgress.currentStreak += 1;
    } else {
      // Start new streak
      userProgress.currentStreak = 1;
    }

    if (userProgress.currentStreak > userProgress.longestStreak) {
      userProgress.longestStreak = userProgress.currentStreak;
    }

    userProgress.lastReadDate = new Date();

    // Award milestone bonuses
    if (userProgress.currentStreak === 7) {
      userProgress.totalPoints += 50; // 7-day streak bonus
    } else if (userProgress.currentStreak === 30) {
      userProgress.totalPoints += 200; // 30-day streak bonus
    }

    return userProgress;
  },

  /**
   * Check and award achievement
   */
  checkAchievement(userProgress, achievement) {
    if (!achievement.criteria) return false;

    const criteria = achievement.criteria;

    if (criteria.storiesRead && userProgress.storiesRead < criteria.storiesRead) {
      return false;
    }

    if (criteria.totalPoints && userProgress.totalPoints < criteria.totalPoints) {
      return false;
    }

    if (criteria.assignmentsCompleted && userProgress.assignmentsCompleted < criteria.assignmentsCompleted) {
      return false;
    }

    return true;
  },

  /**
   * Award achievement
   */
  awardAchievement(userProgress, achievement) {
    if (!this.checkAchievement(userProgress, achievement)) {
      throw new Error("Achievement criteria not met");
    }

    if (achievement.type !== "repeatable" && userProgress.achievementsEarned.includes(achievement._id)) {
      throw new Error("Achievement already earned");
    }

    if (!userProgress.achievementsEarned.includes(achievement._id)) {
      userProgress.achievementsEarned.push(achievement._id);
    }

    userProgress.totalPoints += achievement.points;

    return {
      achievement,
      earnedAt: new Date(),
      pointsAwarded: achievement.points,
      newTotalPoints: userProgress.totalPoints,
    };
  },

  /**
   * Get leaderboard
   */
  getLeaderboard(allUsers, limit = 10) {
    return allUsers
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        childId: user.childId,
        totalPoints: user.totalPoints,
        level: this.calculateLevel(user.totalPoints),
        storiesCompleted: user.storiesRead,
        currentStreak: user.currentStreak,
      }));
  },

  /**
   * Filter badges by category
   */
  getBadgesByCategory(badges, category) {
    return badges.filter((b) => b.category === category);
  },

  /**
   * Get badge tier information
   */
  getBadgeTierInfo(tier) {
    const tiers = {
      bronze: { name: "Bronze", rarity: "common" },
      silver: { name: "Silver", rarity: "uncommon" },
      gold: { name: "Gold", rarity: "rare" },
      platinum: { name: "Platinum", rarity: "epic" },
      diamond: { name: "Diamond", rarity: "legendary" },
    };
    return tiers[tier] || null;
  },

  /**
   * Calculate next milestone
   */
  getNextMilestone(storiesRead) {
    const milestones = [5, 10, 25, 50, 100];
    return milestones.find((m) => m > storiesRead) || null;
  },

  /**
   * Get user progress summary
   */
  getUserProgressSummary(userProgress) {
    return {
      childId: userProgress.childId,
      totalPoints: userProgress.totalPoints,
      level: this.calculateLevel(userProgress.totalPoints),
      storiesRead: userProgress.storiesRead,
      assignmentsCompleted: userProgress.assignmentsCompleted,
      badgesEarned: userProgress.badgesEarned.length,
      achievementsEarned: userProgress.achievementsEarned.length,
      currentStreak: userProgress.currentStreak,
      longestStreak: userProgress.longestStreak,
      nextMilestone: this.getNextMilestone(userProgress.storiesRead),
      levelProgress: this.calculateLevelProgress(userProgress.totalPoints),
    };
  },

  /**
   * Validate gamification action
   */
  validateAction(action, value) {
    const validActions = [
      "story_read",
      "assignment_complete",
      "daily_login",
      "achievement_unlock",
      "badge_earn",
    ];

    if (!validActions.includes(action)) {
      throw new Error(`Invalid action: ${action}`);
    }

    if (value && (typeof value !== "number" || value < 0)) {
      throw new Error("Value must be a non-negative number");
    }

    return true;
  },
};

// ========================
// UNIT TESTS
// ========================

async function runGamificationUnitTests() {
  const report = new TestReport("Gamification Unit Tests");

  // Test 1: Award points for action
  try {
    // Use fresh user progress to avoid fixture mutations
    const userProgress = {
      childId: "60d5ec49f1c1b0001f5a0201",
      totalPoints: 150,
      level: 2,
      currentStreak: 5,
      longestStreak: 10,
      storiesRead: 3,
      assignmentsCompleted: 2,
      badgesEarned: [],
      achievementsEarned: [],
    };
    const result = mockGamificationService.awardPoints(userProgress, "story_read", 20);
    console.log("DEBUG Award points:", {
      before: 150,
      awarded: 20,
      after: userProgress.totalPoints,
      expected: 170,
      pass: result.pointsAwarded === 20 && userProgress.totalPoints === 170
    });
    report.logAssertion(
      "Award points for action",
      result.pointsAwarded === 20 && userProgress.totalPoints === 170
    );
  } catch (error) {
    console.log("ERROR in Award points:", error.message);
    report.logAssertion("Award points for action", false);
  }

  // Test 2: Reject invalid points
  try {
    const userProgress = JSON.parse(JSON.stringify(dummyUserProgress[0]));
    mockGamificationService.awardPoints(userProgress, "story_read", -10);
    report.logAssertion("Reject negative points", false);
  } catch (error) {
    report.logAssertion("Reject negative points", true);
  }

  // Test 3: Calculate level from points
  try {
    const level1 = mockGamificationService.calculateLevel(0);
    const level2 = mockGamificationService.calculateLevel(100);
    const level3 = mockGamificationService.calculateLevel(250);
    report.logAssertion(
      "Calculate level from points",
      level1 === 1 && level2 === 2 && level3 === 3
    );
  } catch (error) {
    report.logAssertion("Calculate level from points", false);
  }

  // Test 4: Calculate level progress
  try {
    const progress = mockGamificationService.calculateLevelProgress(150);
    report.logAssertion(
      "Calculate level progress",
      progress.currentLevel === 2 &&
        progress.pointsInLevel === 50 &&
        progress.progressPercent === 50
    );
  } catch (error) {
    report.logAssertion("Calculate level progress", false);
  }

  // Test 5: Check badge criteria met
  try {
    const badge = {
      criteria: { storiesRead: 2 },
    };
    const userProgress = { storiesRead: 3 };
    const met = mockGamificationService.checkBadgeCriteria(userProgress, badge);
    report.logAssertion("Check badge criteria met", met === true);
  } catch (error) {
    report.logAssertion("Check badge criteria met", false);
  }

  // Test 6: Check badge criteria not met
  try {
    const badge = {
      criteria: { storiesRead: 10 },
    };
    const userProgress = { storiesRead: 3 };
    const met = mockGamificationService.checkBadgeCriteria(userProgress, badge);
    report.logAssertion("Check badge criteria not met", met === false);
  } catch (error) {
    report.logAssertion("Check badge criteria not met", false);
  }

  // Test 7: Award badge
  try {
    const userProgress = {
      ...dummyUserProgress[0],
      storiesRead: 5,
      badgesEarned: [],
      totalPoints: 100,
    };
    const badge = {
      _id: "badge_new",
      name: "Story Lover",
      criteria: { storiesRead: 5 },
      points: 50,
    };
    const result = mockGamificationService.awardBadge(userProgress, badge);
    report.logAssertion(
      "Award badge",
      userProgress.badgesEarned.includes("badge_new") &&
        userProgress.totalPoints === 150
    );
  } catch (error) {
    report.logAssertion("Award badge", false);
  }

  // Test 8: Prevent duplicate badge
  try {
    const userProgress = {
      ...dummyUserProgress[0],
      storiesRead: 5,
      badgesEarned: ["badge123"],
      totalPoints: 100,
    };
    const badge = {
      _id: "badge123",
      criteria: { storiesRead: 5 },
      points: 50,
    };
    mockGamificationService.awardBadge(userProgress, badge);
    report.logAssertion("Prevent duplicate badge", false);
  } catch (error) {
    report.logAssertion("Prevent duplicate badge", true);
  }

  // Test 9: Update streak - first day
  try {
    const userProgress = { currentStreak: 0, longestStreak: 0, lastReadDate: null, totalPoints: 0 };
    mockGamificationService.updateStreak(userProgress, true);
    report.logAssertion(
      "Update streak - first day",
      userProgress.currentStreak === 1 && userProgress.longestStreak === 1
    );
  } catch (error) {
    report.logAssertion("Update streak - first day", false);
  }

  // Test 10: Update streak - continuous
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const userProgress = {
      currentStreak: 3,
      longestStreak: 3,
      lastReadDate: yesterday,
      totalPoints: 0,
    };
    mockGamificationService.updateStreak(userProgress, true);
    report.logAssertion(
      "Update streak - continuous",
      userProgress.currentStreak === 4
    );
  } catch (error) {
    report.logAssertion("Update streak - continuous", false);
  }

  // Test 11: Streak 7-day bonus
  try {
    // To test 7-day bonus, set lastReadDate to yesterday (so the streak continues)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const userProgress = {
      currentStreak: 6,
      longestStreak: 6,
      lastReadDate: yesterday,
      totalPoints: 100,
    };
    mockGamificationService.updateStreak(userProgress, true);
    report.logAssertion(
      "Streak 7-day bonus",
      userProgress.currentStreak === 7 && userProgress.totalPoints === 150
    );
  } catch (error) {
    report.logAssertion("Streak 7-day bonus", false);
  }

  // Test 12: Check achievement criteria
  try {
    const achievement = { criteria: { storiesRead: 5 } };
    const userProgress = { storiesRead: 5 };
    const met = mockGamificationService.checkAchievement(userProgress, achievement);
    report.logAssertion("Check achievement criteria", met === true);
  } catch (error) {
    report.logAssertion("Check achievement criteria", false);
  }

  // Test 13: Award achievement
  try {
    const userProgress = {
      storiesRead: 5,
      achievementsEarned: [],
      totalPoints: 100,
    };
    const achievement = {
      _id: "ach_new",
      type: "progressive",
      criteria: { storiesRead: 5 },
      points: 100,
    };
    const result = mockGamificationService.awardAchievement(userProgress, achievement);
    report.logAssertion(
      "Award achievement",
      userProgress.achievementsEarned.includes("ach_new") &&
        userProgress.totalPoints === 200
    );
  } catch (error) {
    report.logAssertion("Award achievement", false);
  }

  // Test 14: Get leaderboard
  try {
    const users = [
      { childId: "child1", totalPoints: 500 },
      { childId: "child2", totalPoints: 300 },
      { childId: "child3", totalPoints: 400 },
    ];
    const leaderboard = mockGamificationService.getLeaderboard(users, 2);
    report.logAssertion(
      "Get leaderboard",
      leaderboard.length === 2 &&
        leaderboard[0].childId === "child1" &&
        leaderboard[0].rank === 1
    );
  } catch (error) {
    report.logAssertion("Get leaderboard", false);
  }

  // Test 15: Get badge by category
  try {
    const badges = [
      { _id: "b1", category: "reading" },
      { _id: "b2", category: "streak" },
      { _id: "b3", category: "reading" },
    ];
    const readingBadges = mockGamificationService.getBadgesByCategory(badges, "reading");
    report.logAssertion(
      "Get badges by category",
      readingBadges.length === 2
    );
  } catch (error) {
    report.logAssertion("Get badges by category", false);
  }

  // Test 16: Get badge tier info
  try {
    const tierInfo = mockGamificationService.getBadgeTierInfo("diamond");
    report.logAssertion(
      "Get badge tier info",
      tierInfo && tierInfo.name === "Diamond" && tierInfo.rarity === "legendary"
    );
  } catch (error) {
    report.logAssertion("Get badge tier info", false);
  }

  // Test 17: Get next milestone
  try {
    const milestone1 = mockGamificationService.getNextMilestone(3);
    const milestone2 = mockGamificationService.getNextMilestone(10);
    const milestone3 = mockGamificationService.getNextMilestone(100);
    report.logAssertion(
      "Get next milestone",
      milestone1 === 5 && milestone2 === 25 && milestone3 === null
    );
  } catch (error) {
    report.logAssertion("Get next milestone", false);
  }

  // Test 18: Get user progress summary
  try {
    const summary = mockGamificationService.getUserProgressSummary(dummyUserProgress[0]);
    report.logAssertion(
      "Get user progress summary",
      summary.level > 0 &&
        summary.storiesRead === dummyUserProgress[0].storiesRead &&
        summary.levelProgress
    );
  } catch (error) {
    report.logAssertion("Get user progress summary", false);
  }

  // Test 19: Validate action
  try {
    const valid = mockGamificationService.validateAction("story_read", 20);
    report.logAssertion("Validate action", valid === true);
  } catch (error) {
    report.logAssertion("Validate action", false);
  }

  // Test 20: Reject invalid action
  try {
    mockGamificationService.validateAction("invalid_action", 10);
    report.logAssertion("Reject invalid action", false);
  } catch (error) {
    report.logAssertion("Reject invalid action", true);
  }

  report.print();
  return report.summary();
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const summary = await runGamificationUnitTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = { runGamificationUnitTests, mockGamificationService };


test('runGamificationUnitTests', async () => { 
  await runGamificationUnitTests(); 
});
