const Assignment = require("../models/Assignment");
const ReadingSession = require("../models/ReadingSession");
const Family = require("../models/Family");
const Child = require("../models/Child");
const ErrorResponse = require("../utils/errorResponse");
const {
  enrichAssignmentsWithSessions,
  summarize,
  computeAnalyticsForAssignment,
} = require("../services/assignmentProgressService");

/**
 * @desc    Get reading progress overview for the logged-in child
 * @route   GET /api/assignments/my-progress
 * @access  Private (Child)
 */
exports.getMyProgressOverview = async (req, res, next) => {
  try {
    const childId = req.user.childProfile || req.user.id;

    console.log(
      "[assignmentProgressController] getMyProgressOverview - childId:",
      childId,
    );

    // 1. Get all formal assignments
    const assignments = await Assignment.find({ child: childId })
      .populate("child", "name")
      .populate("story", "title pageCount totalPages coverImage")
      .lean();

    console.log(
      "[assignmentProgressController] getMyProgressOverview - found assignments:",
      assignments.length,
    );

    // 2. Get all reading sessions to find stories started but not formally assigned
    const sessions = await ReadingSession.find({ childId: childId })
      .populate("bookId", "title pageCount totalPages coverImage")
      .lean();

    console.log(
      "[assignmentProgressController] getMyProgressOverview - found sessions:",
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
          child: childId,
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
    const allTrackedItems = [...assignments, ...unassignedItems];

    console.log(
      "[assignmentProgressController] getMyProgressOverview - total items:",
      allTrackedItems.length,
    );

    if (allTrackedItems.length === 0) {
      console.log(
        "[assignmentProgressController] getMyProgressOverview - no items, returning empty",
      );
      return res.status(200).json({
        success: true,
        data: {
          summary: { totalBooks: 0, completedBooks: 0, totalPagesRead: 0 },
          assignments: [],
        },
      });
    }

    // 5. Calculate detailed stats for each item using the service
    const detailedProgress =
      await enrichAssignmentsWithSessions(allTrackedItems);

    console.log(
      "[assignmentProgressController] getMyProgressOverview - detailed progress count:",
      detailedProgress.length,
    );

    // 6. Generate overall summary
    const summary = {
      totalBooks: detailedProgress.length,
      completedBooks: detailedProgress.filter((p) => p.status === "completed")
        .length,
      totalPagesRead: detailedProgress.reduce(
        (sum, p) => sum + p.reading.pagesRead,
        0,
      ),
      totalTimeSpent: detailedProgress.reduce(
        (sum, p) => sum + p.reading.timeSpentMinutes,
        0,
      ),
      ...summarize(detailedProgress),
    };

    console.log(
      "[assignmentProgressController] getMyProgressOverview - summary:",
      summary,
    );

    res.status(200).json({
      success: true,
      data: {
        summary,
        assignments: detailedProgress,
      },
    });
  } catch (error) {
    console.error(
      "[assignmentProgressController] getMyProgressOverview error:",
      error,
    );
    next(error);
  }
};

/**
 * @desc    Get reading progress overview for all children in a family (Parent view)
 * @route   GET /api/assignments/progress
 * @access  Private (Parent)
 */
exports.getParentProgressOverview = async (req, res, next) => {
  try {
    const parentId = req.user.id;

    // 1. Get family and its children
    const family = await Family.findOne({ parent: parentId });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found",
      });
    }

    const children = await Child.find({ family: family._id });

    // Filter by childId if provided
    const requestedChildId = req.query.childId;
    const filteredChildren = requestedChildId
      ? children.filter((c) => c._id.toString() === requestedChildId)
      : children;

    // 2. Map through each child to get their progress
    const childrenProgress = await Promise.all(
      filteredChildren.map(async (child) => {
        // Get formal assignments
        const assignments = await Assignment.find({ child: child._id })
          .populate("child", "name")
          .populate("story", "title pageCount totalPages coverImage")
          .lean();

        // Get reading sessions to find stories started but not formally assigned
        const sessions = await ReadingSession.find({ childId: child._id })
          .populate("bookId", "title pageCount totalPages coverImage")
          .lean();

        // Create a map of story IDs from formal assignments
        const assignedStoryIds = new Set(
          assignments.map((a) => a.story?._id?.toString()),
        );

        // Identify stories from sessions that are NOT in assignments
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
        const allTrackedItems = [...assignments, ...unassignedItems];

        if (allTrackedItems.length === 0) {
          return {
            childId: child._id,
            childName: child.name,
            summary: { totalBooks: 0, completedBooks: 0, totalPagesRead: 0 },
            assignments: [],
          };
        }

        // Calculate detailed stats for each item using the service
        const detailedProgress =
          await enrichAssignmentsWithSessions(allTrackedItems);

        // Generate summary for child
        const summary = {
          totalBooks: detailedProgress.length,
          completedBooks: detailedProgress.filter(
            (p) => p.status === "completed",
          ).length,
          totalPagesRead: detailedProgress.reduce(
            (sum, p) => sum + p.reading.pagesRead,
            0,
          ),
          totalTimeSpent: detailedProgress.reduce(
            (sum, p) => sum + p.reading.timeSpentMinutes,
            0,
          ),
          ...summarize(detailedProgress),
        };

        return {
          childId: child._id,
          childName: child.name,
          summary,
          assignments: detailedProgress.map((p) => ({
            ...p,
            childId: child._id,
            childName: child.name,
          })),
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        summary: {
          activeWithDeadline: childrenProgress.reduce(
            (sum, cp) => sum + (cp.summary.activeWithDeadline || 0),
            0,
          ),
          overdueCount: childrenProgress.reduce(
            (sum, cp) => sum + (cp.summary.overdueCount || 0),
            0,
          ),
          completedOnTime: childrenProgress.reduce(
            (sum, cp) => sum + (cp.summary.completedOnTime || 0),
            0,
          ),
          completedEarly: childrenProgress.reduce(
            (sum, cp) => sum + (cp.summary.completedEarly || 0),
            0,
          ),
          completedLate: childrenProgress.reduce(
            (sum, cp) => sum + (cp.summary.completedLate || 0),
            0,
          ),
        },
        assignments: childrenProgress.flatMap((cp) => cp.assignments),
      },
    });
  } catch (error) {
    next(error);
  }
};
