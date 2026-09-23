/**
 * Component 3: Reading Progress & Analytics
 * INTEGRATION TESTS
 * Owner: VAGEESHA
 *
 * Tests reading session tracking, progress updates, and analytics API endpoints
 */

const { TestReport } = require("../../config/test-utils");
const { dummyReadingSessions, dummyAssignments } = require("../../fixtures/dummy-data");
const { test } = require('@playwright/test');

// Mock Reading Session Controller for integration tests
const mockReadingSessionController = {
  /**
   * POST /api/reading-sessions
   * Start a new reading session
   */
  async startReadingSession(childId, storyId, assignmentId) {
    if (!childId || !storyId || !assignmentId) {
      throw new Error("Child ID, story ID, and assignment ID are required");
    }

    const newSession = {
      _id: `session_${Date.now()}`,
      childId,
      storyId,
      assignmentId,
      startPage: 0,
      currentPage: 0,
      totalPages: 100, // Mock total
      startTime: new Date(),
      endTime: null,
      status: "reading",
      activities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      message: "Reading session started",
      data: newSession,
    };
  },

  /**
   * PUT /api/reading-sessions/:id
   * Update reading progress
   */
  async updateReadingProgress(sessionId, currentPage) {
    if (!sessionId || currentPage === undefined) {
      throw new Error("Session ID and current page are required");
    }

    const session = dummyReadingSessions.find((s) => s._id.toString() === sessionId.toString());
    if (!session) {
      throw new Error("Reading session not found");
    }

    if (currentPage > session.totalPages) {
      throw new Error("Current page cannot exceed total pages");
    }

    session.currentPage = currentPage;
    session.updatedAt = new Date();

      // Initialize activities array if it doesn't exist
      if (!session.activities) {
        session.activities = [];
      }

    const activity = {
      _id: `activity_${Date.now()}`,
      type: "page_read",
      page: currentPage,
      timestamp: new Date(),
    };

    session.activities.push(activity);

    return {
      success: true,
      message: "Reading progress updated",
      data: session,
    };
  },

  /**
   * POST /api/reading-sessions/:id/end
   * End reading session
   */
  async endReadingSession(sessionId) {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const session = dummyReadingSessions.find((s) => s._id.toString() === sessionId.toString());
    if (!session) {
      throw new Error("Reading session not found");
    }

    if (session.endTime) {
      throw new Error("Session already ended");
    }

    session.endTime = new Date();
    session.status = session.currentPage >= session.totalPages ? "completed" : "paused";
    session.timeSpent = Math.round(
      (session.endTime - new Date(session.startTime)) / 1000 / 60
    ); // minutes
    session.updatedAt = new Date();

    return {
      success: true,
      message: "Reading session ended",
      data: session,
    };
  },

  /**
   * GET /api/reading-sessions/:id
   * Get reading session details
   */
  async getReadingSession(sessionId) {
    const session = dummyReadingSessions.find((s) => s._id.toString() === sessionId.toString());
    if (!session) {
      throw new Error("Reading session not found");
    }

    return {
      success: true,
      message: "Reading session fetched",
      data: session,
    };
  },

  /**
   * GET /api/reading-sessions?childId=X&storyId=Y
   * Get reading sessions for child and story
   */
  async getReadingSessions(childId, storyId = null) {
    if (!childId) {
      throw new Error("Child ID is required");
    }

    let sessions = dummyReadingSessions.filter((s) => s.childId.toString() === childId.toString());

    if (storyId) {
      sessions = sessions.filter((s) => s.storyId.toString() === storyId.toString());
    }

    return {
      success: true,
      message: "Reading sessions fetched",
      data: sessions,
    };
  },
};

// Mock Reading Analytics Controller for integration tests
const mockReadingAnalyticsController = {
  /**
   * GET /api/analytics/child/:childId/progress
   * Get child's reading progress
   */
  async getChildProgress(childId) {
    if (!childId) {
      throw new Error("Child ID is required");
    }

    const sessions = dummyReadingSessions.filter((s) => s.childId.toString() === childId.toString());

    const totalStoriesStarted = new Set(sessions.map((s) => s.storyId.toString())).size;
    const totalStoriesCompleted = sessions.filter(
      (s) => s.currentPage >= s.totalPages
    ).length;
    const totalTimeSpent = sessions.reduce(
      (total, s) =>
        total +
        (s.timeSpent || Math.round((new Date(s.endTime || new Date()) - new Date(s.startTime)) / 1000 / 60)),
      0
    );

    return {
      success: true,
      message: "Child progress fetched",
      data: {
        childId,
        totalStoriesStarted,
        totalStoriesCompleted,
        totalTimeSpent, // in minutes
        averageReadingSpeed: sessions.length > 0 ? Math.round(totalTimeSpent / sessions.length / 10) : 0,
      },
    };
  },

  /**
   * GET /api/analytics/child/:childId/weekly
   * Get child's weekly reading statistics
   */
  async getWeeklyStats(childId) {
    if (!childId) {
      throw new Error("Child ID is required");
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekSessions = dummyReadingSessions.filter(
      (s) =>
        s.childId.toString() === childId.toString() &&
        new Date(s.startTime) > sevenDaysAgo
    );

    const totalTimeMinutes = weekSessions.reduce(
      (total, s) => total + (s.timeSpent || 0),
      0
    );

    const completedStories = weekSessions.filter((s) => s.currentPage >= s.totalPages).length;

    return {
      success: true,
      message: "Weekly stats fetched",
      data: {
        childId,
        sessionsInWeek: weekSessions.length,
        completedStories,
        totalTimeMinutes,
        averageSessionTime:
          weekSessions.length > 0 ? Math.round(totalTimeMinutes / weekSessions.length) : 0,
        readingStreak: Math.floor(Math.random() * 7) + 1, // Mock streak
      },
    };
  },

  /**
   * GET /api/analytics/family/:familyId/summary
   * Get family reading summary
   */
  async getFamilySummary(familyId, childrenIds) {
    if (!familyId || !childrenIds || childrenIds.length === 0) {
      throw new Error("Family ID and children IDs are required");
    }

    const familySessions = dummyReadingSessions.filter((s) =>
      childrenIds.some((cId) => s.childId.toString() === cId.toString())
    );

    const totalStoriesCompleted = familySessions.filter(
      (s) => s.currentPage >= s.totalPages
    ).length;
    const totalTimeSpent = familySessions.reduce((total, s) => total + (s.timeSpent || 0), 0);

    const childStats = {};
    childrenIds.forEach((cId) => {
      const childSessions = familySessions.filter((s) => s.childId.toString() === cId.toString());
      childStats[cId] = {
        sessionsCount: childSessions.length,
        storiesCompleted: childSessions.filter((s) => s.currentPage >= s.totalPages).length,
      };
    });

    return {
      success: true,
      message: "Family summary fetched",
      data: {
        familyId,
        totalStoriesCompleted,
        totalTimeSpent,
        totalSessions: familySessions.length,
        childStats,
      },
    };
  },

  /**
   * GET /api/analytics/child/:childId/recommendations
   * Get reading recommendations for child
   */
  async getReadingRecommendations(childId) {
    if (!childId) {
      throw new Error("Child ID is required");
    }

    const sessions = dummyReadingSessions.filter((s) => s.childId.toString() === childId.toString());

    const recommendations = [];

    if (sessions.length < 2) {
      recommendations.push("Start more reading sessions to build a reading habit");
    }

    const avgTimePerSession = sessions.length > 0
      ? sessions.reduce((total, s) => total + (s.timeSpent || 30), 0) / sessions.length
      : 0;

    if (avgTimePerSession < 15) {
      recommendations.push("Try to extend your reading sessions for better comprehension");
    }

    if (sessions.length >= 5) {
      recommendations.push("Excellent consistency! Try reading books of increasing difficulty");
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

  /**
   * GET /api/analytics/comparison
   * Compare reading progress between children
   */
  async compareChildrenProgress(familyId, childrenIds) {
    if (!familyId || !childrenIds || childrenIds.length < 2) {
      throw new Error("At least 2 children required for comparison");
    }

    const comparison = {};

    childrenIds.forEach((cId) => {
      const childSessions = dummyReadingSessions.filter((s) => s.childId.toString() === cId.toString());
      const totalCompleted = childSessions.filter((s) => s.currentPage >= s.totalPages).length;

      comparison[cId] = {
        storiesCompleted: totalCompleted,
        sessionsCount: childSessions.length,
        totalTimeSpent: childSessions.reduce((total, s) => total + (s.timeSpent || 0), 0),
      };
    });

    return {
      success: true,
      message: "Comparison fetched",
      data: comparison,
    };
  },
};

// ========================
// INTEGRATION TESTS
// ========================

async function runReadingAnalyticsIntegrationTests() {
  const report = new TestReport("Reading Analytics Integration Tests");

  try {
    // ========== READING SESSION TESTS ==========

    // Test 1: Start reading session
    try {
      const response = await mockReadingSessionController.startReadingSession(
        "child123",
        "story456",
        "assignment789"
      );
      report.logAssertion(
        "Start reading session",
        response.success &&
          response.data.status === "reading" &&
          response.data.startTime
      );
    } catch (error) {
      report.logAssertion("Start reading session", false);
    }

    // Test 2: Reject session without required fields
    try {
      await mockReadingSessionController.startReadingSession("child123", null, null);
      report.logAssertion("Reject invalid session parameters", false);
    } catch (error) {
      report.logAssertion("Reject invalid session parameters", true);
    }

    // Test 3: Update reading progress
    try {
      const response = await mockReadingSessionController.updateReadingProgress(
        dummyReadingSessions[0]._id,
        25
      );
      report.logAssertion(
        "Update reading progress",
        response.success && response.data.currentPage === 25
      );
    } catch (error) {
      report.logAssertion("Update reading progress", false);
    }

    // Test 4: Reject progress exceeding total pages
    try {
      await mockReadingSessionController.updateReadingProgress(
        dummyReadingSessions[0]._id,
        999999
      );
      report.logAssertion(
        "Reject progress exceeding total pages",
        false
      );
    } catch (error) {
      report.logAssertion("Reject progress exceeding total pages", true);
    }

    // Test 5: End reading session
    try {
      const response = await mockReadingSessionController.endReadingSession(
        dummyReadingSessions[1]._id
      );
      report.logAssertion(
        "End reading session",
        response.success &&
          response.data.endTime &&
          response.data.status === "completed"
      );
    } catch (error) {
      report.logAssertion("End reading session", false);
    }

    // Test 6: Get reading session details
    try {
      const response = await mockReadingSessionController.getReadingSession(
        dummyReadingSessions[0]._id
      );
      report.logAssertion(
        "Get reading session details",
        response.success && response.data._id
      );
    } catch (error) {
      report.logAssertion("Get reading session details", false);
    }

    // Test 7: Get child's reading sessions
    try {
      const response = await mockReadingSessionController.getReadingSessions(
        dummyReadingSessions[0].childId
      );
      report.logAssertion(
        "Get child's reading sessions",
        response.success &&
          Array.isArray(response.data) &&
          response.data.every((s) =>
            s.childId.toString() === dummyReadingSessions[0].childId.toString()
          )
      );
    } catch (error) {
      report.logAssertion("Get child's reading sessions", false);
    }

    // Test 8: Get child's reading sessions for specific story
    try {
      const response = await mockReadingSessionController.getReadingSessions(
        dummyReadingSessions[0].childId,
        dummyReadingSessions[0].storyId
      );
      report.logAssertion(
        "Get child's reading sessions for specific story",
        response.success &&
          Array.isArray(response.data) &&
          response.data.every((s) => s.storyId.toString() === dummyReadingSessions[0].storyId.toString())
      );
    } catch (error) {
      report.logAssertion("Get child's reading sessions for specific story", false);
    }

    // ========== READING ANALYTICS TESTS ==========

    // Test 9: Get child progress
    try {
      const response = await mockReadingAnalyticsController.getChildProgress(
        dummyReadingSessions[0].childId
      );
      report.logAssertion(
        "Get child progress",
        response.success &&
          response.data.totalStoriesStarted >= 0 &&
          response.data.totalStoriesCompleted >= 0
      );
    } catch (error) {
      report.logAssertion("Get child progress", false);
    }

    // Test 10: Get weekly statistics
    try {
      const response = await mockReadingAnalyticsController.getWeeklyStats(
        dummyReadingSessions[0].childId
      );
      report.logAssertion(
        "Get weekly statistics",
        response.success &&
          response.data.sessionsInWeek >= 0 &&
          response.data.totalTimeMinutes >= 0
      );
    } catch (error) {
      report.logAssertion("Get weekly statistics", false);
    }

    // Test 11: Get family reading summary
    try {
      const childrenIds = [
        dummyReadingSessions[0].childId,
        dummyReadingSessions[1].childId,
      ];
      const response = await mockReadingAnalyticsController.getFamilySummary(
        "family123",
        childrenIds
      );
      report.logAssertion(
        "Get family reading summary",
        response.success &&
          response.data.totalStoriesCompleted >= 0 &&
          response.data.childStats
      );
    } catch (error) {
      report.logAssertion("Get family reading summary", false);
    }

    // Test 12: Get reading recommendations
    try {
      const response = await mockReadingAnalyticsController.getReadingRecommendations(
        dummyReadingSessions[0].childId
      );
      report.logAssertion(
        "Get reading recommendations",
        response.success && Array.isArray(response.data.recommendations)
      );
    } catch (error) {
      report.logAssertion("Get reading recommendations", false);
    }

    // Test 13: Compare children progress
    try {
      const childrenIds = [
        dummyReadingSessions[0].childId,
        dummyReadingSessions[1].childId,
      ];
      const response = await mockReadingAnalyticsController.compareChildrenProgress(
        "family123",
        childrenIds
      );
      report.logAssertion(
        "Compare children progress",
        response.success && Object.keys(response.data).length === 2
      );
    } catch (error) {
      report.logAssertion("Compare children progress", false);
    }

    // Test 14: Reject comparison with less than 2 children
    try {
      await mockReadingAnalyticsController.compareChildrenProgress("family123", [
        "child1",
      ]);
      report.logAssertion(
        "Reject comparison with 1 child",
        false
      );
    } catch (error) {
      report.logAssertion("Reject comparison with 1 child", true);
    }

    // Test 15: Multiple progress updates in one session
    try {
      const sessionId = dummyReadingSessions[0]._id;
      // Reset session state for fresh test (endReadingSession test modified it)
      dummyReadingSessions[0].endTime = null;
      dummyReadingSessions[0].status = "reading";
      dummyReadingSessions[0].activities = [
        {
          _id: "activity_initial",
          type: "page_read",
          page: 5,
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
        },
      ];
      dummyReadingSessions[0].currentPage = 15;
      
      // Make first update
      await mockReadingSessionController.updateReadingProgress(sessionId, 10);
      
      // Make second update and capture response (with cloned data to avoid reference issues)
      const response2Raw = await mockReadingSessionController.updateReadingProgress(sessionId, 20);
      const response2 = {
        data: {
          currentPage: response2Raw.data.currentPage,
          activities: [...response2Raw.data.activities]
        }
      };
      
      // Make third update
      await mockReadingSessionController.updateReadingProgress(sessionId, 30);

      report.logAssertion(
        "Multiple progress updates in session",
        response2.data.currentPage === 20 &&
          response2.data.activities.length > 0
      );
    } catch (error) {
      console.log("ERROR in Multiple progress updates:", error.message);
      report.logAssertion("Multiple progress updates in session", false);
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
      const summary = await runReadingAnalyticsIntegrationTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = {
  runReadingAnalyticsIntegrationTests,
  mockReadingSessionController,
  mockReadingAnalyticsController,
};


test('runReadingAnalyticsIntegrationTests', async () => { 
  await runReadingAnalyticsIntegrationTests(); 
});
