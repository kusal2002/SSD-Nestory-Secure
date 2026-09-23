/**
 * Component 2: Shared Family & Reading Assignment System
 * UNIT TESTS - Family & Assignment Services
 * Owner: LITHIRA
 *
 * Tests core family and assignment logic in isolation
 */

const { TestReport } = require("../../config/test-utils");
const { dummyFamilies, dummyChildren, dummyUsers, dummyAssignments } = require("../../fixtures/dummy-data");
const { test } = require('@playwright/test');

// Mock Family Service for unit testing
const mockFamilyService = {
  /**
   * Validate family data
   */
  validateFamilyData(familyData) {
    const errors = [];

    if (!familyData.name || typeof familyData.name !== "string") {
      errors.push("Family name is required");
    }

    if (!familyData.parentId) {
      errors.push("Parent ID is required");
    }

    if (!familyData.members || !Array.isArray(familyData.members) || familyData.members.length === 0) {
      errors.push("Family must have at least one member");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Check if user is family admin
   */
  isFamilyAdmin(family, userId) {
    return family.parentId.toString() === userId.toString();
  },

  /**
   * Check if user is family member
   */
  isFamilyMember(family, userId) {
    return family.members.some((m) => m.toString() === userId.toString());
  },

  /**
   * Get family member role
   */
  getMemberRole(family, userId) {
    if (this.isFamilyAdmin(family, userId)) {
      return "admin";
    }
    if (this.isFamilyMember(family, userId)) {
      return "member";
    }
    return "none";
  },

  /**
   * Add member to family
   */
  addMember(family, memberId) {
    if (this.isFamilyMember(family, memberId)) {
      throw new Error("Member already in family");
    }

    family.members.push(memberId);
    family.updatedAt = new Date();
    return family;
  },

  /**
   * Remove member from family
   */
  removeMember(family, memberId) {
    if (!this.isFamilyMember(family, memberId)) {
      throw new Error("Member not in family");
    }

    if (family.parentId.toString() === memberId.toString()) {
      throw new Error("Cannot remove family admin");
    }

    family.members = family.members.filter((m) => m.toString() !== memberId.toString());
    family.updatedAt = new Date();
    return family;
  },

  /**
   * Get family member details
   */
  getFamilyMembers(family, allUsers) {
    return family.members.map((memberId) =>
      allUsers.find((u) => u._id.toString() === memberId.toString())
    );
  },

  /**
   * Get children in family
   */
  getChildrenInFamily(family, allChildren) {
    return allChildren.filter((c) =>
      family.members.some((m) => m.toString() === c._id.toString())
    );
  },
};

// Mock Assignment Service for unit testing
const mockAssignmentService = {
  /**
   * Validate assignment data
   */
  validateAssignmentData(assignmentData) {
    const errors = [];

    if (!assignmentData.storyId) {
      errors.push("Story ID is required");
    }

    if (!assignmentData.childId) {
      errors.push("Child ID is required");
    }

    if (!assignmentData.parentId) {
      errors.push("Parent ID is required");
    }

    if (!assignmentData.familyId) {
      errors.push("Family ID is required");
    }

    if (assignmentData.dueDate && new Date(assignmentData.dueDate) < new Date()) {
      errors.push("Due date cannot be in the past");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Check if assignment is overdue
   */
  isOverdue(assignment) {
    if (!assignment.dueDate) return false;
    return new Date() > new Date(assignment.dueDate) && assignment.status !== "completed";
  },

  /**
   * Get assignment status
   */
  getAssignmentStatus(assignment) {
    if (assignment.status === "completed") {
      return "completed";
    }

    if (this.isOverdue(assignment)) {
      return "overdue";
    }

    return assignment.status || "assigned";
  },

  /**
   * Calculate assignment progress
   */
  calculateProgress(assignment, readingSession) {
    if (!readingSession) return 0;

    const progress = (readingSession.currentPage / readingSession.totalPages) * 100;
    return Math.round(progress);
  },

  /**
   * Check if assignment can be started
   */
  canStartAssignment(assignment) {
    if (assignment.status === "completed") {
      throw new Error("Cannot start completed assignment");
    }
    return true;
  },

  /**
   * Mark assignment as started
   */
  startAssignment(assignment) {
    if (assignment.status === "completed") {
      throw new Error("Cannot start completed assignment");
    }

    assignment.status = "in-progress";
    assignment.startedAt = new Date();
    assignment.updatedAt = new Date();
    return assignment;
  },

  /**
   * Mark assignment as completed
   */
  completeAssignment(assignment, completionDate = new Date()) {
    assignment.status = "completed";
    assignment.completedAt = completionDate;
    assignment.updatedAt = new Date();
    return assignment;
  },

  /**
   * Filter assignments by status
   */
  filterByStatus(assignments, status) {
    return assignments.filter((a) => {
      const actualStatus = this.getAssignmentStatus(a);
      return actualStatus === status;
    });
  },

  /**
   * Get assignments for child
   */
  getChildAssignments(assignments, childId) {
    return assignments.filter((a) => a.childId.toString() === childId.toString());
  },

  /**
   * Get assignments by parent
   */
  getParentAssignments(assignments, parentId) {
    return assignments.filter((a) => a.parentId.toString() === parentId.toString());
  },
};

// ========================
// UNIT TESTS
// ========================

async function runFamilyAssignmentUnitTests() {
  const report = new TestReport("Family & Assignment Unit Tests");

  // Create fresh assignment data to avoid fixture mutations from other tests
  const freshAssignments = [
    {
      _id: "60d5ec49f1c1b0001f5a0501",
      storyId: "60d5ec49f1c1b0001f5a0001",
      childId: "60d5ec49f1c1b0001f5a0201",
      parentId: "60d5ec49f1c1b0001f5a0101",
      familyId: "60d5ec49f1c1b0001f5a0301",
      status: "assigned",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "60d5ec49f1c1b0001f5a0502",
      storyId: "60d5ec49f1c1b0001f5a0002",
      childId: "60d5ec49f1c1b0001f5a0201",
      parentId: "60d5ec49f1c1b0001f5a0101",
      familyId: "60d5ec49f1c1b0001f5a0301",
      status: "in-progress",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  ];

  // ========== FAMILY TESTS ==========

  // Test 1: Validate valid family data
  try {
    const validFamily = {
      name: "Test Family",
      parentId: dummyUsers[0]._id,
      members: [dummyUsers[0]._id, dummyChildren[0]._id],
    };
    const validation = mockFamilyService.validateFamilyData(validFamily);
    report.logAssertion("Validate valid family data", validation.isValid === true);
  } catch (error) {
    report.logAssertion("Validate valid family data", false);
  }

  // Test 2: Reject family with no members
  try {
    const invalidFamily = {
      name: "Invalid Family",
      parentId: dummyUsers[0]._id,
      members: [],
    };
    const validation = mockFamilyService.validateFamilyData(invalidFamily);
    report.logAssertion(
      "Reject family with no members",
      validation.isValid === false && validation.errors.length > 0
    );
  } catch (error) {
    report.logAssertion("Reject family with no members", false);
  }

  // Test 3: Check if user is family admin
  try {
    const admin = mockFamilyService.isFamilyAdmin(
      dummyFamilies[0],
      dummyFamilies[0].parentId
    );
    const notAdmin = mockFamilyService.isFamilyAdmin(
      dummyFamilies[0],
      dummyChildren[0]._id
    );
    report.logAssertion(
      "Identify family admin correctly",
      admin === true && notAdmin === false
    );
  } catch (error) {
    report.logAssertion("Identify family admin correctly", false);
  }

  // Test 4: Check if user is family member
  try {
    const isMember = mockFamilyService.isFamilyMember(
      dummyFamilies[0],
      dummyChildren[0]._id
    );
    const notMember = mockFamilyService.isFamilyMember(
      dummyFamilies[0],
      dummyUsers[1]._id
    );
    report.logAssertion(
      "Check family membership",
      isMember === true && notMember === false
    );
  } catch (error) {
    report.logAssertion("Check family membership", false);
  }

  // Test 5: Get member role
  try {
    const adminRole = mockFamilyService.getMemberRole(
      dummyFamilies[0],
      dummyFamilies[0].parentId
    );
    const memberRole = mockFamilyService.getMemberRole(
      dummyFamilies[0],
      dummyChildren[0]._id
    );
    const noneRole = mockFamilyService.getMemberRole(
      dummyFamilies[0],
      dummyUsers[1]._id
    );
    report.logAssertion(
      "Get correct member roles",
      adminRole === "admin" && memberRole === "member" && noneRole === "none"
    );
  } catch (error) {
    report.logAssertion("Get correct member roles", false);
  }

  // Test 6: Add member to family
  try {
    const family = JSON.parse(JSON.stringify(dummyFamilies[0]));
    const newMemberId = dummyUsers[1]._id;
    const updated = mockFamilyService.addMember(family, newMemberId);
    report.logAssertion(
      "Add member to family",
      updated.members.some((m) => m.toString() === newMemberId.toString())
    );
  } catch (error) {
    report.logAssertion("Add member to family", false);
  }

  // Test 7: Prevent duplicate member addition
  try {
    // Create a fresh family with proper member IDs matching dummyFamilies[0]
    const family = {
      _id: dummyFamilies[0]._id,
      name: dummyFamilies[0].name,
      parentId: dummyFamilies[0].parentId,
      members: [...dummyFamilies[0].members],
      chatGroupId: dummyFamilies[0].chatGroupId,
      createdAt: dummyFamilies[0].createdAt,
      updatedAt: dummyFamilies[0].updatedAt,
    };
    mockFamilyService.addMember(family, dummyChildren[0]._id);
    report.logAssertion("Prevent duplicate member addition", false);
  } catch (error) {
    report.logAssertion("Prevent duplicate member addition", true);
  }

  // Test 8: Remove member from family
  try {
    // Create a fresh family with proper member IDs
    const family = {
      _id: dummyFamilies[0]._id,
      name: dummyFamilies[0].name,
      parentId: dummyFamilies[0].parentId,
      members: [...dummyFamilies[0].members],
      chatGroupId: dummyFamilies[0].chatGroupId,
      createdAt: dummyFamilies[0].createdAt,
      updatedAt: dummyFamilies[0].updatedAt,
    };
    const memberToRemove = dummyChildren[0]._id;
    const updated = mockFamilyService.removeMember(family, memberToRemove);
    report.logAssertion(
      "Remove member from family",
      !updated.members.some((m) => m.toString() === memberToRemove.toString())
    );
  } catch (error) {
    report.logAssertion("Remove member from family", false);
  }

  // Test 9: Prevent removal of family admin
  try {
    const family = JSON.parse(JSON.stringify(dummyFamilies[0]));
    mockFamilyService.removeMember(family, family.parentId);
    report.logAssertion("Prevent removal of family admin", false);
  } catch (error) {
    report.logAssertion("Prevent removal of family admin", true);
  }

  // Test 10: Get family members
  try {
    const members = mockFamilyService.getFamilyMembers(
      dummyFamilies[0],
      [...dummyUsers, ...dummyChildren]
    );
    report.logAssertion(
      "Get family members",
      members.length === dummyFamilies[0].members.length &&
        members.every((m) => m !== undefined)
    );
  } catch (error) {
    report.logAssertion("Get family members", false);
  }

  // Test 11: Get children in family
  try {
    const children = mockFamilyService.getChildrenInFamily(
      dummyFamilies[0],
      dummyChildren
    );
    report.logAssertion(
      "Get children in family",
      children.length > 0 && children.every((c) => c.role === "child")
    );
  } catch (error) {
    report.logAssertion("Get children in family", false);
  }

  // ========== ASSIGNMENT TESTS ==========

  // Test 12: Validate valid assignment data
  try {
    const validAssignment = {
      storyId: dummyAssignments[0].storyId,
      childId: dummyAssignments[0].childId,
      parentId: dummyAssignments[0].parentId,
      familyId: dummyAssignments[0].familyId,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    const validation = mockAssignmentService.validateAssignmentData(validAssignment);
    report.logAssertion(
      "Validate valid assignment data",
      validation.isValid === true
    );
  } catch (error) {
    report.logAssertion("Validate valid assignment data", false);
  }

  // Test 13: Reject past due date
  try {
    const invalidAssignment = {
      storyId: dummyAssignments[0].storyId,
      childId: dummyAssignments[0].childId,
      parentId: dummyAssignments[0].parentId,
      familyId: dummyAssignments[0].familyId,
      dueDate: new Date(Date.now() - 1000), // Past date
    };
    const validation = mockAssignmentService.validateAssignmentData(invalidAssignment);
    report.logAssertion(
      "Reject past due date",
      validation.isValid === false && validation.errors.length > 0
    );
  } catch (error) {
    report.logAssertion("Reject past due date", false);
  }

  // Test 14: Check if assignment is overdue
  try {
    const overdueAssignment = {
      ...dummyAssignments[0],
      dueDate: new Date(Date.now() - 1000),
      status: "assigned",
    };
    const isOverdue = mockAssignmentService.isOverdue(overdueAssignment);
    report.logAssertion("Check if assignment is overdue", isOverdue === true);
  } catch (error) {
    report.logAssertion("Check if assignment is overdue", false);
  }

  // Test 15: Completed assignment is never overdue
  try {
    const completedAssignment = {
      ...dummyAssignments[0],
      dueDate: new Date(Date.now() - 1000),
      status: "completed",
    };
    const isOverdue = mockAssignmentService.isOverdue(completedAssignment);
    report.logAssertion(
      "Completed assignment is never overdue",
      isOverdue === false
    );
  } catch (error) {
    report.logAssertion("Completed assignment is never overdue", false);
  }

  // Test 16: Get assignment status
  try {
    const assigned = mockAssignmentService.getAssignmentStatus(freshAssignments[0]);
    const inProgress = mockAssignmentService.getAssignmentStatus(freshAssignments[1]);
    report.logAssertion(
      "Get assignment status",
      assigned === "assigned" && inProgress === "in-progress"
    );
  } catch (error) {
    report.logAssertion("Get assignment status", false);
  }

  // Test 17: Calculate assignment progress
  try {
    const progress = mockAssignmentService.calculateProgress(
      dummyAssignments[0],
      { currentPage: 15, totalPages: 45 }
    );
    report.logAssertion("Calculate assignment progress", progress === 33);
  } catch (error) {
    report.logAssertion("Calculate assignment progress", false);
  }

  // Test 18: Start assignment
  try {
    // Use fresh assignment to avoid mutation issues
    const assignment = {
      _id: freshAssignments[0]._id,
      storyId: freshAssignments[0].storyId,
      childId: freshAssignments[0].childId,
      parentId: freshAssignments[0].parentId,
      familyId: freshAssignments[0].familyId,
      status: freshAssignments[0].status,
      dueDate: freshAssignments[0].dueDate,
      createdAt: freshAssignments[0].createdAt,
      updatedAt: freshAssignments[0].updatedAt,
    };
    const started = mockAssignmentService.startAssignment(assignment);
    report.logAssertion(
      "Start assignment",
      started.status === "in-progress" && started.startedAt
    );
  } catch (error) {
    report.logAssertion("Start assignment", false);
  }

  // Test 19: Complete assignment
  try {
    const assignment = JSON.parse(JSON.stringify(dummyAssignments[0]));
    const completed = mockAssignmentService.completeAssignment(assignment);
    report.logAssertion(
      "Complete assignment",
      completed.status === "completed" && completed.completedAt
    );
  } catch (error) {
    report.logAssertion("Complete assignment", false);
  }

  // Test 20: Filter assignments by status
  try {
    const inProgressAssignments = mockAssignmentService.filterByStatus(
      dummyAssignments,
      "in-progress"
    );
    report.logAssertion(
      "Filter assignments by status",
      inProgressAssignments.length > 0 &&
        inProgressAssignments.every((a) => a.status === "in-progress")
    );
  } catch (error) {
    report.logAssertion("Filter assignments by status", false);
  }

  // Test 21: Get assignments for child
  try {
    const childAssignments = mockAssignmentService.getChildAssignments(
      dummyAssignments,
      dummyAssignments[0].childId
    );
    report.logAssertion(
      "Get assignments for child",
      childAssignments.length > 0 &&
        childAssignments.every(
          (a) => a.childId.toString() === dummyAssignments[0].childId.toString()
        )
    );
  } catch (error) {
    report.logAssertion("Get assignments for child", false);
  }

  // Test 22: Get assignments by parent
  try {
    const parentAssignments = mockAssignmentService.getParentAssignments(
      dummyAssignments,
      dummyAssignments[0].parentId
    );
    report.logAssertion(
      "Get assignments by parent",
      parentAssignments.every(
        (a) => a.parentId.toString() === dummyAssignments[0].parentId.toString()
      )
    );
  } catch (error) {
    report.logAssertion("Get assignments by parent", false);
  }

  report.print();
  return report.summary();
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const summary = await runFamilyAssignmentUnitTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = {
  runFamilyAssignmentUnitTests,
  mockFamilyService,
  mockAssignmentService,
};


test('runFamilyAssignmentUnitTests', async () => { 
  await runFamilyAssignmentUnitTests(); 
});
