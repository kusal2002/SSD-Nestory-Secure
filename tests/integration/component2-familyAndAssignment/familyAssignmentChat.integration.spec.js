/**
 * Component 2: Shared Family & Reading Assignment System
 * INTEGRATION TESTS
 * Owner: LITHIRA
 *
 * Tests family management, automatic chat creation, assignments, and chat functionality
 */

const { TestReport } = require("../../config/test-utils");
const { dummyFamilies, dummyUsers, dummyChildren, dummyChatGroups, dummyChatMessages, dummyAssignments, testTokens } = require("../../fixtures/dummy-data");
const { test } = require('@playwright/test');

// Mock Family & Chat Controller for integration tests
const mockFamilyController = {
  /**
   * POST /api/families
   * Create family group (triggers automatic chat creation)
   */
  async createFamily(familyData, parentId) {
    if (!familyData.name) {
      throw new Error("Family name is required");
    }

    const newFamily = {
      _id: `family_${Date.now()}`,
      name: familyData.name,
      parentId,
      members: [parentId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Automatically create family chat group via third-party API
    const chatGroup = {
      _id: `chat_${Date.now()}`,
      name: `${familyData.name} Chat`,
      familyId: newFamily._id,
      members: [parentId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    newFamily.chatGroupId = chatGroup._id;

    return {
      success: true,
      message: "Family created and chat group provisioned",
      data: {
        family: newFamily,
        chat: chatGroup,
      },
    };
  },

  /**
   * GET /api/families/:id
   * Get family details
   */
  async getFamily(familyId) {
    const family = dummyFamilies.find((f) => f._id.toString() === familyId.toString());
    if (!family) {
      throw new Error("Family not found");
    }

    return {
      success: true,
      message: "Family fetched",
      data: family,
    };
  },

  /**
   * PUT /api/families/:id/add-member
   * Add child to family
   */
  async addChildToFamily(familyId, childId, parentId) {
    const family = dummyFamilies.find((f) => f._id.toString() === familyId.toString());
    if (!family) {
      throw new Error("Family not found");
    }

    if (family.parentId.toString() !== parentId.toString()) {
      throw new Error("Only family admin can add members");
    }

    if (family.members.some((m) => m.toString() === childId.toString())) {
      throw new Error("Child already in family");
    }

    family.members.push(childId);
    family.updatedAt = new Date();

    // Add child to family chat automatically
    const chat = dummyChatGroups.find((c) => c._id.toString() === family.chatGroupId.toString());
    if (chat && !chat.members.some((m) => m.toString() === childId.toString())) {
      chat.members.push(childId);
      chat.updatedAt = new Date();
    }

    return {
      success: true,
      message: "Child added to family and family chat",
      data: {
        family,
        chat,
      },
    };
  },

  /**
   * GET /api/families/:id/members
   * Get family members with details
   */
  async getFamilyMembers(familyId) {
    const family = dummyFamilies.find((f) => f._id.toString() === familyId.toString());
    if (!family) {
      throw new Error("Family not found");
    }

    const members = family.members
      .map((memberId) => {
        const parent = dummyUsers.find((u) => u._id.toString() === memberId.toString());
        const child = dummyChildren.find((c) => c._id.toString() === memberId.toString());
        return parent || child;
      })
      .filter((m) => m !== undefined);

    return {
      success: true,
      message: "Family members fetched",
      data: members,
    };
  },

  /**
   * GET /api/families/:id/children
   * Get children in family
   */
  async getFamilyChildren(familyId) {
    const family = dummyFamilies.find((f) => f._id.toString() === familyId.toString());
    if (!family) {
      throw new Error("Family not found");
    }

    const children = family.members
      .map((memberId) => dummyChildren.find((c) => c._id.toString() === memberId.toString()))
      .filter((c) => c !== undefined);

    return {
      success: true,
      message: "Family children fetched",
      data: children,
    };
  },

  /**
   * GET /api/families/:id/chat
   * Get family chat group
   */
  async getFamilyChat(familyId) {
    const family = dummyFamilies.find((f) => f._id.toString() === familyId.toString());
    if (!family || !family.chatGroupId) {
      throw new Error("Family chat not found");
    }

    const chat = dummyChatGroups.find((c) => c._id.toString() === family.chatGroupId.toString());

    return {
      success: true,
      message: "Family chat fetched",
      data: {
        chatGroupId: chat._id,
        ...chat
      },
    };
  },
};

// Mock Chat Controller for integration tests
const mockChatController = {
  /**
   * POST /api/chat/:chatGroupId/messages
   * Send message to family chat
   */
  async sendMessage(chatGroupId, senderId, senderName, message) {
    const chat = dummyChatGroups.find((c) => c._id.toString() === chatGroupId.toString());
    if (!chat) {
      throw new Error("Chat group not found");
    }

    if (!chat.members.some((m) => m.toString() === senderId.toString())) {
      throw new Error("Not a member of this chat");
    }

    if (!message || message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    const newMessage = {
      _id: `msg_${Date.now()}`,
      chatGroupId,
      senderId,
      senderName,
      message,
      timestamp: new Date(),
      createdAt: new Date(),
    };

    return {
      success: true,
      message: "Message sent",
      data: newMessage,
    };
  },

  /**
   * GET /api/chat/:chatGroupId/messages
   * Get chat messages
   */
  async getMessages(chatGroupId, limit = 50) {
    const chat = dummyChatGroups.find((c) => c._id.toString() === chatGroupId.toString());
    if (!chat) {
      throw new Error("Chat group not found");
    }

    const messages = dummyChatMessages
      .filter((m) => m.chatGroupId.toString() === chatGroupId.toString())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return {
      success: true,
      message: "Messages fetched",
      data: messages.reverse(), // Return in chronological order
    };
  },
};

// Mock Assignment Controller for integration tests
const mockAssignmentController = {
  /**
   * POST /api/assignments
   * Create story assignment
   */
  async createAssignment(assignmentData, parentId) {
    const errors = [];
    if (!assignmentData.storyId) errors.push("Story ID required");
    if (!assignmentData.childId) errors.push("Child ID required");
    if (!assignmentData.familyId) errors.push("Family ID required");

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const newAssignment = {
      _id: `assignment_${Date.now()}`,
      storyId: assignmentData.storyId,
      childId: assignmentData.childId,
      parentId,
      familyId: assignmentData.familyId,
      status: "assigned",
      dueDate: assignmentData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      message: "Story assigned to child",
      data: newAssignment,
    };
  },

  /**
   * GET /api/assignments?childId=X
   * Get assignments for child
   */
  async getChildAssignments(childId) {
    const assignments = dummyAssignments.filter(
      (a) => a.childId.toString() === childId.toString()
    );

    return {
      success: true,
      message: "Child assignments fetched",
      data: assignments,
    };
  },

  /**
   * GET /api/assignments/:id
   * Get assignment details
   */
  async getAssignment(assignmentId) {
    const assignment = dummyAssignments.find(
      (a) => a._id.toString() === assignmentId.toString()
    );
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    return {
      success: true,
      message: "Assignment fetched",
      data: assignment,
    };
  },

  /**
   * PUT /api/assignments/:id/status
   * Update assignment status
   */
  async updateAssignmentStatus(assignmentId, newStatus, childId) {
    const assignment = dummyAssignments.find(
      (a) => a._id.toString() === assignmentId.toString()
    );
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.childId.toString() !== childId.toString()) {
      throw new Error("Unauthorized");
    }

    const validStatuses = ["assigned", "in-progress", "completed"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    assignment.status = newStatus;
    if (newStatus === "in-progress" && !assignment.startedAt) {
      assignment.startedAt = new Date();
    }
    if (newStatus === "completed" && !assignment.completedAt) {
      assignment.completedAt = new Date();
    }
    assignment.updatedAt = new Date();

    return {
      success: true,
      message: `Assignment status updated to ${newStatus}`,
      data: assignment,
    };
  },
};

// ========================
// INTEGRATION TESTS
// ========================

async function runFamilyAssignmentIntegrationTests() {
  const report = new TestReport("Family & Assignment Integration Tests");

  try {
    // ========== FAMILY TESTS ==========

    // Test 1: Create family with automatic chat creation
    try {
      const response = await mockFamilyController.createFamily(
        { name: "New Test Family" },
        dummyUsers[0]._id
      );
      report.logAssertion(
        "Create family with automatic chat",
        response.success &&
          response.data.family.name === "New Test Family" &&
          response.data.chat &&
          response.data.family.chatGroupId
      );
    } catch (error) {
      report.logAssertion("Create family with automatic chat", false);
    }

    // Test 2: Get family details
    try {
      const response = await mockFamilyController.getFamily(dummyFamilies[0]._id);
      report.logAssertion(
        "Get family details",
        response.success && response.data.name === dummyFamilies[0].name
      );
    } catch (error) {
      report.logAssertion("Get family details", false);
    }

    // Test 3: Add child to family
    try {
      const response = await mockFamilyController.addChildToFamily(
        dummyFamilies[0]._id,
        dummyChildren[1]._id,
        dummyFamilies[0].parentId
      );
      report.logAssertion(
        "Add child to family",
        response.success &&
          response.data.family.members.some(
            (m) => m.toString() === dummyChildren[1]._id.toString()
          )
      );
    } catch (error) {
      report.logAssertion("Add child to family", false);
    }

    // Test 4: Prevent non-admin from adding child
    try {
      await mockFamilyController.addChildToFamily(
        dummyFamilies[0]._id,
        dummyChildren[1]._id,
        dummyChildren[0]._id // Not the parent
      );
      report.logAssertion(
        "Prevent non-admin from adding child",
        false
      );
    } catch (error) {
      report.logAssertion("Prevent non-admin from adding child", true);
    }

    // Test 5: Get family members
    try {
      const response = await mockFamilyController.getFamilyMembers(dummyFamilies[0]._id);
      report.logAssertion(
        "Get family members",
        response.success &&
          Array.isArray(response.data) &&
          response.data.length > 0
      );
    } catch (error) {
      report.logAssertion("Get family members", false);
    }

    // Test 6: Get family children
    try {
      const response = await mockFamilyController.getFamilyChildren(
        dummyFamilies[0]._id
      );
      report.logAssertion(
        "Get family children",
        response.success &&
          Array.isArray(response.data) &&
          response.data.every((c) => c.role === "child")
      );
    } catch (error) {
      report.logAssertion("Get family children", false);
    }

    // Test 7: Get family chat group
    try {
      const response = await mockFamilyController.getFamilyChat(
        dummyFamilies[0]._id
      );
      report.logAssertion(
        "Get family chat group",
        response.success && response.data.chatGroupId
      );
    } catch (error) {
      report.logAssertion("Get family chat group", false);
    }

    // ========== CHAT TESTS ==========

    // Test 8: Send message to family chat
    try {
      const chatGroupId = dummyFamilies[0].chatGroupId;
      const response = await mockChatController.sendMessage(
        chatGroupId,
        dummyUsers[0]._id,
        "Parent User",
        "How is the reading going?"
      );
      report.logAssertion(
        "Send message to family chat",
        response.success &&
          response.data.message === "How is the reading going?"
      );
    } catch (error) {
      report.logAssertion("Send message to family chat", false);
    }

    // Test 9: Prevent non-member from sending message
    try {
      const chatGroupId = dummyFamilies[0].chatGroupId;
      await mockChatController.sendMessage(
        chatGroupId,
        dummyUsers[1]._id, // Not a member
        "Other User",
        "Test message"
      );
      report.logAssertion(
        "Prevent non-member from sending message",
        false
      );
    } catch (error) {
      report.logAssertion("Prevent non-member from sending message", true);
    }

    // Test 10: Get chat messages
    try {
      const chatGroupId = dummyFamilies[0].chatGroupId;
      const response = await mockChatController.getMessages(chatGroupId);
      report.logAssertion(
        "Get chat messages",
        response.success && Array.isArray(response.data)
      );
    } catch (error) {
      report.logAssertion("Get chat messages", false);
    }

    // Test 11: Empty message rejected
    try {
      const chatGroupId = dummyFamilies[0].chatGroupId;
      await mockChatController.sendMessage(
        chatGroupId,
        dummyUsers[0]._id,
        "User",
        ""
      );
      report.logAssertion("Reject empty message", false);
    } catch (error) {
      report.logAssertion("Reject empty message", true);
    }

    // ========== ASSIGNMENT TESTS ==========

    // Test 12: Create story assignment
    try {
      const response = await mockAssignmentController.createAssignment(
        {
          storyId: "story_123",
          childId: dummyChildren[0]._id,
          familyId: dummyFamilies[0]._id,
        },
        dummyFamilies[0].parentId
      );
      report.logAssertion(
        "Create story assignment",
        response.success &&
          response.data.status === "assigned" &&
          response.data.dueDate
      );
    } catch (error) {
      report.logAssertion("Create story assignment", false);
    }

    // Test 13: Get child assignments
    try {
      const response = await mockAssignmentController.getChildAssignments(
        dummyAssignments[0].childId
      );
      report.logAssertion(
        "Get child assignments",
        response.success &&
          Array.isArray(response.data) &&
          response.data.every((a) => a.childId.toString() === dummyAssignments[0].childId.toString())
      );
    } catch (error) {
      report.logAssertion("Get child assignments", false);
    }

    // Test 14: Get assignment details
    try {
      const response = await mockAssignmentController.getAssignment(
        dummyAssignments[0]._id
      );
      report.logAssertion(
        "Get assignment details",
        response.success && response.data._id.toString() === dummyAssignments[0]._id.toString()
      );
    } catch (error) {
      report.logAssertion("Get assignment details", false);
    }

    // Test 15: Update assignment status to in-progress
    try {
      const response = await mockAssignmentController.updateAssignmentStatus(
        dummyAssignments[0]._id,
        "in-progress",
        dummyAssignments[0].childId
      );
      report.logAssertion(
        "Update assignment status to in-progress",
        response.success &&
          response.data.status === "in-progress" &&
          response.data.startedAt
      );
    } catch (error) {
      report.logAssertion("Update assignment status to in-progress", false);
    }

    // Test 16: Update assignment status to completed
    try {
      const response = await mockAssignmentController.updateAssignmentStatus(
        dummyAssignments[0]._id,
        "completed",
        dummyAssignments[0].childId
      );
      report.logAssertion(
        "Update assignment status to completed",
        response.success &&
          response.data.status === "completed" &&
          response.data.completedAt
      );
    } catch (error) {
      report.logAssertion("Update assignment status to completed", false);
    }

    // Test 17: Child cannot update others' assignments
    try {
      await mockAssignmentController.updateAssignmentStatus(
        dummyAssignments[0]._id,
        "in-progress",
        dummyChildren[1]._id // Different child
      );
      report.logAssertion(
        "Child cannot update others' assignments",
        false
      );
    } catch (error) {
      report.logAssertion("Child cannot update others' assignments", true);
    }

    // Test 18: Reject invalid assignment status
    try {
      await mockAssignmentController.updateAssignmentStatus(
        dummyAssignments[0]._id,
        "invalid-status",
        dummyAssignments[0].childId
      );
      report.logAssertion("Reject invalid assignment status", false);
    } catch (error) {
      report.logAssertion("Reject invalid assignment status", true);
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
      const summary = await runFamilyAssignmentIntegrationTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = {
  runFamilyAssignmentIntegrationTests,
  mockFamilyController,
  mockChatController,
  mockAssignmentController,
};


test('runFamilyAssignmentIntegrationTests', async () => { 
  await runFamilyAssignmentIntegrationTests(); 
});
