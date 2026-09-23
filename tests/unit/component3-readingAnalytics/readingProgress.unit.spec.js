/**
 * Component 3: Reading Progress & Analytics
 * UNIT TESTS - Reading Progress Service
 * Owner: VAGEESHA
 *
 * Tests core reading analytics calculations, progress tracking, and statistics generation
 */

const { TestReport } = require("../../config/test-utils");
const { dummyReadingSessions } = require("../../fixtures/dummy-data");
const { test } = require('@playwright/test');

// Mock Reading Progress Service for unit testing
const mockReadingProgressService = {
  /**
   * Calculate reading progress percentage
   */
  calculateProgress(currentPage, totalPages) {
    if (!currentPage || !totalPages || totalPages === 0) {
      return 0;
    }
    return Math.round((currentPage / totalPages) * 100);
  },

  /**
   * Calculate time spent reading (in minutes)
   */
  calculateTimeSpent(startTime, endTime) {
    if (!startTime || !endTime) {
      return 0;
    }
    const diffMs = new Date(endTime) - new Date(startTime);
    return Math.round(diffMs / 1000 / 60); // Convert to minutes
  },

  /**
   * Calculate reading speed (pages per hour)
   */
  calculateReadingSpeed(pagesRead, timeInMinutes) {
    if (!pagesRead || !timeInMinutes || timeInMinutes === 0) {
      return 0;
    }
    return Math.round((pagesRead / timeInMinutes) * 60);
  },

  /**
   * Calculate estimated time to finish
   */
  calculateTimeToFinish(currentPage, totalPages, readingSpeed) {
    if (!readingSpeed || readingSpeed <= 0) {
      return null;
    }
    const remainingPages = totalPages - currentPage;
    const hoursNeeded = remainingPages / readingSpeed;
    return Math.round(hoursNeeded * 60); // Return in minutes
  },

  /**
   * Check if reading session is complete
   */
  isSessionComplete(currentPage, totalPages) {
    return currentPage >= totalPages;
  },

  /**
   * Validate reading progress data
   */
  validateProgressData(sessionData) {
    const errors = [];

    if (!sessionData.childId) {
      errors.push("Child ID is required");
    }

    if (!sessionData.storyId) {
      errors.push("Story ID is required");
    }

    if (!sessionData.totalPages || sessionData.totalPages <= 0) {
      errors.push("Total pages must be greater than 0");
    }

    if (sessionData.currentPage && sessionData.currentPage > sessionData.totalPages) {
      errors.push("Current page cannot exceed total pages");
    }

    if (sessionData.currentPage && sessionData.currentPage < 0) {
      errors.push("Current page cannot be negative");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Get session status
   */
  getSessionStatus(currentPage, totalPages, endTime) {
    if (endTime) {
      return "completed";
    }
    if (currentPage > 0) {
      return "reading";
    }
    return "not-started";
  },

  /**
   * Calculate daily reading time
   */
  calculateDailyReadingTime(sessions) {
    const todaySessions = sessions.filter((s) => {
      const sessionDate = new Date(s.startTime).toDateString();
      const today = new Date().toDateString();
      return sessionDate === today;
    });

    return todaySessions.reduce((total, session) => {
      const timeSpent = this.calculateTimeSpent(session.startTime, session.endTime || new Date());
      return total + timeSpent;
    }, 0);
  },

  /**
   * Calculate weekly reading statistics
   */
  calculateWeeklyStats(sessions) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekSessions = sessions.filter((s) => new Date(s.startTime) > sevenDaysAgo);

    const totalTimeMinutes = weekSessions.reduce((total, session) => {
      const timeSpent = this.calculateTimeSpent(session.startTime, session.endTime);
      return total + timeSpent;
    }, 0);

    const completedCount = weekSessions.filter(
      (s) => s.status === "completed" || this.isSessionComplete(s.currentPage, s.totalPages)
    ).length;

    return {
      sessionsCount: weekSessions.length,
      totalTimeMinutes,
      completedStories: completedCount,
      averageTimePerSession:
        weekSessions.length > 0 ? Math.round(totalTimeMinutes / weekSessions.length) : 0,
    };
  },

  /**
   * Calculate total completed stories
   */
  calculateTotalCompleted(sessions) {
    return sessions.filter((s) => this.isSessionComplete(s.currentPage, s.totalPages)).length;
  },

  /**
   * Get reading streak
   */
  getReadingStreak(sessions) {
    if (sessions.length === 0) return 0;

    const sortedByDate = [...sessions].sort(
      (a, b) => new Date(b.startTime) - new Date(a.startTime)
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sortedByDate) {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }

    return Math.max(0, streak - 1); // -1 because we don't count today asyet
  },

  /**
   * Compare reading levels
   */
  compareReadingLevels(sessions1, sessions2) {
    const level1 = sessions1.reduce((avg, s) => avg + this.calculateReadingSpeed(s.currentPage, this.calculateTimeSpent(s.startTime, s.endTime)), 0) / Math.max(sessions1.length, 1);
    const level2 = sessions2.reduce((avg, s) => avg + this.calculateReadingSpeed(s.currentPage, this.calculateTimeSpent(s.startTime, s.endTime)), 0) / Math.max(sessions2.length, 1);
    return level1 > level2 ? 1 : level1 < level2 ? -1 : 0;
  },

  /**
   * Get reading recommendations based on pace
   */
  getReadingRecommendations(sessions) {
    const recommendations = [];

    const weeklyStats = this.calculateWeeklyStats(sessions);
    const avgTimePerSession = weeklyStats.averageTimePerSession;

    if (avgTimePerSession < 10) {
      recommendations.push("Try reading longer sessions to improve comprehension");
    }

    if (weeklyStats.sessionsCount < 3) {
      recommendations.push("Consider scheduling more regular reading sessions");
    }

    if (weeklyStats.sessionsCount > 5) {
      recommendations.push("Great reading habits! Keep it up!");
    }

    return recommendations;
  },
};

// ========================
// UNIT TESTS
// ========================

async function runReadingProgressUnitTests() {
  const report = new TestReport("Reading Progress Unit Tests");

  // Test 1: Calculate progress percentage
  try {
    const progress = mockReadingProgressService.calculateProgress(25, 100);
    report.logAssertion("Calculate progress percentage", progress === 25);
  } catch (error) {
    report.logAssertion("Calculate progress percentage", false);
  }

  // Test 2: Calculate progress at 50%
  try {
    const progress = mockReadingProgressService.calculateProgress(50, 100);
    report.logAssertion("Calculate 50% progress", progress === 50);
  } catch (error) {
    report.logAssertion("Calculate 50% progress", false);
  }

  // Test 3: Calculate progress at completion
  try {
    const progress = mockReadingProgressService.calculateProgress(100, 100);
    report.logAssertion("Calculate 100% progress", progress === 100);
  } catch (error) {
    report.logAssertion("Calculate 100% progress", false);
  }

  // Test 4: Handle zero pages
  try {
    const progress = mockReadingProgressService.calculateProgress(0, 100);
    report.logAssertion("Handle zero current pages", progress === 0);
  } catch (error) {
    report.logAssertion("Handle zero current pages", false);
  }

  // Test 5: Calculate time spent
  try {
    const start = new Date("2024-01-01T10:00:00");
    const end = new Date("2024-01-01T10:30:00");
    const minutes = mockReadingProgressService.calculateTimeSpent(start, end);
    report.logAssertion("Calculate 30 minutes time spent", minutes === 30);
  } catch (error) {
    report.logAssertion("Calculate 30 minutes time spent", false);
  }

  // Test 6: Calculate time spent (2 hours)
  try {
    const start = new Date("2024-01-01T10:00:00");
    const end = new Date("2024-01-01T12:00:00");
    const minutes = mockReadingProgressService.calculateTimeSpent(start, end);
    report.logAssertion("Calculate 2 hours time spent", minutes === 120);
  } catch (error) {
    report.logAssertion("Calculate 2 hours time spent", false);
  }

  // Test 7: Calculate reading speed
  try {
    const speed = mockReadingProgressService.calculateReadingSpeed(30, 60); // 30 pages in 60 minutes
    report.logAssertion(
      "Calculate reading speed",
      speed === 30 // 30 pages per hour
    );
  } catch (error) {
    report.logAssertion("Calculate reading speed", false);
  }

  // Test 8: Calculate time to finish
  try {
    const timeToFinish = mockReadingProgressService.calculateTimeToFinish(
      50,
      100,
      30 // 30 pages per hour
    );
    report.logAssertion(
      "Calculate time to finish",
      timeToFinish === 100 // 50 remaining pages at 30 pages/hour = 100 minutes
    );
  } catch (error) {
    report.logAssertion("Calculate time to finish", false);
  }

  // Test 9: Check session is complete
  try {
    const isComplete = mockReadingProgressService.isSessionComplete(100, 100);
    const isNotComplete = mockReadingProgressService.isSessionComplete(50, 100);
    report.logAssertion(
      "Check session completion",
      isComplete === true && isNotComplete === false
    );
  } catch (error) {
    report.logAssertion("Check session completion", false);
  }

  // Test 10: Validate valid progress data
  try {
    const validation = mockReadingProgressService.validateProgressData({
      childId: "child123",
      storyId: "story456",
      totalPages: 100,
      currentPage: 50,
    });
    report.logAssertion("Validate valid progress data", validation.isValid === true);
  } catch (error) {
    report.logAssertion("Validate valid progress data", false);
  }

  // Test 11: Reject invalid progress data (current > total)
  try {
    const validation = mockReadingProgressService.validateProgressData({
      childId: "child123",
      storyId: "story456",
      totalPages: 100,
      currentPage: 150,
    });
    report.logAssertion(
      "Reject progress exceeding total pages",
      validation.isValid === false && validation.errors.length > 0
    );
  } catch (error) {
    report.logAssertion("Reject progress exceeding total pages", false);
  }

  // Test 12: Get session status - not started
  try {
    const status = mockReadingProgressService.getSessionStatus(0, 100, null);
    report.logAssertion("Get not-started status", status === "not-started");
  } catch (error) {
    report.logAssertion("Get not-started status", false);
  }

  // Test 13: Get session status - reading
  try {
    const status = mockReadingProgressService.getSessionStatus(50, 100, null);
    report.logAssertion("Get reading status", status === "reading");
  } catch (error) {
    report.logAssertion("Get reading status", false);
  }

  // Test 14: Get session status - completed
  try {
    const status = mockReadingProgressService.getSessionStatus(100, 100, new Date());
    report.logAssertion("Get completed status", status === "completed");
  } catch (error) {
    report.logAssertion("Get completed status", false);
  }

  // Test 15: Calculate daily reading time
  try {
    const today = new Date();
    const sessions = [
      {
        startTime: today,
        endTime: new Date(today.getTime() + 30 * 60 * 1000),
      },
      {
        startTime: today,
        endTime: new Date(today.getTime() + 45 * 60 * 1000),
      },
    ];
    const dailyTime = mockReadingProgressService.calculateDailyReadingTime(sessions);
    report.logAssertion(
      "Calculate daily reading time",
      dailyTime === 75 // 30 + 45 minutes
    );
  } catch (error) {
    report.logAssertion("Calculate daily reading time", false);
  }

  // Test 16: Calculate weekly statistics
  try {
    const sessions = [
      {
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        currentPage: 100,
        totalPages: 100,
        status: "completed",
      },
    ];
    const weeklyStats = mockReadingProgressService.calculateWeeklyStats(sessions);
    report.logAssertion(
      "Calculate weekly statistics",
      weeklyStats.sessionsCount === 1 && weeklyStats.completedStories === 1
    );
  } catch (error) {
    report.logAssertion("Calculate weekly statistics", false);
  }

  // Test 17: Calculate total completed stories
  try {
    const sessions = [
      { currentPage: 100, totalPages: 100 },
      { currentPage: 50, totalPages: 100 },
      { currentPage: 200, totalPages: 200 },
    ];
    const completed = mockReadingProgressService.calculateTotalCompleted(sessions);
    report.logAssertion("Calculate total completed stories", completed === 2);
  } catch (error) {
    report.logAssertion("Calculate total completed stories", false);
  }

  // Test 18: Get reading streak
  try {
    const today = new Date();
    const sessions = [
      { startTime: today }, // Today
      { startTime: new Date(today.getTime() - 24 * 60 * 60 * 1000) }, // Yesterday
      { startTime: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) }, // 2 days ago
    ];
    const streak = mockReadingProgressService.getReadingStreak(sessions);
    report.logAssertion("Get reading streak", streak >= 1);
  } catch (error) {
    report.logAssertion("Get reading streak", false);
  }

  // Test 19: Get reading recommendations for short sessions
  try {
    const sessions = [
      { startTime: new Date(), endTime: new Date(Date.now() + 5 * 60 * 1000) }, // 5 minutes
      { startTime: new Date(), endTime: new Date(Date.now() + 5 * 60 * 1000) },
    ];
    const recommendations = mockReadingProgressService.getReadingRecommendations(sessions);
    report.logAssertion(
      "Get reading recommendations for short sessions",
      recommendations.length > 0 &&
        recommendations.some((r) => r.includes("longer sessions"))
    );
  } catch (error) {
    report.logAssertion("Get reading recommendations for short sessions", false);
  }

  // Test 20: Realistic scenario - student reading progress
  try {
    const progress = mockReadingProgressService.calculateProgress(87, 250);
    const speed = mockReadingProgressService.calculateReadingSpeed(87, 105); // 1.75 hours
    const timeToFinish = mockReadingProgressService.calculateTimeToFinish(87, 250, speed);

    report.logAssertion(
      "Realistic reading scenario",
      progress > 0 && speed > 0 && timeToFinish !== null
    );
  } catch (error) {
    report.logAssertion("Realistic reading scenario", false);
  }

  report.print();
  return report.summary();
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const summary = await runReadingProgressUnitTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = { runReadingProgressUnitTests, mockReadingProgressService };


test('runReadingProgressUnitTests', async () => { 
  await runReadingProgressUnitTests(); 
});
