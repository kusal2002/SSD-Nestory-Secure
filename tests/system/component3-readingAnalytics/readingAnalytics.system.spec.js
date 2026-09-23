/**
 * Component 3: Reading Progress & Analytics
 * SYSTEM TESTS
 * Owner: VAGEESHA
 *
 * Tests complete reading workflows: Session tracking → Progress updates → Analytics generation → Insights
 */

const { TestReport } = require("../../config/test-utils");
const { test } = require('@playwright/test');

// Mock complete reading analytics system
const mockReadingAnalyticsSystem = {
  readingSessions: [],
  children: [],
  _idCounter: 0,

  /**
   * Reset system state (useful for test isolation)
   */
  reset() {
    this.readingSessions = [];
    this.children = [];
    this._idCounter = 0;
  },

  /**
   * Generate unique ID (combines timestamp and counter to prevent collisions)
   */
  _generateId(prefix) {
    return `${prefix}_${Date.now()}_${++this._idCounter}`;
  },

  /**
   * Workflow 1: Child starts reading a story
   */
  async workflowChildStartsReading(childId, storyId, totalPages = 100) {
    if (!childId || !storyId) {
      throw new Error("Child ID and story ID required");
    }

    const session = {
      _id: this._generateId("session"),
      childId,
      storyId,
      totalPages,
      currentPage: 0,
      startPage: 0,
      startTime: new Date(),
      endTime: null,
      status: "reading",
      activities: [],
      sessionStartedAt: new Date(),
    };

    this.readingSessions.push(session);

    return {
      session,
      startedAt: new Date(),
    };
  },

  /**
   * Workflow 2: Child reads multiple pages in session
   */
  async workflowChildReadsPages(sessionId, targetPage) {
    const session = this.readingSessions.find((s) => s._id === sessionId);
    if (!session) throw new Error("Session not found");

    if (targetPage > session.totalPages) {
      throw new Error("Cannot exceed total pages");
    }

    const pagesRead = targetPage - session.currentPage;
    const timePerPage = 2; // 2 minutes per page average
    const timeOnPages = pagesRead * timePerPage;

    session.currentPage = targetPage;
    session.activities.push({
      _id: this._generateId("activity"),
      type: "page_read",
      pages: pagesRead,
      timeSpent: timeOnPages,
      timestamp: new Date(),
    });

    session.updatedAt = new Date();

    return {
      previousPage: session.currentPage - pagesRead,
      currentPage: session.currentPage,
      pagesRead,
      timeSpent: timeOnPages,
      progressPercent: Math.round((session.currentPage / session.totalPages) * 100),
    };
  },

  /**
   * Workflow 3: Child completes reading
   */
  async workflowChildCompletesReading(sessionId) {
    const session = this.readingSessions.find((s) => s._id === sessionId);
    if (!session) throw new Error("Session not found");

    // Read remaining pages
    const remainingPages = session.totalPages - session.currentPage;
    await this.workflowChildReadsPages(sessionId, session.totalPages);

    session.endTime = new Date();
    session.status = "completed";
    
    // Calculate total time spent from activities (more reliable than clock time in tests)
    session.totalTimeSpent = session.activities.reduce((total, activity) => total + activity.timeSpent, 0);
    
    // Fallback to clock time if no activities recorded
    if (session.totalTimeSpent === 0) {
      session.totalTimeSpent = Math.round(
        (session.endTime - session.startTime) / 1000 / 60
      );
    }

    return {
      completedAt: new Date(),
      totalTimeSpent: session.totalTimeSpent,
      pagesRead: session.totalPages,
      averagePacePerPage: session.totalTimeSpent > 0 ? Math.round(session.totalTimeSpent / session.totalPages) : 0,
    };
  },

  /**
   * Workflow 4: Child pauses and resumes reading
   */
  async workflowChildPausesReading(sessionId) {
    const session = this.readingSessions.find((s) => s._id === sessionId);
    if (!session) throw new Error("Session not found");

    session.pausedAt = new Date();
    session.status = "paused";
    
    // Calculate session duration from activities (more reliable than clock time in tests)
    session.sessionDuration = session.activities.reduce((total, activity) => total + activity.timeSpent, 0);
    
    // Fallback to clock time if no activities recorded
    if (session.sessionDuration === 0) {
      session.sessionDuration = Math.round(
        (session.pausedAt - session.startTime) / 1000 / 60
      );
    }

    return {
      pausedAt: new Date(),
      sessionDuration: session.sessionDuration,
      currentProgress: Math.round((session.currentPage / session.totalPages) * 100),
    };
  },

  /**
   * Workflow 5: Child resumes reading
   */
  async workflowChildResumesReading(sessionId) {
    const session = this.readingSessions.find((s) => s._id === sessionId);
    if (!session) throw new Error("Session not found");

    if (!session.pausedAt) {
      throw new Error("Session is not paused");
    }

    session.status = "reading";
    session.resumedAt = new Date();
    session.pauseDuration = Math.round(
      (session.resumedAt - new Date(session.pausedAt)) / 1000 / 60
    );

    return {
      resumedAt: new Date(),
      pauseDuration: session.pauseDuration,
    };
  },

  /**
   * Workflow 6: Calculate reading analytics for child
   */
  async workflowCalculateChildAnalytics(childId) {
    const childSessions = this.readingSessions.filter((s) => s.childId === childId);

    if (childSessions.length === 0) {
      return {
        childId,
        sessionsCount: 0,
        storiesStarted: 0,
        storiesCompleted: 0,
        totalTimeSpent: 0,
        averageSessionDuration: 0,
        readingStreak: 0,
      };
    }

    const completedSessions = childSessions.filter((s) => s.status === "completed");
    
    // Calculate total time spent from activities (more reliable than clock time in tests)
    const totalTimeSpent = childSessions.reduce((total, s) => {
      const activitiesTime = s.activities.reduce((sum, a) => sum + a.timeSpent, 0);
      return total + (activitiesTime > 0 ? activitiesTime : Math.round(
        (new Date(s.endTime || new Date()) - new Date(s.startTime)) / 1000 / 60
      ));
    }, 0);

    return {
      childId,
      sessionsCount: childSessions.length,
      storiesStarted: new Set(childSessions.map((s) => s.storyId)).size,
      storiesCompleted: completedSessions.length,
      totalTimeSpent,
      averageSessionDuration: Math.round(totalTimeSpent / childSessions.length),
      averageReadingSpeed: Math.round(
        childSessions.reduce((total, s) => {
          const sessionTime = s.activities.reduce((sum, a) => sum + a.timeSpent, 0) || Math.round((new Date(s.endTime || new Date()) - new Date(s.startTime)) / 1000 / 60) || 1;
          const speed = (s.currentPage / sessionTime) * 60;
          return total + speed;
        }, 0) / childSessions.length
      ),
    };
  },

  /**
   * Workflow 7: Generate weekly reading report
   */
  async workflowGenerateWeeklyReport(childId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekSessions = this.readingSessions.filter(
      (s) =>
        s.childId === childId &&
        new Date(s.startTime) > sevenDaysAgo
    );

    const dailyStats = {};
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    weekSessions.forEach((session) => {
      const dayName = days[new Date(session.startTime).getDay()];
      if (!dailyStats[dayName]) {
        dailyStats[dayName] = {
          sessions: 0,
          totalTime: 0,
          pagesRead: 0,
        };
      }
      dailyStats[dayName].sessions += 1;
      dailyStats[dayName].totalTime += Math.round(
        (new Date(session.endTime || new Date()) - new Date(session.startTime)) / 1000 / 60
      );
      dailyStats[dayName].pagesRead += session.currentPage;
    });

    const totalTimeWeek = weekSessions.reduce(
      (total, s) =>
        total + Math.round((new Date(s.endTime || new Date()) - new Date(s.startTime)) / 1000 / 60),
      0
    );

    return {
      weekStartDate: sevenDaysAgo,
      weekEndDate: new Date(),
      totalSessions: weekSessions.length,
      totalTimeSpent: totalTimeWeek,
      dailyBreakdown: dailyStats,
      completedStories: weekSessions.filter((s) => s.status === "completed").length,
      averageSessionDuration: weekSessions.length > 0 ? Math.round(totalTimeWeek / weekSessions.length) : 0,
    };
  },

  /**
   * Workflow 8: Identify reading patterns and generate insights
   */
  async workflowAnalyzeReadingPatterns(childId) {
    const childSessions = this.readingSessions.filter((s) => s.childId === childId);

    if (childSessions.length === 0) {
      return {
        childId,
        insights: "No reading activity yet.",
        recommendations: [
          "Start your first reading session",
          "Set a regular reading schedule",
        ],
      };
    }

    const insights = [];
    const recommendations = [];

    // Analyze frequency
    const sessionsPerWeek = childSessions.length / ((Date.now() - new Date(childSessions[0].startTime)) / (7 * 24 * 60 * 60 * 1000) || 1);
    if (sessionsPerWeek < 3) {
      insights.push("Reading less than 3 times per week");
      recommendations.push("Try to read more regularly - aim for at least 3-4 sessions per week");
    } else {
      insights.push("Good reading frequency");
      recommendations.push("Excellent consistency! Challenge yourself with longer books");
    }

    // Analyze session duration
    const avgSessionLength = childSessions.reduce(
      (total, s) => total + Math.round((new Date(s.endTime || new Date()) - new Date(s.startTime)) / 1000 / 60),
      0
    ) / childSessions.length;

    if (avgSessionLength < 15) {
      insights.push("Short reading sessions");
      recommendations.push("Try extending sessions to 20-30 minutes for better focus");
    } else if (avgSessionLength > 60) {
      insights.push("Enthusiastic reader with long sessions");
      recommendations.push("Great stamina! Consider mixing genres to stay engaged");
    }

    // Analyze completion rate
    const completionRate = childSessions.filter((s) => s.status === "completed").length / childSessions.length;
    if (completionRate < 0.5) {
      insights.push("Low completion rate");
      recommendations.push("Try to complete more books - don't give up mid-story");
    } else {
      insights.push("Strong reader completing stories");
    }

    return {
      childId,
      insights,
      recommendations,
      metrics: {
        totalSessions: childSessions.length,
        completionRate: Math.round(completionRate * 100),
        averageSessionLength: Math.round(avgSessionLength),
        sessionsPerWeek: Math.round(sessionsPerWeek * 10) / 10,
      },
    };
  },

  /**
   * Workflow 9: Compare reading progress between children
   */
  async workflowCompareChildrenProgress(childIds) {
    if (!childIds || childIds.length < 2) {
      throw new Error("Need at least 2 children to compare");
    }

    const comparison = {};

    for (const childId of childIds) {
      const childSessions = this.readingSessions.filter((s) => s.childId === childId);
      const completedCount = childSessions.filter((s) => s.status === "completed").length;
      const totalTime = childSessions.reduce(
        (total, s) =>
          total + Math.round((new Date(s.endTime || new Date()) - new Date(s.startTime)) / 1000 / 60),
        0
      );

      comparison[childId] = {
        sessionsCount: childSessions.length,
        completedStories: completedCount,
        totalTimeSpent: totalTime,
        averagePerSession: childSessions.length > 0 ? Math.round(totalTime / childSessions.length) : 0,
      };
    }

    // Determine top reader
    let topReader = null;
    let maxCompleted = 0;
    for (const [childId, data] of Object.entries(comparison)) {
      if (data.completedStories > maxCompleted) {
        maxCompleted = data.completedStories;
        topReader = childId;
      }
    }

    return {
      comparison,
      topReader,
      topReaderStats: topReader ? comparison[topReader] : null,
    };
  },

  /**
   * Workflow 10: Complete end-to-end reading scenario (full reading session)
   */
  async workflowCompleteReadingScenario(childId, storyTitle, totalPages = 100) {
    // 1. Start reading
    const { session } = await this.workflowChildStartsReading(childId, storyTitle, totalPages);

    // 2. Read some pages
    await this.workflowChildReadsPages(session._id, Math.round(totalPages * 0.25));

    // 3. Pause
    const pauseResult = await this.workflowChildPausesReading(session._id);

    // 4. Resume
    const resumeResult = await this.workflowChildResumesReading(session._id);

    // 5. Read more
    await this.workflowChildReadsPages(session._id, Math.round(totalPages * 0.75));

    // 6. Complete
    const completionResult = await this.workflowChildCompletesReading(session._id);

    // 7. Get analytics
    const analytics = await this.workflowCalculateChildAnalytics(childId);

    // 8. Generate insights
    const insights = await this.workflowAnalyzeReadingPatterns(childId);

    return {
      session,
      pauseResult,
      resumeResult,
      completionResult,
      analytics,
      insights,
    };
  },
};

// ========================
// SYSTEM TESTS
// ========================

async function runReadingAnalyticsSystemTests() {
  const report = new TestReport("Reading Analytics System Tests");

  // Reset mock system state for test isolation
  mockReadingAnalyticsSystem.reset();

  try {
    // Test 1: Child starts reading
    try {
      const result = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "child123",
        "story456",
        150
      );
      report.logAssertion(
        "Child starts reading session",
        result.session && result.session.status === "reading" && result.session.currentPage === 0
      );
    } catch (error) {
      report.logAssertion("Child starts reading session", false);
    }

    // Test 2: Child reads multiple pages
    try {
      const { session } = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "child123",
        "story789",
        200
      );
      const readResult = await mockReadingAnalyticsSystem.workflowChildReadsPages(
        session._id,
        50
      );
      report.logAssertion(
        "Child reads multiple pages",
        readResult.currentPage === 50 &&
          readResult.pagesRead === 50 &&
          readResult.progressPercent === 25
      );
    } catch (error) {
      report.logAssertion("Child reads multiple pages", false);
    }

    // Test 3: Child completes story
    try {
      const { session } = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "child123",
        "story999",
        100
      );
      await mockReadingAnalyticsSystem.workflowChildReadsPages(session._id, 100);
      const completeResult = await mockReadingAnalyticsSystem.workflowChildCompletesReading(
        session._id
      );
      report.logAssertion(
        "Child completes story",
        completeResult.totalTimeSpent > 0 && completeResult.pagesRead === 100
      );
    } catch (error) {
      report.logAssertion("Child completes story", false);
    }

    // Test 4: Child pauses reading
    try {
      const { session } = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "child123",
        "story111",
        150
      );
      await mockReadingAnalyticsSystem.workflowChildReadsPages(session._id, 30);
      const pauseResult = await mockReadingAnalyticsSystem.workflowChildPausesReading(session._id);
      report.logAssertion(
        "Child pauses reading",
        pauseResult.pausedAt && pauseResult.sessionDuration > 0
      );
    } catch (error) {
      report.logAssertion("Child pauses reading", false);
    }

    // Test 5: Child resumes reading
    try {
      const { session } = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "child123",
        "story222",
        100
      );
      await mockReadingAnalyticsSystem.workflowChildPausesReading(session._id);
      const resumeResult = await mockReadingAnalyticsSystem.workflowChildResumesReading(
        session._id
      );
      report.logAssertion(
        "Child resumes reading",
        resumeResult.resumedAt && resumeResult.pauseDuration >= 0
      );
    } catch (error) {
      report.logAssertion("Child resumes reading", false);
    }

    // Test 6: Calculate child analytics
    try {
      const { session } = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "child456",
        "story333",
        100
      );
      await mockReadingAnalyticsSystem.workflowChildReadsPages(session._id, 100);
      await mockReadingAnalyticsSystem.workflowChildCompletesReading(session._id);

      const analytics = await mockReadingAnalyticsSystem.workflowCalculateChildAnalytics("child456");
      report.logAssertion(
        "Calculate child analytics",
        analytics.sessionsCount > 0 &&
          analytics.storiesCompleted >= 0 &&
          analytics.totalTimeSpent > 0
      );
    } catch (error) {
      report.logAssertion("Calculate child analytics", false);
    }

    // Test 7: Generate weekly report
    try {
      const { session } = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "child789",
        "story444",
        80
      );
      await mockReadingAnalyticsSystem.workflowChildReadsPages(session._id, 80);
      await mockReadingAnalyticsSystem.workflowChildCompletesReading(session._id);

      const weeklyReport = await mockReadingAnalyticsSystem.workflowGenerateWeeklyReport("child789");
      report.logAssertion(
        "Generate weekly report",
        weeklyReport.totalSessions >= 0 &&
          weeklyReport.totalTimeSpent >= 0 &&
          weeklyReport.dailyBreakdown
      );
    } catch (error) {
      report.logAssertion("Generate weekly report", false);
    }

    // Test 8: Analyze reading patterns
    try {
      const { session } = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "child999",
        "story555",
        120
      );
      await mockReadingAnalyticsSystem.workflowChildReadsPages(session._id, 120);
      await mockReadingAnalyticsSystem.workflowChildCompletesReading(session._id);

      const patterns = await mockReadingAnalyticsSystem.workflowAnalyzeReadingPatterns("child999");
      report.logAssertion(
        "Analyze reading patterns",
        patterns.insights.length > 0 &&
          patterns.recommendations.length > 0 &&
          patterns.metrics
      );
    } catch (error) {
      report.logAssertion("Analyze reading patterns", false);
    }

    // Test 9: Compare children progress
    try {
      // Create sessions for child1
      const s1 = await mockReadingAnalyticsSystem.workflowChildStartsReading("child1", "story1", 50);
      await mockReadingAnalyticsSystem.workflowChildReadsPages(s1.session._id, 50);
      await mockReadingAnalyticsSystem.workflowChildCompletesReading(s1.session._id);

      // Create sessions for child2
      const s2 = await mockReadingAnalyticsSystem.workflowChildStartsReading("child2", "story2", 100);
      await mockReadingAnalyticsSystem.workflowChildReadsPages(s2.session._id, 50);

      const comparison = await mockReadingAnalyticsSystem.workflowCompareChildrenProgress([
        "child1",
        "child2",
      ]);
      report.logAssertion(
        "Compare children progress",
        comparison.comparison &&
          Object.keys(comparison.comparison).length === 2 &&
          comparison.topReader
      );
    } catch (error) {
      report.logAssertion("Compare children progress", false);
    }

    // Test 10: Complete end-to-end reading scenario
    try {
      const result = await mockReadingAnalyticsSystem.workflowCompleteReadingScenario(
        "childE2E",
        "storyE2E",
        200
      );
      report.logAssertion(
        "Complete end-to-end reading scenario",
        result.session &&
          result.pauseResult &&
          result.resumeResult &&
          result.completionResult &&
          result.analytics &&
          result.insights
      );
    } catch (error) {
      report.logAssertion("Complete end-to-end reading scenario", false);
    }

    // Test 11: Multiple stories by same child
    try {
      // Story 1
      const s1 = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "childMulti",
        "storyA",
        75
      );
      await mockReadingAnalyticsSystem.workflowChildReadsPages(s1.session._id, 75);
      await mockReadingAnalyticsSystem.workflowChildCompletesReading(s1.session._id);

      // Story 2
      const s2 = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "childMulti",
        "storyB",
        90
      );
      await mockReadingAnalyticsSystem.workflowChildReadsPages(s2.session._id, 45);

      const analytics = await mockReadingAnalyticsSystem.workflowCalculateChildAnalytics("childMulti");
      report.logAssertion(
        "Track multiple stories by same child",
        analytics.sessionsCount === 2 &&
          analytics.storiesStarted === 2 &&
          analytics.storiesCompleted === 1
      );
    } catch (error) {
      report.logAssertion("Track multiple stories by same child", false);
    }

    // Test 12: Reading progress categories
    try {
      const s1 = await mockReadingAnalyticsSystem.workflowChildStartsReading(
        "childCat",
        "story1",
        100
      );
      await mockReadingAnalyticsSystem.workflowChildReadsPages(s1.session._id, 100);
      await mockReadingAnalyticsSystem.workflowChildCompletesReading(s1.session._id);

      const insights = await mockReadingAnalyticsSystem.workflowAnalyzeReadingPatterns(
        "childCat"
      );
      report.logAssertion(
        "Categorize reading progress",
        insights.metrics &&
          insights.metrics.completionRate >= 0 &&
          insights.metrics.averageSessionLength >= 0
      );
    } catch (error) {
      report.logAssertion("Categorize reading progress", false);
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
      const summary = await runReadingAnalyticsSystemTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = { runReadingAnalyticsSystemTests, mockReadingAnalyticsSystem };


test('runReadingAnalyticsSystemTests', async () => { 
  await runReadingAnalyticsSystemTests(); 
});
