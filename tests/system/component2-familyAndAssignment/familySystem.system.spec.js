/**
 * Component 2: Shared Family & Reading Assignment System
 * SYSTEM TESTS
 * Owner: LITHIRA
 *
 * Tests complete workflows: Family creation → Chat provisioning → Child addition → Story assignment → Communication
 */

const { TestReport } = require("../../config/test-utils");
const { test } = require('@playwright/test');

// Mock complete system for system tests
const mockFamilySystem = {
  families: [],
  chatGroups: [],
  assignments: [],
  chatMessages: [],
  _idCounter: 0, // Counter for unique IDs

  /**
   * Reset system state (useful for test isolation)
   */
  reset() {
    this.families = [];
    this.chatGroups = [];
    this.assignments = [];
    this.chatMessages = [];
    this._idCounter = 0;
  },

  /**
   * Generate unique ID (combines timestamp and counter to prevent collisions)
   */
  _generateId(prefix) {
    return `${prefix}_${Date.now()}_${++this._idCounter}`;
  },

  /**
   * Workflow 1: Parent creates family and automatic chat is provisioned
   */
  async workflowParentCreateFamily(parentId, familyName) {
    // Validate
    if (!parentId || !familyName) {
      throw new Error("Parent ID and family name required");
    }

    const newFamily = {
      _id: this._generateId("family"),
      name: familyName,
      parentId,
      members: [parentId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Automatically provision chat via third-party API
    const chatGroup = {
      _id: this._generateId("chat"),
      name: `${familyName} Chat`,
      familyId: newFamily._id,
      members: [parentId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    newFamily.chatGroupId = chatGroup._id;
    this.families.push(newFamily);
    this.chatGroups.push(chatGroup);

    return {
      family: newFamily,
      chat: chatGroup,
    };
  },

  /**
   * Workflow 2: Parent sends invitation to child (email/code)
   */
  async workflowParentInviteChild(familyId, childEmail) {
    const family = this.families.find((f) => f._id === familyId);
    if (!family) throw new Error("Family not found");

    // Simulate email invitation sent
    return {
      invitationSent: true,
      invitedEmail: childEmail,
      familyId,
      createdAt: new Date(),
    };
  },

  /**
   * Workflow 3: Child accepts invitation and joins family
   */
  async workflowChildAcceptInvitation(familyId, childId) {
    const family = this.families.find((f) => f._id === familyId);
    if (!family) throw new Error("Family not found");

    if (family.members.some((m) => m === childId)) {
      throw new Error("Child already in family");
    }

    // Add child to family
    family.members.push(childId);
    family.updatedAt = new Date();

    // Auto-add child to family chat
    const chat = this.chatGroups.find((c) => c._id === family.chatGroupId);
    if (chat) {
      chat.members.push(childId);
      chat.updatedAt = new Date();
    }

    return {
      family,
      chat,
      joinedAt: new Date(),
    };
  },

  /**
   * Workflow 4: Parent views children and available stories
   */
  async workflowParentViewChildren(familyId) {
    const family = this.families.find((f) => f._id === familyId);
    if (!family) throw new Error("Family not found");

    const children = family.members.filter((m) => typeof m === "string" && m.startsWith("child"));

    return {
      familyId,
      children: children.length,
      childrenCount: children,
    };
  },

  /**
   * Workflow 5: Parent assigns story to child
   */
  async workflowParentAssignStory(familyId, parentId, storyId, childId, dueDate = null) {
    const family = this.families.find((f) => f._id === familyId);
    if (!family) throw new Error("Family not found");

    if (family.parentId !== parentId) {
      throw new Error("Only family admin can assign stories");
    }

    if (!family.members.includes(childId)) {
      throw new Error("Child not in family");
    }

    const assignment = {
      _id: this._generateId("assignment"),
      familyId,
      parentId,
      childId,
      storyId,
      status: "assigned",
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assignments.push(assignment);

    return assignment;
  },

  /**
   * Workflow 6: Child sees assigned stories on dashboard
   */
  async workflowChildViewAssignments(childId) {
    const childAssignments = this.assignments.filter((a) => a.childId === childId);

    return {
      childId,
      assignedStories: childAssignments.length,
      assignments: childAssignments,
    };
  },

  /**
   * Workflow 7: Child starts reading assigned story
   */
  async workflowChildStartReading(assignmentId, childId) {
    const assignment = this.assignments.find((a) => a._id === assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.childId !== childId) {
      throw new Error("Unauthorized");
    }

    assignment.status = "in-progress";
    assignment.startedAt = new Date();
    assignment.updatedAt = new Date();

    return {
      assignment,
      readingStarted: true,
      startedAt: new Date(),
    };
  },

  /**
   * Workflow 8: Parent sends message in family chat
   */
  async workflowParentSendMessage(familyId, parentId, message) {
    const family = this.families.find((f) => f._id === familyId);
    if (!family) throw new Error("Family not found");

    if (family.parentId !== parentId) {
      throw new Error("Unauthorized");
    }

    const newMessage = {
      _id: this._generateId("msg"),
      chatGroupId: family.chatGroupId,
      senderId: parentId,
      senderName: "Parent",
      message,
      timestamp: new Date(),
      createdAt: new Date(),
    };

    this.chatMessages.push(newMessage);

    return newMessage;
  },

  /**
   * Workflow 9: Child receives message notification and replies
   */
  async workflowChildReceiveAndReplyMessage(chatGroupId, childId, replyMessage) {
    const chat = this.chatGroups.find((c) => c._id === chatGroupId);
    if (!chat) throw new Error("Chat not found");

    if (!chat.members.includes(childId)) {
      throw new Error("Not a chat member");
    }

    const reply = {
      _id: this._generateId("msg"),
      chatGroupId,
      senderId: childId,
      senderName: "Child",
      message: replyMessage,
      timestamp: new Date(),
      createdAt: new Date(),
    };

    this.chatMessages.push(reply);

    return {
      messageSent: reply,
      timestamp: new Date(),
    };
  },

  /**
   * Workflow 10: Child completes assignment
   */
  async workflowChildCompleteReading(assignmentId, childId) {
    const assignment = this.assignments.find((a) => a._id === assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.childId !== childId) {
      throw new Error("Unauthorized");
    }

    assignment.status = "completed";
    assignment.completedAt = new Date();
    assignment.updatedAt = new Date();

    return {
      assignment,
      readingCompleted: true,
      completedAt: new Date(),
    };
  },

  /**
   * Workflow 11: Parent views family activity dashboard
   */
  async workflowParentViewFamilyDashboard(familyId, parentId) {
    const family = this.families.find((f) => f._id === familyId);
    if (!family) throw new Error("Family not found");

    if (family.parentId !== parentId) {
      throw new Error("Unauthorized");
    }

    const children = family.members.filter((m) => typeof m === "string" && m.startsWith("child"));
    const familyAssignments = this.assignments.filter((a) => a.familyId === familyId);
    const completedCount = familyAssignments.filter((a) => a.status === "completed").length;
    const inProgressCount = familyAssignments.filter((a) => a.status === "in-progress").length;

    return {
      familyId,
      familyName: family.name,
      totalChildren: children.length,
      totalAssignments: familyAssignments.length,
      completedAssignments: completedCount,
      inProgressAssignments: inProgressCount,
      recentMessages: this.chatMessages
        .filter((m) => m.chatGroupId === family.chatGroupId)
        .slice(-5),
    };
  },

  /**
   * Workflow 12: Complete end-to-end scenario
   */
  async workflowCompleteScenario(parentId, familyName, childId, storyId) {
    // 1. Parent creates family
    const familyResult = await this.workflowParentCreateFamily(parentId, familyName);
    const familyId = familyResult.family._id;

    // 2. Parent invites child
    await this.workflowParentInviteChild(familyId, "child@example.com");

    // 3. Child accepts invitation
    const joinResult = await this.workflowChildAcceptInvitation(familyId, childId);

    // 4. Parent assigns story
    const assignment = await this.workflowParentAssignStory(
      familyId,
      parentId,
      storyId,
      childId
    );

    // 5. Parent sends message
    const parentMessage = await this.workflowParentSendMessage(
      familyId,
      parentId,
      "I assigned you a new story! Let me know what you think."
    );

    // 6. Child starts reading
    const readingStart = await this.workflowChildStartReading(assignment._id, childId);

    // 7. Child replies
    const childReply = await this.workflowChildReceiveAndReplyMessage(
      familyResult.chat._id,
      childId,
      "Thanks! I started reading it."
    );

    // 8. Child completes reading
    const readingComplete = await this.workflowChildCompleteReading(assignment._id, childId);

    // 9. Get family dashboard
    const dashboard = await this.workflowParentViewFamilyDashboard(familyId, parentId);

    return {
      scenario: "complete",
      family: familyResult.family,
      chat: familyResult.chat,
      assignment,
      parentMessage,
      childReply,
      readingStarted: readingStart,
      readingCompleted: readingComplete,
      dashboard,
    };
  },
};

// ========================
// SYSTEM TESTS
// ========================

async function runFamilySystemTests() {
  const report = new TestReport("Family System Tests");
  
  // Reset mock system state for test isolation
  mockFamilySystem.reset();

  try {
    // Test 1: Parent creates family with automatic chat
    try {
      const result = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Test Family"
      );
      report.logAssertion(
        "Parent creates family with auto-chat",
        result.family && result.family.name === "Test Family" && result.chat
      );
    } catch (error) {
      report.logAssertion("Parent creates family with auto-chat", false);
    }

    // Test 2: Parent invites child
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Invite Test Family"
      );
      const inviteResult = await mockFamilySystem.workflowParentInviteChild(
        familyResult.family._id,
        "child@example.com"
      );
      report.logAssertion(
        "Parent invites child",
        inviteResult.invitationSent &&
          inviteResult.invitedEmail === "child@example.com"
      );
    } catch (error) {
      report.logAssertion("Parent invites child", false);
    }

    // Test 3: Child accepts invitation and joins family
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Join Test Family"
      );
      const joinResult = await mockFamilySystem.workflowChildAcceptInvitation(
        familyResult.family._id,
        "child123"
      );
      report.logAssertion(
        "Child accepts invitation",
        joinResult.family.members.includes("child123") &&
          joinResult.chat.members.includes("child123")
      );
    } catch (error) {
      report.logAssertion("Child accepts invitation", false);
    }

    // Test 4: Child auto-added to family chat
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Chat Auto-Add Test"
      );
      const joinResult = await mockFamilySystem.workflowChildAcceptInvitation(
        familyResult.family._id,
        "child123"
      );
      report.logAssertion(
        "Child auto-added to family chat",
        joinResult.chat && joinResult.chat.members && joinResult.chat.members.includes("child123")
      );
    } catch (error) {
      report.logAssertion("Child auto-added to family chat", false);
    }

    // Test 5: Parent assigns story to child
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Assignment Test"
      );
      await mockFamilySystem.workflowChildAcceptInvitation(
        familyResult.family._id,
        "child123"
      );
      const assignment = await mockFamilySystem.workflowParentAssignStory(
        familyResult.family._id,
        "parent123",
        "story456",
        "child123"
      );
      report.logAssertion(
        "Parent assigns story to child",
        assignment && assignment.status === "assigned" && assignment.dueDate
      );
    } catch (error) {
      report.logAssertion("Parent assigns story to child", false);
    }

    // Test 6: Child views assigned stories
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "View Assignments"
      );
      await mockFamilySystem.workflowChildAcceptInvitation(
        familyResult.family._id,
        "child123"
      );
      await mockFamilySystem.workflowParentAssignStory(
        familyResult.family._id,
        "parent123",
        "story456",
        "child123"
      );
      const view = await mockFamilySystem.workflowChildViewAssignments("child123");
      report.logAssertion(
        "Child views assigned stories",
        view.assignedStories > 0 && Array.isArray(view.assignments)
      );
    } catch (error) {
      report.logAssertion("Child views assigned stories", false);
    }

    // Test 7: Child starts reading
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Start Reading"
      );
      await mockFamilySystem.workflowChildAcceptInvitation(
        familyResult.family._id,
        "child123"
      );
      const assignment = await mockFamilySystem.workflowParentAssignStory(
        familyResult.family._id,
        "parent123",
        "story456",
        "child123"
      );
      const reading = await mockFamilySystem.workflowChildStartReading(
        assignment._id,
        "child123"
      );
      report.logAssertion(
        "Child starts reading",
        reading.assignment.status === "in-progress" &&
          reading.assignment.startedAt
      );
    } catch (error) {
      report.logAssertion("Child starts reading", false);
    }

    // Test 8: Parent sends message in family chat
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Chat Message Test"
      );
      const message = await mockFamilySystem.workflowParentSendMessage(
        familyResult.family._id,
        "parent123",
        "How is the reading?"
      );
      report.logAssertion(
        "Parent sends message",
        message && message.message === "How is the reading?"
      );
    } catch (error) {
      report.logAssertion("Parent sends message", false);
    }

    // Test 9: Child replies to message
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Child Reply Test"
      );
      await mockFamilySystem.workflowChildAcceptInvitation(
        familyResult.family._id,
        "child123"
      );
      const reply = await mockFamilySystem.workflowChildReceiveAndReplyMessage(
        familyResult.chat._id,
        "child123",
        "It's great!"
      );
      report.logAssertion(
        "Child replies in family chat",
        reply.messageSent && reply.messageSent.message === "It's great!"
      );
    } catch (error) {
      report.logAssertion("Child replies in family chat", false);
    }

    // Test 10: Child completes reading
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Complete Reading"
      );
      await mockFamilySystem.workflowChildAcceptInvitation(
        familyResult.family._id,
        "child123"
      );
      const assignment = await mockFamilySystem.workflowParentAssignStory(
        familyResult.family._id,
        "parent123",
        "story456",
        "child123"
      );
      await mockFamilySystem.workflowChildStartReading(assignment._id, "child123");
      const completed = await mockFamilySystem.workflowChildCompleteReading(
        assignment._id,
        "child123"
      );
      report.logAssertion(
        "Child completes reading",
        completed.assignment.status === "completed" &&
          completed.assignment.completedAt
      );
    } catch (error) {
      report.logAssertion("Child completes reading", false);
    }

    // Test 11: Parent views family dashboard
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Dashboard Test"
      );
      await mockFamilySystem.workflowChildAcceptInvitation(
        familyResult.family._id,
        "child123"
      );
      const dashboard = await mockFamilySystem.workflowParentViewFamilyDashboard(
        familyResult.family._id,
        "parent123"
      );
      report.logAssertion(
        "Parent views family dashboard",
        dashboard && dashboard.familyName === "Dashboard Test"
      );
    } catch (error) {
      report.logAssertion("Parent views family dashboard", false);
    }

    // Test 12: Complete end-to-end workflow
    try {
      const result = await mockFamilySystem.workflowCompleteScenario(
        "parent123",
        "E2E Family",
        "child123",
        "story789"
      );
      report.logAssertion(
        "Complete end-to-end workflow",
        result.family &&
          result.chat &&
          result.assignment &&
          result.readingCompleted &&
          result.dashboard
      );
    } catch (error) {
      report.logAssertion("Complete end-to-end workflow", false);
    }

    // Test 13: Prevent non-admin from assigning
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Auth Test"
      );
      await mockFamilySystem.workflowParentAssignStory(
        familyResult.family._id,
        "wrongParent",
        "story456",
        "child123"
      );
      report.logAssertion(
        "Prevent non-admin from assigning",
        false
      );
    } catch (error) {
      report.logAssertion("Prevent non-admin from assigning", true);
    }

    // Test 14: Prevent child from starting another child's assignment
    try {
      const familyResult = await mockFamilySystem.workflowParentCreateFamily(
        "parent123",
        "Child Auth Test"
      );
      const assignment = await mockFamilySystem.workflowParentAssignStory(
        familyResult.family._id,
        "parent123",
        "story456",
        "child123"
      );
      await mockFamilySystem.workflowChildStartReading(assignment._id, "other Child");
      report.logAssertion(
        "Prevent child from accessing other child's assignment",
        false
      );
    } catch (error) {
      report.logAssertion(
        "Prevent child from accessing other child's assignment",
        true
      );
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
      const summary = await runFamilySystemTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = { runFamilySystemTests, mockFamilySystem };


test('runFamilySystemTests', async () => { 
  await runFamilySystemTests(); 
});
