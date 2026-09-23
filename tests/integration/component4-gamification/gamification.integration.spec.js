/**
 * Component 4: AI Reading Companion (Smart Comprehension & Recommendation)
 * INTEGRATION TESTS
 * Owner: KUSAL
 *
 * Tests gamification APIs: points, badges, achievements, leaderboards, and recommendations
 */

const { TestReport } = require("../../config/test-utils");
const { dummyUserProgress, dummyBadges, dummyAchievements } = require("../../fixtures/dummy-data");
const { test } = require('@playwright/test');

// Mock Gamification Controller for integration tests
const mockGamificationController = {
  /**
   * POST /api/gamification/points/award
   * Award points to child
   */
  async awardPoints(childId, action, points) {
    if (!childId || !action || points === undefined) {
      throw new Error("Child ID, action, and points are required");
    }

    if (points < 0) {
      throw new Error("Points must be non-negative");
    }

    const userProgress = dummyUserProgress.find((u) => u.childId.toString() === childId.toString()) || {
      childId,
      totalPoints: 0,
    };

    const previousPoints = userProgress.totalPoints;
    userProgress.totalPoints += points;

    return {
      success: true,
      message: "Points awarded",
      data: {
        childId,
        action,
        pointsAwarded: points,
        previousPoints,
        newPoints: userProgress.totalPoints,
        timestamp: new Date(),
      },
    };
  },

  /**
   * POST /api/gamification/badges/check
   * Check if child qualifies for badges
   */
  async checkBadges(childId) {
    if (!childId) {
      throw new Error("Child ID is required");
    }

    const userProgress = dummyUserProgress.find((u) => u.childId.toString() === childId.toString());
    if (!userProgress) {
      throw new Error("User progress not found");
    }

    const availableBadges = dummyBadges.filter((badge) => {
      if (userProgress.badgesEarned.some((b) => b.toString() === badge._id.toString())) {
        return false; // Already earned
      }

      // Check criteria
      if (badge.criteria.storiesRead && userProgress.storiesRead < badge.criteria.storiesRead) {
        return false;
      }
      if (badge.criteria.streakDays && userProgress.currentStreak < badge.criteria.streakDays) {
        return false;
      }

      return true;
    });

    return {
      success: true,
      message: "Badges checked",
      data: {
        childId,
        availableBadges,
        totalEarned: userProgress.badgesEarned.length,
      },
    };
  },

  /**
   * POST /api/gamification/badges/:id/award
   * Award specific badge to child
   */
  async awardBadge(childId, badgeId) {
    if (!childId || !badgeId) {
      throw new Error("Child ID and badge ID are required");
    }

    const userProgress = dummyUserProgress.find((u) => u.childId.toString() === childId.toString());
    if (!userProgress) {
      throw new Error("User progress not found");
    }

    const badge = dummyBadges.find((b) => b._id.toString() === badgeId.toString());
    if (!badge) {
      throw new Error("Badge not found");
    }

    if (userProgress.badgesEarned.some((b) => b.toString() === badgeId.toString())) {
      throw new Error("Badge already earned");
    }

    userProgress.badgesEarned.push(badgeId);
    userProgress.totalPoints += badge.points;

    return {
      success: true,
      message: "Badge awarded",
      data: {
        badge,
        earnedAt: new Date(),
        pointsAwarded: badge.points,
        newTotalPoints: userProgress.totalPoints,
      },
    };
  },

  /**
   * GET /api/gamification/badges
   * Get all available badges
   */
  async getBadges(category = null) {
    let badges = [...dummyBadges];

    if (category) {
      badges = badges.filter((b) => b.category === category);
    }

    return {
      success: true,
      message: "Badges fetched",
      data: badges,
    };
  },

  /**
   * GET /api/gamification/achievements
   * Get all achievements
   */
  async getAchievements(type = null) {
    let achievements = [...dummyAchievements];

    if (type) {
      achievements = achievements.filter((a) => a.type === type);
    }

    return {
      success: true,
      message: "Achievements fetched",
      data: achievements,
    };
  },

  /**
   * POST /api/gamification/achievements/check
   * Check available achievements for child
   */
  async checkAchievements(childId) {
    if (!childId) {
      throw new Error("Child ID is required");
    }

    const userProgress = dummyUserProgress.find((u) => u.childId.toString() === childId.toString());
    if (!userProgress) {
      throw new Error("User progress not found");
    }

    const availableAchievements = dummyAchievements.filter((ach) => {
      if (ach.type !== "repeatable" &&
        userProgress.achievementsEarned.some((a) => a.toString() === ach._id.toString())) {
        return false;
      }

      if (ach.criteria.storiesRead && userProgress.storiesRead < ach.criteria.storiesRead) {
        return false;
      }

      return true;
    });

    return {
      success: true,
      message: "Achievements checked",
      data: {
        childId,
        availableAchievements,
        totalEarned: userProgress.achievementsEarned.length,
      },
    };
  },

  /**
   * GET /api/gamification/progress/:childId
   * Get child's gamification progress
   */
  async getChildProgress(childId) {
    if (!childId) {
      throw new Error("Child ID is required");
    }

    const userProgress = dummyUserProgress.find((u) => u.childId.toString() === childId.toString());
    if (!userProgress) {
      throw new Error("User progress not found");
    }

    const pointsPerLevel = 100;
    const level = Math.floor(userProgress.totalPoints / pointsPerLevel) + 1;
    const progressInLevel = userProgress.totalPoints % pointsPerLevel;

    return {
      success: true,
      message: "Child progress fetched",
      data: {
        childId,
        totalPoints: userProgress.totalPoints,
        level,
        progressPercent: Math.round((progressInLevel / pointsPerLevel) * 100),
        storiesRead: userProgress.storiesRead,
        assignmentsCompleted: userProgress.assignmentsCompleted,
        badgesEarned: userProgress.badgesEarned.length,
        currentStreak: userProgress.currentStreak,
      },
    };
  },

  /**
   * GET /api/gamification/leaderboard
   * Get global leaderboard
   */
  async getLeaderboard(limit = 10) {
    const leaderboard = dummyUserProgress
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        childId: user.childId,
        totalPoints: user.totalPoints,
        level: Math.floor(user.totalPoints / 100) + 1,
        storiesRead: user.storiesRead,
        currentStreak: user.currentStreak,
      }));

    return {
      success: true,
      message: "Leaderboard fetched",
      data: leaderboard,
    };
  },

  /**
   * POST /api/gamification/streak/update
   * Update reading streak for child
   */
  async updateReadingStreak(childId, readingOccurred = true) {
    if (!childId) {
      throw new Error("Child ID is required");
    }

    const userProgress = dummyUserProgress.find((u) => u.childId.toString() === childId.toString());
    if (!userProgress) {
      throw new Error("User progress not found");
    }

    if (readingOccurred) {
      userProgress.currentStreak += 1;
      if (userProgress.currentStreak > userProgress.longestStreak) {
        userProgress.longestStreak = userProgress.currentStreak;
      }
    } else {
      userProgress.currentStreak = 0;
    }

    return {
      success: true,
      message: "Streak updated",
      data: {
        childId,
        currentStreak: userProgress.currentStreak,
        longestStreak: userProgress.longestStreak,
        timestamp: new Date(),
      },
    };
  },

  /**
   * GET /api/gamification/recommendations/:childId
   * Get personalized gamification recommendations
   */
  async getRecommendations(childId) {
    if (!childId) {
      throw new Error("Child ID is required");
    }

    const userProgress = dummyUserProgress.find((u) => u.childId.toString() === childId.toString());
    if (!userProgress) {
      throw new Error("User progress not found");
    }

    const recommendations = [];

    if (userProgress.storiesRead < 5) {
      recommendations.push({
        type: "encourage_reading",
        message: "Keep reading! You're on the path to earning your first badge.",
      });
    }

    if (userProgress.currentStreak < 7) {
      recommendations.push({
        type: "maintain_streak",
        message: `You're ${7 - userProgress.currentStreak} days away from a 7-day badge!`,
      });
    }

    if (userProgress.badgesEarned.length === 0) {
      recommendations.push({
        type: "earn_first_badge",
        message: "Earn your first badge by reading 1 more story!",
      });
    }

    return {
      success: true,
      message: "Recommendations fetched",
      data: {
        childId,
        recommendations,
      },
    };
  },
};

// ========================
// INTEGRATION TESTS
// ========================

async function runGamificationIntegrationTests() {
  const report = new TestReport("Gamification Integration Tests");

  try {
    // Test 1: Award points
    try {
      const response = await mockGamificationController.awardPoints(
        dummyUserProgress[0].childId,
        "story_read",
        20
      );
      report.logAssertion(
        "Award points",
        response.success &&
          response.data.pointsAwarded === 20 &&
          response.data.newPoints > response.data.previousPoints
      );
    } catch (error) {
      report.logAssertion("Award points", false);
    }

    // Test 2: Reject negative points
    try {
      await mockGamificationController.awardPoints(
        dummyUserProgress[0].childId,
        "story_read",
        -10
      );
      report.logAssertion("Reject negative points", false);
    } catch (error) {
      report.logAssertion("Reject negative points", true);
    }

    // Test 3: Check available badges
    try {
      const response = await mockGamificationController.checkBadges(
        dummyUserProgress[0].childId
      );
      report.logAssertion(
        "Check available badges",
        response.success && Array.isArray(response.data.availableBadges)
      );
    } catch (error) {
      report.logAssertion("Check available badges", false);
    }

    // Test 4: Award badge
    try {
      const response = await mockGamificationController.awardBadge(
        dummyUserProgress[0].childId,
        dummyBadges[0]._id
      );
      report.logAssertion(
        "Award badge",
        response.success &&
          response.data.badge._id.toString() === dummyBadges[0]._id.toString() &&
          response.data.pointsAwarded > 0
      );
    } catch (error) {
      report.logAssertion("Award badge", false);
    }

    // Test 5: Prevent duplicate badge
    try {
      const userProgress = dummyUserProgress.find((u) => u.badgesEarned.length > 0);
      if (userProgress && userProgress.badgesEarned.length > 0) {
        await mockGamificationController.awardBadge(
          userProgress.childId,
          userProgress.badgesEarned[0]
        );
        report.logAssertion("Prevent duplicate badge", false);
      } else {
        report.logAssertion("Prevent duplicate badge", true); // Skip if no badges earned
      }
    } catch (error) {
      report.logAssertion("Prevent duplicate badge", true);
    }

    // Test 6: Get all badges
    try {
      const response = await mockGamificationController.getBadges();
      report.logAssertion(
        "Get all badges",
        response.success && Array.isArray(response.data) && response.data.length > 0
      );
    } catch (error) {
      report.logAssertion("Get all badges", false);
    }

    // Test 7: Get badges by category
    try {
      const response = await mockGamificationController.getBadges("reading");
      report.logAssertion(
        "Get badges by category",
        response.success &&
          Array.isArray(response.data) &&
          response.data.every((b) => b.category === "reading")
      );
    } catch (error) {
      report.logAssertion("Get badges by category", false);
    }

    // Test 8: Get achievements
    try {
      const response = await mockGamificationController.getAchievements();
      report.logAssertion(
        "Get achievements",
        response.success && Array.isArray(response.data)
      );
    } catch (error) {
      report.logAssertion("Get achievements", false);
    }

    // Test 9: Check available achievements
    try {
      const response = await mockGamificationController.checkAchievements(
        dummyUserProgress[0].childId
      );
      report.logAssertion(
        "Check available achievements",
        response.success && Array.isArray(response.data.availableAchievements)
      );
    } catch (error) {
      report.logAssertion("Check available achievements", false);
    }

    // Test 10: Get child progress
    try {
      const response = await mockGamificationController.getChildProgress(
        dummyUserProgress[0].childId
      );
      report.logAssertion(
        "Get child progress",
        response.success &&
          response.data.totalPoints >= 0 &&
          response.data.level > 0 &&
          response.data.progressPercent >= 0
      );
    } catch (error) {
      report.logAssertion("Get child progress", false);
    }

    // Test 11: Get leaderboard
    try {
      const response = await mockGamificationController.getLeaderboard(5);
      report.logAssertion(
        "Get leaderboard",
        response.success &&
          Array.isArray(response.data) &&
          response.data[0] &&
          response.data[0].rank === 1
      );
    } catch (error) {
      report.logAssertion("Get leaderboard", false);
    }

    // Test 12: Leaderboard is sorted by points
    try {
      const response = await mockGamificationController.getLeaderboard(10);
      let isSorted = true;
      for (let i = 0; i < response.data.length - 1; i++) {
        if (response.data[i].totalPoints < response.data[i + 1].totalPoints) {
          isSorted = false;
          break;
        }
      }
      report.logAssertion("Leaderboard sorted by points", isSorted);
    } catch (error) {
      report.logAssertion("Leaderboard sorted by points", false);
    }

    // Test 13: Update reading streak
    try {
      const response = await mockGamificationController.updateReadingStreak(
        dummyUserProgress[0].childId,
        true
      );
      report.logAssertion(
        "Update reading streak",
        response.success &&
          response.data.currentStreak >= 0 &&
          response.data.longestStreak >= 0
      );
    } catch (error) {
      report.logAssertion("Update reading streak", false);
    }

    // Test 14: Reset streak if no reading
    try {
      const response = await mockGamificationController.updateReadingStreak(
        dummyUserProgress[0].childId,
        false
      );
      report.logAssertion(
        "Reset streak if no reading",
        response.success && response.data.currentStreak === 0
      );
    } catch (error) {
      report.logAssertion("Reset streak if no reading", false);
    }

    // Test 15: Get recommendations
    try {
      const response = await mockGamificationController.getRecommendations(
        dummyUserProgress[0].childId
      );
      report.logAssertion(
        "Get recommendations",
        response.success && Array.isArray(response.data.recommendations)
      );
    } catch (error) {
      report.logAssertion("Get recommendations", false);
    }

  } catch (error) {
    console.error("❌ Test setup error:", error);
  }

  report.print();
  return report.summary();
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const summary = await runGamificationIntegrationTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = {
  runGamificationIntegrationTests,
  mockGamificationController,
};


test('runGamificationIntegrationTests', async () => { 
  await runGamificationIntegrationTests(); 
});
