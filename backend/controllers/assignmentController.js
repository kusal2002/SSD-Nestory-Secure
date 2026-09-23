const Assignment = require("../models/Assignment");
const Child = require("../models/Child");
const Family = require("../models/Family");
const ReadingSession = require("../models/ReadingSession");
const Story = require("../models/storyLibrary/Story");
const { PAGINATION } = require("../constants");
const {
  normalizeAssignment,
  normalizeAssignmentStats,
  getId,
} = require("../utils/contractTransformers");
const {
  awardPointsForAssignmentCompletion,
} = require("../helpers/gamificationHelper");
const { sendNotification } = require("../utils/notificationHelper");

const ensureParentOwnsFamily = async (familyId, userId) => {
  const family = await Family.findById(familyId).select("parent");
  return !!family && family.parent.toString() === userId.toString();
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getDueMetadata = (assignment, dueSoonDays = 3) => {
  const now = new Date();
  const normalizedStatus = assignment.status;

  if (!assignment.dueDate) {
    return {
      hasDueDate: false,
      isOverdue: false,
      isDueSoon: false,
      daysUntilDue: null,
      dueState: "none",
    };
  }

  const dueDate = new Date(assignment.dueDate);
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / MS_PER_DAY,
  );
  const isOverdue = normalizedStatus !== "completed" && dueDate < now;
  const isDueSoon =
    normalizedStatus !== "completed" &&
    !isOverdue &&
    daysUntilDue >= 0 &&
    daysUntilDue <= dueSoonDays;

  return {
    hasDueDate: true,
    isOverdue,
    isDueSoon,
    daysUntilDue,
    dueState: isOverdue ? "overdue" : isDueSoon ? "due_soon" : "upcoming",
  };
};

const withDueMetadata = (assignment, dueSoonDays = 3) => {
  const normalized = normalizeAssignment(assignment);
  const dueMeta = getDueMetadata(normalized, dueSoonDays);

  return {
    ...normalized,
    dueMeta,
    dueState: dueMeta.dueState,
    isOverdue: dueMeta.isOverdue,
    isDueSoon: dueMeta.isDueSoon,
    daysUntilDue: dueMeta.daysUntilDue,
  };
};

// @desc    Assign a story to a child
// @route   POST /api/assignments
// @access  Private

exports.createAssignment = async (req, res) => {
  try {
    const { childId, storyId, dueDate, notes } = req.body;

    // Verify the child exists and belongs to the logged-in parent
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Not authorized. You can only assign stories to your own children.",
      });
    }

    const parentOwnsFamily = await ensureParentOwnsFamily(
      child.family,
      req.user._id,
    );
    if (!parentOwnsFamily) {
      return res.status(403).json({
        success: false,
        message: "Not authorized. Child does not belong to your family.",
      });
    }

    const story = await Story.findById(storyId).select("_id");
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Check for duplicate assignment (same story to same child)
    const existing = await Assignment.findOne({
      child: childId,
      story: storyId,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This story is already assigned to this child",
      });
    }

    const assignment = await Assignment.create({
      child: childId,
      story: storyId,
      assignedBy: req.user._id,
      family: child.family,
      dueDate: dueDate || null,
      notes: notes || "",
    });

    // Populate for a rich response
    await assignment.populate([
      { path: "child", select: "name age" },
      { path: "story", select: "title author ageGroup coverImage" },
      { path: "assignedBy", select: "name email" },
    ]);

    // Notify the child about the new assignment
    await sendNotification({
      recipient: child.user || childId, // Assuming Child model might have a user ref for auth
      sender: req.user._id,
      type: 'assignment',
      title: 'New Story Assigned! 📖',
      message: `${req.user.name} assigned you a new story: "${assignment.story.title}". Ready to read?`,
      data: {
        assignmentId: assignment._id,
        storyId: storyId,
        storyTitle: assignment.story.title
      }
    });

    res.status(201).json({
      success: true,
      message: "Story assigned successfully",
      data: withDueMetadata(assignment),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    List assignments with filters + pagination
// @route   GET /api/assignments
// @access  Private
exports.listAssignments = async (req, res) => {
  try {
    const {
      childId,
      status,
      dueState = "all",
      dueSoonDays: dueSoonDaysRaw,
      page: pageRaw,
      limit: limitRaw,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const dueSoonDays = Math.max(parseInt(dueSoonDaysRaw, 10) || 3, 1);
    const page = Math.max(parseInt(pageRaw, 10) || PAGINATION.DEFAULT_PAGE, 1);
    const limit = Math.min(
      Math.max(parseInt(limitRaw, 10) || PAGINATION.DEFAULT_LIMIT, 1),
      PAGINATION.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    if (childId) {
      const child = await Child.findById(childId);
      if (!child) {
        return res.status(404).json({
          success: false,
          message: "Child not found",
        });
      }

      if (child.parent.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this child's assignments",
        });
      }
    }

    const baseFilter = {
      assignedBy: req.user._id,
    };

    if (childId) {
      baseFilter.child = childId;
    }

    if (status) {
      baseFilter.status = status;
    }

    const now = new Date();
    const dueSoonThreshold = new Date(now.getTime() + dueSoonDays * MS_PER_DAY);

    const dueFilter = {};
    const requireOpenAssignments = !status;
    if (dueState === "overdue") {
      dueFilter.dueDate = { $lt: now };
      if (requireOpenAssignments) {
        dueFilter.status = { $ne: "completed" };
      }
    } else if (dueState === "due_soon") {
      dueFilter.dueDate = { $gte: now, $lte: dueSoonThreshold };
      if (requireOpenAssignments) {
        dueFilter.status = { $ne: "completed" };
      }
    } else if (dueState === "upcoming") {
      dueFilter.dueDate = { $gt: dueSoonThreshold };
      if (requireOpenAssignments) {
        dueFilter.status = { $ne: "completed" };
      }
    } else if (dueState === "none") {
      dueFilter.dueDate = null;
    }

    const queryFilter = {
      ...baseFilter,
      ...dueFilter,
    };

    const sort = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
      createdAt: -1,
    };

    const [assignments, totalItems, overdueCount, dueSoonCount] =
      await Promise.all([
        Assignment.find(queryFilter)
          .populate("child", "name age")
          .populate("story", "title author ageGroup coverImage readingLevel")
          .populate("assignedBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Assignment.countDocuments(queryFilter),
        Assignment.countDocuments({
          ...baseFilter,
          dueDate: { $lt: now },
          status: { $ne: "completed" },
        }),
        Assignment.countDocuments({
          ...baseFilter,
          dueDate: { $gte: now, $lte: dueSoonThreshold },
          status: { $ne: "completed" },
        }),
      ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    res.status(200).json({
      success: true,
      message: "Assignments retrieved successfully",
      count: assignments.length,
      data: assignments.map((assignment) =>
        withDueMetadata(assignment, dueSoonDays),
      ),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        childId: childId || null,
        status: status || null,
        dueState,
        dueSoonDays,
        sortBy,
        sortOrder,
      },
      metadata: {
        overdueCount,
        dueSoonCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all assignments for a specific child
// @route   GET /api/assignments/child/:childId
// @access  Private
exports.getAssignmentsByChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this child's assignments",
      });
    }

    const assignments = await Assignment.find({ child: req.params.childId })
      .populate("story", "title author ageGroup coverImage readingLevel")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Assignments retrieved successfully",
      count: assignments.length,
      data: assignments.map((assignment) => withDueMetadata(assignment)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get assignments for logged-in child
// @route   GET /api/assignments/me
// @access  Private (Child)
exports.getMyAssignments = async (req, res) => {
  try {
    if (req.user.normalizedRole !== "child") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access child assignments",
      });
    }

    if (!req.user.childProfile) {
      return res.status(404).json({
        success: false,
        message: "Child profile not linked to this account",
      });
    }

    const child = await Child.findById(req.user.childProfile);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    console.log(
      "[assignmentController] getMyAssignments - childId:",
      req.user.childProfile,
    );

    const assignments = await Assignment.find({ child: child._id })
      .populate(
        "story",
        "title author ageGroup coverImage readingLevel totalPages",
      )
      .sort({ createdAt: -1 })
      .lean();

    console.log(
      "[assignmentController] getMyAssignments - found assignments:",
      assignments.length,
    );

    // 2. Get all reading sessions to find stories started but not formally assigned
    const sessions = await ReadingSession.find({ childId: child._id })
      .populate(
        "bookId",
        "title author ageGroup coverImage readingLevel totalPages",
      )
      .lean();

    console.log(
      "[assignmentController] getMyAssignments - found sessions:",
      sessions.length,
    );

    // 3. Create a map of story IDs from formal assignments
    const assignedStoryIds = new Set(
      assignments.map((a) => a.story?._id?.toString()),
    );

    // 4. Identify stories from sessions that are NOT in assignments
    const unassignedItems = [];
    const processedUnassignedStoryIds = new Set();

    for (const session of sessions) {
      if (!session.bookId) continue;
      const storyId = session.bookId._id.toString();

      if (
        !assignedStoryIds.has(storyId) &&
        !processedUnassignedStoryIds.has(storyId)
      ) {
        unassignedItems.push({
          _id: `virtual-${storyId}`,
          child: child._id,
          story: session.bookId,
          status: session.completed ? "completed" : "in_progress",
          isVirtual: true,
          createdAt: session.createdAt,
          dueDate: null,
        });
        processedUnassignedStoryIds.add(storyId);
      }
    }

    // Combine formal and virtual assignments
    const allItems = [...assignments, ...unassignedItems];

    console.log(
      "[assignmentController] getMyAssignments - returning total items:",
      allItems.length,
    );

    res.status(200).json({
      success: true,
      message: "Child assignments retrieved successfully",
      count: allItems.length,
      data: allItems.map((assignment) => {
        const normalized = withDueMetadata(assignment);
        return {
          ...normalized,
          storyTitle: assignment.story?.title || "Untitled",
        };
      }),
    });
  } catch (error) {
    console.error("[assignmentController] getMyAssignments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get a single assignment for logged-in child
// @route   GET /api/assignments/me/:id
// @access  Private (Child)
exports.getMyAssignmentById = async (req, res) => {
  try {
    if (req.user.normalizedRole !== "child") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access child assignments",
      });
    }

    if (!req.user.childProfile) {
      return res.status(404).json({
        success: false,
        message: "Child profile not linked to this account",
      });
    }

    const assignment = await Assignment.findById(req.params.id)
      .populate("child", "name age avatar")
      .populate("story", "title author ageGroup coverImage readingLevel")
      .populate("assignedBy", "name email");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const assignmentChildId = getId(assignment.child);
    if (assignmentChildId !== req.user.childProfile.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assignment",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment retrieved successfully",
      data: withDueMetadata(assignment),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update assignment status for logged-in child
// @route   PUT /api/assignments/me/:id/status
// @access  Private (Child)
exports.updateMyAssignmentStatus = async (req, res) => {
  try {
    if (req.user.normalizedRole !== "child") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update child assignments",
      });
    }

    if (!req.user.childProfile) {
      return res.status(404).json({
        success: false,
        message: "Child profile not linked to this account",
      });
    }

    const { status } = req.body;

    if (!["in_progress", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Child can only set status to in_progress or completed",
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.child.toString() !== req.user.childProfile.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assignment",
      });
    }

    assignment.status = status;
    assignment.completedAt = status === "completed" ? new Date() : null;
    await assignment.save();

    await assignment.populate([
      { path: "child", select: "name age avatar" },
      {
        path: "story",
        select: "title author ageGroup coverImage readingLevel",
      },
      { path: "assignedBy", select: "name email" },
    ]);

    res.status(200).json({
      success: true,
      message: "Assignment status updated successfully",
      data: withDueMetadata(assignment),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get family reading dashboard (all children + their assignment stats)
// @route   GET /api/assignments/family
// @access  Private
exports.getFamilyDashboard = async (req, res) => {
  try {
    const family = await Family.findOne({ parent: req.user._id });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "No family group found. Please create a family group first.",
      });
    }

    const children = await Child.find({ parent: req.user._id, isActive: true });

    // Build per-child stats using aggregation
    const childStats = await Promise.all(
      children.map(async (child) => {
        const assignments = await Assignment.find({ child: child._id });
        const total = assignments.length;
        const assigned = assignments.filter(
          (a) => a.status === "assigned",
        ).length;
        const inProgress = assignments.filter(
          (a) => a.status === "in_progress",
        ).length;
        const completed = assignments.filter(
          (a) => a.status === "completed",
        ).length;

        return {
          childId: child._id,
          id: getId(child),
          name: child.name,
          age: child.age,
          avatar: child.avatar,
          assignments: normalizeAssignmentStats({
            total,
            assigned,
            in_progress: inProgress,
            completed,
          }),
        };
      }),
    );

    res.status(200).json({
      success: true,
      message: "Family dashboard retrieved successfully",
      data: {
        family: {
          familyId: family._id,
          id: getId(family),
          familyName: family.familyName,
          totalChildren: children.length,
        },
        children: childStats,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get a single assignment by ID
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("child", "name age")
      .populate("story", "title author ageGroup coverImage readingLevel")
      .populate("assignedBy", "name email");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.assignedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assignment",
      });
    }

    const parentOwnsFamily = await ensureParentOwnsFamily(
      assignment.family,
      req.user._id,
    );
    if (!parentOwnsFamily) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assignment",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment retrieved successfully",
      data: withDueMetadata(assignment),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update assignment details (due date, notes)
// @route   PUT /api/assignments/:id
// @access  Private
exports.updateAssignmentDetails = async (req, res) => {
  try {
    const { dueDate, notes } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assignment",
      });
    }

    const parentOwnsFamily = await ensureParentOwnsFamily(
      assignment.family,
      req.user._id,
    );
    if (!parentOwnsFamily) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assignment",
      });
    }

    if (typeof dueDate !== "undefined") {
      assignment.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (typeof notes !== "undefined") {
      assignment.notes = notes || "";
    }

    await assignment.save();

    await assignment.populate([
      { path: "child", select: "name age" },
      {
        path: "story",
        select: "title author ageGroup coverImage readingLevel",
      },
      { path: "assignedBy", select: "name email" },
    ]);

    res.status(200).json({
      success: true,
      message: "Assignment details updated successfully",
      data: withDueMetadata(assignment),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update assignment status
// @route   PUT /api/assignments/:id/status
// @access  Private
exports.updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assignment",
      });
    }

    const parentOwnsFamily = await ensureParentOwnsFamily(
      assignment.family,
      req.user._id,
    );
    if (!parentOwnsFamily) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assignment",
      });
    }

    assignment.status = status;
    // Auto-set completedAt when marked completed
    if (status === "completed") {
      assignment.completedAt = new Date();

      // Award gamification points for completing an assignment
      try {
        const gamificationResult = await awardPointsForAssignmentCompletion(
          assignment.assignedBy,
          assignment._id,
          assignment.child,
        );

        console.log(
          "Gamification awarded for assignment completion:",
          gamificationResult,
        );
      } catch (gamificationError) {
        console.error("Gamification error:", gamificationError);
        // Don't fail the assignment update if gamification fails
      }
    } else {
      assignment.completedAt = null;
    }
    await assignment.save();

    await assignment.populate([
      { path: "child", select: "name age" },
      { path: "story", select: "title author" },
    ]);

    res.status(200).json({
      success: true,
      message: "Assignment status updated successfully",
      data: withDueMetadata(assignment),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Bulk update assignment status
// @route   PUT /api/assignments/bulk/status
// @access  Private
exports.bulkUpdateAssignmentStatus = async (req, res) => {
  try {
    const { assignmentIds, status } = req.body;

    const uniqueAssignmentIds = [...new Set(assignmentIds.map(String))];
    const assignments = await Assignment.find({
      _id: { $in: uniqueAssignmentIds },
      assignedBy: req.user._id,
    });

    if (!assignments.length) {
      return res.status(404).json({
        success: false,
        message: "No assignments found to update",
      });
    }

    const foundIds = new Set(
      assignments.map((assignment) => assignment._id.toString()),
    );
    const notFoundIds = uniqueAssignmentIds.filter((id) => !foundIds.has(id));

    await Promise.all(
      assignments.map(async (assignment) => {
        assignment.status = status;
        assignment.completedAt = status === "completed" ? new Date() : null;

        // Award gamification points for completing assignments
        if (status === "completed") {
          try {
            const gamificationResult = await awardPointsForAssignmentCompletion(
              assignment.assignedBy,
              assignment._id,
              assignment.child,
            );

            console.log(
              "Gamification awarded for assignment completion:",
              gamificationResult,
            );
          } catch (gamificationError) {
            console.error(
              "Gamification error for assignment",
              assignment._id,
              ":",
              gamificationError,
            );
            // Don't fail the assignment update if gamification fails
          }
        }

        await assignment.save();
      }),
    );

    await Promise.all(
      assignments.map((assignment) =>
        assignment.populate([
          { path: "child", select: "name age" },
          {
            path: "story",
            select: "title author ageGroup coverImage readingLevel",
          },
          { path: "assignedBy", select: "name email" },
        ]),
      ),
    );

    res.status(200).json({
      success: true,
      message: "Assignments updated successfully",
      data: {
        requestedCount: uniqueAssignmentIds.length,
        updatedCount: assignments.length,
        notFoundIds,
        status,
        assignments: assignments.map((assignment) =>
          withDueMetadata(assignment),
        ),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this assignment",
      });
    }

    const parentOwnsFamily = await ensureParentOwnsFamily(
      assignment.family,
      req.user._id,
    );
    if (!parentOwnsFamily) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this assignment",
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Assignment removed successfully",
      data: {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
