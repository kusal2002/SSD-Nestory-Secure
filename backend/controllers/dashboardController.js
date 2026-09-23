const Family = require("../models/Family");
const Child = require("../models/Child");
const Assignment = require("../models/Assignment");
const mongoose = require("mongoose");
require("../models/storyLibrary/Story"); // Register Story model for populate
const {
  normalizeAssignment,
  normalizeAssignmentStats,
  getId,
} = require("../utils/contractTransformers");
const {
  deleteOrphanAssignmentsForParent,
} = require("../utils/orphanAssignmentCleanup");

// @desc    Get full family reading dashboard
// @route   GET /api/dashboard/family
// @access  Private
exports.getFamilyDashboard = async (req, res) => {
  try {
    // Get parent's family
    const family = await Family.findOne({ parent: req.user._id });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "No family group found. Please create a family group first.",
      });
    }

    await deleteOrphanAssignmentsForParent(req.user._id);

    // Get all active children
    const children = await Child.find({ parent: req.user._id, isActive: true });

    // Build per-child stats
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
        const completionRate =
          total > 0 ? Math.round((completed / total) * 100) : 0;

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
            completionRate,
          }),
        };
      }),
    );

    // Overall family totals across all children
    const allAssignments = await Assignment.find({ family: family._id });
    const overallTotal = allAssignments.length;
    const overallAssigned = allAssignments.filter(
      (a) => a.status === "assigned",
    ).length;
    const overallInProgress = allAssignments.filter(
      (a) => a.status === "in_progress",
    ).length;
    const overallCompleted = allAssignments.filter(
      (a) => a.status === "completed",
    ).length;
    const overallCompletionRate =
      overallTotal > 0
        ? Math.round((overallCompleted / overallTotal) * 100)
        : 0;

    // Most active reader (child with most completions)
    const mostActiveReader =
      childStats.length > 0
        ? childStats.reduce((best, child) =>
            child.assignments.completed > best.assignments.completed
              ? child
              : best,
          )
        : null;

    // Recent 5 assignments across the whole family
    const recentAssignmentsRaw = await Assignment.find({ family: family._id })
      .populate("child", "name age avatar")
      .populate("story", "title author coverImage ageGroup")
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 completions
    const recentCompletionsRaw = await Assignment.find({
      family: family._id,
      status: "completed",
    })
      .populate("child", "name age avatar")
      .populate("story", "title author coverImage ageGroup")
      .sort({ completedAt: -1 })
      .limit(5);

    const recentAssignments = recentAssignmentsRaw.map(normalizeAssignment);
    const recentCompletions = recentCompletionsRaw.map(normalizeAssignment);

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
        overallStats: normalizeAssignmentStats({
          total: overallTotal,
          assigned: overallAssigned,
          in_progress: overallInProgress,
          completed: overallCompleted,
          completionRate: overallCompletionRate,
        }),
        mostActiveReader: mostActiveReader
          ? {
              childId: mostActiveReader.childId,
              id: mostActiveReader.id,
              name: mostActiveReader.name,
              completedStories: mostActiveReader.assignments.completed,
            }
          : null,
        children: childStats,
        recentAssignments,
        recentCompletions,
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

// @desc    Get detailed dashboard for a single child
// @route   GET /api/dashboard/child/:childId
// @access  Private
exports.getChildDashboard = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.childId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid child ID format",
      });
    }

    const child = await Child.findById(req.params.childId).populate(
      "family",
      "familyName",
    );

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Only the parent who owns this child can view their dashboard
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this child's dashboard",
      });
    }

    // Get all assignments split by status
    const [assignedStories, inProgressStories, completedStories] =
      await Promise.all([
        Assignment.find({ child: child._id, status: "assigned" })
          .populate("story", "title author coverImage ageGroup readingLevel")
          .sort({ createdAt: -1 }),
        Assignment.find({ child: child._id, status: "in_progress" })
          .populate("story", "title author coverImage ageGroup readingLevel")
          .sort({ createdAt: -1 }),
        Assignment.find({ child: child._id, status: "completed" })
          .populate("story", "title author coverImage ageGroup readingLevel")
          .sort({ completedAt: -1 }),
      ]);

    const total =
      assignedStories.length +
      inProgressStories.length +
      completedStories.length;
    const completionRate =
      total > 0 ? Math.round((completedStories.length / total) * 100) : 0;

    // Upcoming due dates (assigned or in_progress with a dueDate set)
    const upcomingDue = await Assignment.find({
      child: child._id,
      status: { $in: ["assigned", "in_progress"] },
      dueDate: { $ne: null },
    })
      .populate("story", "title author")
      .sort({ dueDate: 1 })
      .limit(3);

    res.status(200).json({
      success: true,
      message: "Child dashboard retrieved successfully",
      data: {
        child: {
          childId: child._id,
          id: getId(child),
          name: child.name,
          age: child.age,
          avatar: child.avatar,
          family: child.family,
        },
        stats: normalizeAssignmentStats({
          total,
          assigned: assignedStories.length,
          in_progress: inProgressStories.length,
          completed: completedStories.length,
          completionRate,
        }),
        upcomingDue: upcomingDue.map(normalizeAssignment),
        assignedStories: assignedStories.map(normalizeAssignment),
        inProgressStories: inProgressStories.map(normalizeAssignment),
        completedStories: completedStories.map(normalizeAssignment),
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

// @desc    Get quick family reading summary (totals only)
// @route   GET /api/dashboard/summary
// @access  Private
exports.getFamilySummary = async (req, res) => {
  try {
    const family = await Family.findOne({ parent: req.user._id });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "No family group found. Please create a family group first.",
      });
    }

    await deleteOrphanAssignmentsForParent(req.user._id);

    const allAssignments = await Assignment.find({ family: family._id });
    const total = allAssignments.length;
    const assigned = allAssignments.filter(
      (a) => a.status === "assigned",
    ).length;
    const inProgress = allAssignments.filter(
      (a) => a.status === "in_progress",
    ).length;
    const completed = allAssignments.filter(
      (a) => a.status === "completed",
    ).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const totalChildren = await Child.countDocuments({
      parent: req.user._id,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: "Family summary retrieved successfully",
      data: {
        familyName: family.familyName,
        familyId: getId(family),
        totalChildren,
        totalAssignments: total,
        assigned,
        in_progress: inProgress,
        inProgress,
        completed,
        completionRate,
        completionRateLabel: `${completionRate}%`,
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
