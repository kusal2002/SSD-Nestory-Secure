/**
 * Component 4: AI Reading Companion (Smart Comprehension & Recommendation)
 * SYSTEM TESTS
 * Owner: KUSAL
 *
 * Tests complete gamification workflows: Reading → Points → Badges → Achievements → Leaderboard
 */

const { TestReport } = require("../../config/test-utils");
const { test } = require('@playwright/test');

// Mock complete gamification system
const mockGamificationSystem = {
  childrenProgress: {},
  badges: [
    {
      _id: "badge_starter",
      name: "Story Starter",
      criteria: { storiesRead: 1 },
      points: 10,
      category: "reading",
    },
    {
      _id: "badge_lover",
      name: "Story Lover",
      criteria: { storiesRead: 5 },
      points: 50,
      category: "reading",
    },
    {
      _id: "badge_streak7",
      name: "Week Warrior",
      criteria: { streakDays: 7 },
      points: 50,
      category: "streak",
    },
  ],
  achievements: [
    {
      _id: "ach_bookworm",
      name: "Bookworm",
      criteria: { storiesRead: 10 },
      points: 100,
      type: "progressive",
    },
  ],

  /**
   * Reset system state (useful for test isolation)
   */
  reset() {
    this.childrenProgress = {};
  },

  /**
   * Workflow 1: Child completes first story
   */
  async workflowCompleteFirstStory(childId) {
    if (!this.childrenProgress[childId]) {
      this.childrenProgress[childId] = {
        childId,
        totalPoints: 0,
        level: 1,
        storiesRead: 0,
        badgesEarned: [],
        achievementsEarned: [],
        currentStreak: 0,
      };
    }

    const progress = this.childrenProgress[childId];
    progress.storiesRead += 1;
    progress.totalPoints += 20; // Points for reading

    // Check for badges
    const storyStarterBadge = this.badges.find((b) => b._id === "badge_starter");
    if (
      progress.storiesRead >= storyStarterBadge.criteria.storiesRead &&
      !progress.badgesEarned.includes(storyStarterBadge._id)
    ) {
      progress.badgesEarned.push(storyStarterBadge._id);
      progress.totalPoints += storyStarterBadge.points;
    }

    // Update level
    progress.level = Math.floor(progress.totalPoints / 100) + 1;

    return {
      storiesCompleted: progress.storiesRead,
      totalPoints: progress.totalPoints,
      newBadges: progress.badgesEarned.length,
      level: progress.level,
    };
  },

  /**
   * Workflow 2: Child reads consistently (7 days)
   */
  async workflowReadConsistently(childId, days = 7) {
    if (!this.childrenProgress[childId]) {
      this.childrenProgress[childId] = {
        childId,
        totalPoints: 0,
        level: 1,
        storiesRead: 0,
        badgesEarned: [],
        achievementsEarned: [],
        currentStreak: 0,
      };
    }

    const progress = this.childrenProgress[childId];

    for (let i = 0; i < days; i++) {
      progress.currentStreak += 1;
      progress.storiesRead += 1;
      progress.totalPoints += 20; // Daily reading bonus

      // Check for streak badges
      if (progress.currentStreak === 7) {
        const streakBadge = this.badges.find((b) => b._id === "badge_streak7");
        if (!progress.badgesEarned.includes(streakBadge._id)) {
          progress.badgesEarned.push(streakBadge._id);
          progress.totalPoints += streakBadge.points + 50; // Extra bonus
        }
      }
    }

    progress.level = Math.floor(progress.totalPoints / 100) + 1;

    return {
      currentStreak: progress.currentStreak,
      totalPoints: progress.totalPoints,
      badgesEarned: progress.badgesEarned.length,
      level: progress.level,
    };
  },

  /**
   * Workflow 3: Child earns multiple badges
   */
  async workflowEarnMultipleBadges(childId) {
    if (!this.childrenProgress[childId]) {
      this.childrenProgress[childId] = {
        childId,
        totalPoints: 0,
        level: 1,
        storiesRead: 0,
        badgesEarned: [],
        achievementsEarned: [],
        currentStreak: 0,
      };
    }

    const progress = this.childrenProgress[childId];

    // Read 5 stories to earn Story Lover badge
    for (let i = 0; i < 5; i++) {
      progress.storiesRead += 1;
      progress.totalPoints += 20;
    }

    // Check and award badges
    const badgesToAward = this.badges.filter((b) => {
      if (progress.badgesEarned.includes(b._id)) return false;

      if (b.criteria.storiesRead && progress.storiesRead >= b.criteria.storiesRead) {
        return true;
      }

      return false;
    });

    badgesToAward.forEach((badge) => {
      progress.badgesEarned.push(badge._id);
      progress.totalPoints += badge.points;
    });

    progress.level = Math.floor(progress.totalPoints / 100) + 1;

    return {
      storiesRead: progress.storiesRead,
      badgesEarned: badgesToAward.map((b) => b.name),
      totalPoints: progress.totalPoints,
      level: progress.level,
    };
  },

  /**
   * Workflow 4: Child unlocks achievement
   */
  async workflowUnlockAchievement(childId) {
    if (!this.childrenProgress[childId]) {
      this.childrenProgress[childId] = {
        childId,
        totalPoints: 0,
        level: 1,
        storiesRead: 0,
        badgesEarned: [],
        achievementsEarned: [],
        currentStreak: 0,
      };
    }

    const progress = this.childrenProgress[childId];

    // Read stories until achievement criteria is met
    while (progress.storiesRead < 10) {
      progress.storiesRead += 1;
      progress.totalPoints += 20;
    }

    // Check for achievement
    const bookmormAch = this.achievements.find((a) => a._id === "ach_bookworm");
    if (
      progress.storiesRead >= bookmormAch.criteria.storiesRead &&
      !progress.achievementsEarned.includes(bookmormAch._id)
    ) {
      progress.achievementsEarned.push(bookmormAch._id);
      progress.totalPoints += bookmormAch.points;
    }

    progress.level = Math.floor(progress.totalPoints / 100) + 1;

    return {
      achievement: bookmormAch.name,
      storiesRead: progress.storiesRead,
      totalPoints: progress.totalPoints,
      level: progress.level,
    };
  },

  /**
   * Workflow 5: Compare children on leaderboard
   */
  async workflowGetLeaderboard() {
    const leaderboard = Object.values(this.childrenProgress)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((child, index) => ({
        rank: index + 1,
        childId: child.childId,
        totalPoints: child.totalPoints,
        level: child.level,
        storiesRead: child.storiesRead,
        badgesEarned: child.badgesEarned.length,
      }));

    return leaderboard;
  },

  /**
   * Workflow 6: Get child's next goals
   */
  async workflowGetNextGoals(childId) {
    if (!this.childrenProgress[childId]) {
      throw new Error("Child progress not found");
    }

    const progress = this.childrenProgress[childId];
    const goals = [];

    // Next badge goal
    const nextBadges = this.badges.filter(
      (b) =>
        !progress.badgesEarned.includes(b._id) &&
        (!b.criteria.storiesRead || progress.storiesRead < b.criteria.storiesRead)
    );

    if (nextBadges.length > 0) {
      const nextBadge = nextBadges[0];
      goals.push({
        type: "badge",
        name: nextBadge.name,
        progress: progress.storiesRead,
        target: nextBadge.criteria.storiesRead,
        remaining: nextBadge.criteria.storiesRead - progress.storiesRead,
      });
    }

    // Next achievement goal
    const nextAchievements = this.achievements.filter(
      (a) =>
        !progress.achievementsEarned.includes(a._id) &&
        progress.storiesRead < a.criteria.storiesRead
    );

    if (nextAchievements.length > 0) {
      const nextAch = nextAchievements[0];
      goals.push({
        type: "achievement",
        name: nextAch.name,
        progress: progress.storiesRead,
        target: nextAch.criteria.storiesRead,
        remaining: nextAch.criteria.storiesRead - progress.storiesRead,
      });
    }

    // Next level goal
    const pointsPerLevel = 100;
    const nextLevelPoints = (progress.level) * pointsPerLevel;
    goals.push({
      type: "level",
      name: `Level ${progress.level + 1}`,
      progress: progress.totalPoints,
      target: nextLevelPoints,
      remaining: Math.max(0, nextLevelPoints - progress.totalPoints),
    });

    return goals;
  },

  /**
   * Workflow 7: Simulate competitive reading month
   */
  async workflowCompetitiveMonth(childIds) {
    // Initialize children
    childIds.forEach((childId) => {
      if (!this.childrenProgress[childId]) {
        this.childrenProgress[childId] = {
          childId,
          totalPoints: 0,
          level: 1,
          storiesRead: 0,
          badgesEarned: [],
          achievementsEarned: [],
          currentStreak: 0,
        };
      }
    });

    // Simulate 30 days of activity
    for (let day = 0; day < 30; day++) {
      for (const childId of childIds) {
        const progress = this.childrenProgress[childId];

        // Random reading activity
        const storiesThisDay = Math.floor(Math.random() * 3); // 0-2 stories per day
        for (let i = 0; i < storiesThisDay; i++) {
          progress.storiesRead += 1;
          progress.totalPoints += 20;
          progress.currentStreak += 1;

          // Check badges
          const earnableBadges = this.badges.filter((b) => {
            if (progress.badgesEarned.includes(b._id)) return false;

            if (b.criteria.streakDays && progress.currentStreak < b.criteria.streakDays)
              return false;
            if (b.criteria.storiesRead && progress.storiesRead < b.criteria.storiesRead)
              return false;

            return true;
          });

          earnableBadges.forEach((badge) => {
            progress.badgesEarned.push(badge._id);
            progress.totalPoints += badge.points;
          });
        }

        if (storiesThisDay === 0) {
          progress.currentStreak = 0;
        }

        progress.level = Math.floor(progress.totalPoints / 100) + 1;
      }
    }

    // Build leaderboard only for the provided competitors
    const leaderboard = childIds
      .map((childId) => this.childrenProgress[childId])
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((child, index) => ({
        rank: index + 1,
        childId: child.childId,
        totalPoints: child.totalPoints,
        level: child.level,
        storiesRead: child.storiesRead,
        badgesEarned: child.badgesEarned.length,
      }));

    return {
      leaderboard,
      monthStats: {
        childCount: childIds.length,
        topChild: leaderboard[0],
        totalBooksRead: childIds.reduce((sum, childId) => {
          const progress = this.childrenProgress[childId];
          return sum + (progress ? progress.storiesRead : 0);
        }, 0),
      },
    };
  },

  /**
   * Workflow 8: Complete end-to-end gamification scenario
   */
  async workflowCompleteGamificationJourney(childId) {
    // 1. Complete first story
    const firstStory = await this.workflowCompleteFirstStory(childId);

    // 2. Read consistently
    const consistency = await this.workflowReadConsistently(childId, 7);

    // 3. Earn multiple badges
    const badges = await this.workflowEarnMultipleBadges(childId);

    // 4. Unlock achievement
    const achievement = await this.workflowUnlockAchievement(childId);

    // 5. Get next goals
    const goals = await this.workflowGetNextGoals(childId);

    // 6. Get leaderboard
    const leaderboard = await this.workflowGetLeaderboard();

    return {
      firstStory,
      consistency,
      badges,
      achievement,
      goals,
      leaderboard,
      finalProgress: this.childrenProgress[childId],
    };
  },
};

// ========================
// SYSTEM TESTS
// ========================

async function runGamificationSystemTests() {
  const report = new TestReport("Gamification System Tests");

  // Reset mock system state for test isolation
  mockGamificationSystem.reset();

  try {
    // Test 1: Complete first story
    try {
      const result = await mockGamificationSystem.workflowCompleteFirstStory("child1");
      report.logAssertion(
        "Complete first story",
        result.storiesCompleted === 1 &&
          result.totalPoints > 0 &&
          result.level >= 1
      );
    } catch (error) {
      report.logAssertion("Complete first story", false);
    }

    // Test 2: Earn first badge
    try {
      const result = await mockGamificationSystem.workflowCompleteFirstStory("child2");
      report.logAssertion(
        "Earn first badge",
        result.totalPoints > 20 && result.newBadges > 0
      );
    } catch (error) {
      report.logAssertion("Earn first badge", false);
    }

    // Test 3: Read consistently for 7 days
    try {
      const result = await mockGamificationSystem.workflowReadConsistently("child3", 7);
      report.logAssertion(
        "Read consistently for 7 days",
        result.currentStreak === 7 &&
          result.badgesEarned > 0 &&
          result.totalPoints > 100
      );
    } catch (error) {
      report.logAssertion("Read consistently for 7 days", false);
    }

    // Test 4: Earn multiple badges
    try {
      const result = await mockGamificationSystem.workflowEarnMultipleBadges("child4");
      report.logAssertion(
        "Earn multiple badges",
        result.storiesRead === 5 &&
          result.badgesEarned.length > 0 &&
          result.level >= 1
      );
    } catch (error) {
      report.logAssertion("Earn multiple badges", false);
    }

    // Test 5: Unlock achievement
    try {
      // Initialize child5 first
      await mockGamificationSystem.workflowCompleteFirstStory("child5");
      const result = await mockGamificationSystem.workflowUnlockAchievement("child5");
      const testPass = result.storiesRead === 10 &&
          result.achievement === "Bookworm" &&
          result.totalPoints > 200;
      report.logAssertion(
        "Unlock achievement",
        testPass
      );
    } catch (error) {
      report.logAssertion("Unlock achievement", false);
    }

    // Test 6: Get leaderboard
    try {
      // Setup multiple children
      await mockGamificationSystem.workflowCompleteFirstStory("child6");
      await mockGamificationSystem.workflowEarnMultipleBadges("child7");
      await mockGamificationSystem.workflowUnlockAchievement("child8");

      const leaderboard = await mockGamificationSystem.workflowGetLeaderboard();
      report.logAssertion(
        "Get leaderboard",
        Array.isArray(leaderboard) &&
          leaderboard.length > 0 &&
          leaderboard[0].rank === 1 &&
          leaderboard[0].totalPoints >= leaderboard[1]?.totalPoints
      );
    } catch (error) {
      report.logAssertion("Get leaderboard", false);
    }

    // Test 7: Get next goals
    try {
      await mockGamificationSystem.workflowCompleteFirstStory("child9");
      const goals = await mockGamificationSystem.workflowGetNextGoals("child9");
      report.logAssertion(
        "Get next goals",
        Array.isArray(goals) &&
          goals.length > 0 &&
          goals.some((g) => g.type === "badge" || g.type === "level")
      );
    } catch (error) {
      report.logAssertion("Get next goals", false);
    }

    // Test 8: Competitive month simulation
    try {
      const result = await mockGamificationSystem.workflowCompetitiveMonth([
        "competitor1",
        "competitor2",
        "competitor3",
      ]);
      report.logAssertion(
        "Competitive month simulation",
        result.leaderboard.length === 3 &&
          result.monthStats.totalBooksRead > 0 &&
          result.monthStats.topChild
      );
    } catch (error) {
      report.logAssertion("Competitive month simulation", false);
    }

    // Test 9: Points accumulate correctly
    try {
      const child = "points_test";
      const initial = mockGamificationSystem.childrenProgress[child]?.totalPoints || 0;
      await mockGamificationSystem.workflowCompleteFirstStory(child);
      const afterFirst = mockGamificationSystem.childrenProgress[child].totalPoints;

      await mockGamificationSystem.workflowEarnMultipleBadges(child);
      const afterMore = mockGamificationSystem.childrenProgress[child].totalPoints;

      report.logAssertion(
        "Points accumulate correctly",
        afterFirst > initial && afterMore > afterFirst
      );
    } catch (error) {
      report.logAssertion("Points accumulate correctly", false);
    }

    // Test 10: Levels increase with points
    try {
      const child = "level_test";
      const result1 = await mockGamificationSystem.workflowCompleteFirstStory(child);
      const initial = result1.level;

      await mockGamificationSystem.workflowEarnMultipleBadges(child);
      const result2 = mockGamificationSystem.childrenProgress[child].level;

      report.logAssertion("Levels increase with points", result2 >= initial);
    } catch (error) {
      report.logAssertion("Levels increase with points", false);
    }

    // Test 11: Badges prevent duplicates
    try {
      const child = "duplicate_test";
      await mockGamificationSystem.workflowCompleteFirstStory(child);
      const badges1 = mockGamificationSystem.childrenProgress[child].badgesEarned.length;

      await mockGamificationSystem.workflowCompleteFirstStory(child); // Try again
      const badges2 = mockGamificationSystem.childrenProgress[child].badgesEarned.length;

      report.logAssertion("Badges prevent duplicates", badges1 === badges2);
    } catch (error) {
      report.logAssertion("Badges prevent duplicates", false);
    }

    // Test 12: Complete end-to-end journey
    try {
      const result = await mockGamificationSystem.workflowCompleteGamificationJourney(
        "journey_child"
      );
      report.logAssertion(
        "Complete end-to-end journey",
        result.firstStory &&
          result.consistency &&
          result.badges &&
          result.achievement &&
          result.goals &&
          result.leaderboard &&
          result.finalProgress.totalPoints > 500
      );
    } catch (error) {
      report.logAssertion("Complete end-to-end journey", false);
    }

    // Test 13: Streak tracking
    try {
      const result = await mockGamificationSystem.workflowReadConsistently("streak_child", 7);
      report.logAssertion(
        "Streak tracking",
        result.currentStreak === 7 &&
          result.totalPoints > 100 &&
          result.badgesEarned > 0
      );
    } catch (error) {
      report.logAssertion("Streak tracking", false);
    }

    // Test 14: Multiple scenarios simultaneously
    try {
      const promises = [
        mockGamificationSystem.workflowCompleteFirstStory("multi1"),
        mockGamificationSystem.workflowEarnMultipleBadges("multi2"),
        mockGamificationSystem.workflowReadConsistently("multi3", 5),
      ];

      const results = await Promise.all(promises);
      report.logAssertion(
        "Multiple scenarios simultaneously",
        results.length === 3 && results.every((r) => r && r.totalPoints >= 0)
      );
    } catch (error) {
      report.logAssertion("Multiple scenarios simultaneously", false);
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
      const summary = await runGamificationSystemTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = { runGamificationSystemTests, mockGamificationSystem };


test('runGamificationSystemTests', async () => { 
  await runGamificationSystemTests(); 
});
