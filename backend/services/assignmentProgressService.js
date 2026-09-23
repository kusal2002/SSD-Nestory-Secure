const ReadingSession = require("../models/ReadingSession");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const round1 = (n) => Math.round(n * 10) / 10;
const round0 = (n) => Math.round(n);

function endOfDueDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const computeAnalyticsForAssignment = (
  assignmentPlain,
  storyTitle,
  totalPagesFromStory,
  assignmentId,
  now,
  session,
) => {
  const status = assignmentPlain.status;
  const dueDateRaw = assignmentPlain.dueDate;
  const completedAtRaw = assignmentPlain.completedAt;
  const createdAt = assignmentPlain.createdAt
    ? new Date(assignmentPlain.createdAt)
    : now;

  const pagesRead = session ? Number(session.pagesRead) || 0 : 0;
  const timeSpentMinutes = session ? Number(session.timeSpent) || 0 : 0;
  const sessionTotalPages = session ? Number(session.totalPages) || 0 : 0;
  const totalPages = Math.max(sessionTotalPages || totalPagesFromStory || 1, 1);
  const pagesRemaining = Math.max(0, totalPages - pagesRead);
  const sessionStartedAt = session?.startedAt
    ? new Date(session.startedAt)
    : null;

  const readingStart = sessionStartedAt || createdAt;
  const elapsedMs = Math.max(0, now.getTime() - readingStart.getTime());
  const elapsedDays = Math.max(1, Math.ceil(elapsedMs / MS_PER_DAY));
  const pagesPerDayActual = pagesRead > 0 ? pagesRead / elapsedDays : 0;
  const avgMinutesPerPage =
    pagesRead > 0 && timeSpentMinutes > 0 ? timeSpentMinutes / pagesRead : null;

  let projectedCompletionDate = null;
  if (status !== "completed" && pagesRemaining > 0 && pagesPerDayActual > 0) {
    const daysLeft = pagesRemaining / pagesPerDayActual;
    projectedCompletionDate = new Date(
      now.getTime() + daysLeft * MS_PER_DAY,
    ).toISOString();
  }

  const hasDeadline = !!dueDateRaw;
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
  const dueDay = dueDate ? startOfDay(dueDate) : null;
  const today = startOfDay(now);
  let daysUntilDue = null;
  let isOverdue = false;
  if (dueDay && status !== "completed") {
    daysUntilDue = Math.ceil((dueDay.getTime() - today.getTime()) / MS_PER_DAY);
    isOverdue = daysUntilDue < 0;
  }

  let pagesPerDayNeeded = null;
  let minutesPerDayNeeded = null;
  if (hasDeadline && status !== "completed" && pagesRemaining > 0 && dueDay) {
    const daysLeftForPace = Math.max(1, daysUntilDue);
    if (daysUntilDue < 0) {
      pagesPerDayNeeded = round1(pagesRemaining);
      if (avgMinutesPerPage != null) {
        minutesPerDayNeeded = round0(pagesRemaining * avgMinutesPerPage);
      }
    } else {
      pagesPerDayNeeded = round1(pagesRemaining / daysLeftForPace);
      if (avgMinutesPerPage != null) {
        minutesPerDayNeeded = round0(
          (pagesRemaining * avgMinutesPerPage) / daysLeftForPace,
        );
      }
    }
  }

  let onTrack = null;
  if (
    hasDeadline &&
    status !== "completed" &&
    projectedCompletionDate &&
    dueDate
  ) {
    onTrack =
      new Date(projectedCompletionDate).getTime() <=
      endOfDueDay(dueDate).getTime();
  }

  let deadlineVsCompletion = null;
  if (status === "completed" && completedAtRaw && dueDateRaw) {
    const completedDay = startOfDay(completedAtRaw);
    const dueD = startOfDay(dueDateRaw);
    const diffDays = Math.round(
      (dueD.getTime() - completedDay.getTime()) / MS_PER_DAY,
    );
    if (diffDays > 0) {
      deadlineVsCompletion = {
        outcome: "early",
        daysDifference: diffDays,
        label: `${diffDays} day${diffDays === 1 ? "" : "s"} before the deadline`,
      };
    } else if (diffDays === 0) {
      deadlineVsCompletion = {
        outcome: "on_time",
        daysDifference: 0,
        label: "Finished on the due date",
      };
    } else {
      deadlineVsCompletion = {
        outcome: "late",
        daysDifference: Math.abs(diffDays),
        label: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} after the deadline`,
      };
    }
  } else if (status === "completed" && !dueDateRaw) {
    deadlineVsCompletion = {
      outcome: "no_due_date",
      label: "No due date was set",
    };
  } else if (status !== "completed") {
    deadlineVsCompletion = {
      outcome: "incomplete",
      label: "Not completed yet",
    };
  }

  return {
    assignmentId,
    storyTitle,
    status,
    dueDate: dueDateRaw ? new Date(dueDateRaw).toISOString() : null,
    completedAt: completedAtRaw ? new Date(completedAtRaw).toISOString() : null,
    deadlineVsCompletion,
    reading: {
      totalPages,
      pagesRead,
      pagesRemaining,
      progressPercent: totalPages
        ? round1(Math.min(100, (pagesRead / totalPages) * 100))
        : 0,
      timeSpentMinutes,
      sessionStartedAt: sessionStartedAt
        ? sessionStartedAt.toISOString()
        : null,
    },
    pace: {
      pagesPerDayActual: pagesRead > 0 ? round1(pagesPerDayActual) : 0,
      avgMinutesPerPage:
        avgMinutesPerPage != null ? round1(avgMinutesPerPage) : null,
      projectedCompletionDate,
    },
    deadlinePace: {
      hasDeadline,
      daysUntilDue,
      isOverdue,
      pagesPerDayNeeded,
      minutesPerDayNeeded,
      onTrack,
    },
  };
};

/**
 * @param {import('mongoose').Document[]} assignments - populated child (name), story (title, pageCount)
 */
const enrichAssignmentsWithSessions = async (assignments) => {
  const pairs = assignments.map((a) => {
    const plain = a.toObject ? a.toObject() : a;
    const childId = plain.child?._id || plain.child;
    const storyId = plain.story?._id || plain.story;
    return { assignment: a, plain, childId, storyId };
  });

  const sessions = await Promise.all(
    pairs.map(({ childId, storyId }) =>
      ReadingSession.findOne({
        childId,
        bookId: storyId,
      }).sort({ lastUpdatedAt: -1 }),
    ),
  );

  const now = new Date();
  return pairs.map(({ plain, childId, storyId }, i) => {
    const story = plain.story || {};
    const storyTitle = story.title || "Untitled";
    const totalPagesFromStory = Number(story.pageCount) || 0;
    const assignmentId = plain._id.toString();
    const session = sessions[i];
    const childName =
      typeof plain.child === "object" && plain.child?.name
        ? plain.child.name
        : "Reader";
    const childIdStr = childId?.toString?.() || String(childId);

    return {
      childId: childIdStr,
      childName,
      storyId: storyId?.toString?.() || String(storyId),
      ...computeAnalyticsForAssignment(
        plain,
        storyTitle,
        totalPagesFromStory,
        assignmentId,
        now,
        session,
      ),
    };
  });
};

const summarize = (rows) => {
  let activeWithDeadline = 0;
  let overdueCount = 0;
  let completedOnTime = 0;
  let completedLate = 0;
  let completedEarly = 0;

  for (const row of rows) {
    if (row.status !== "completed" && row.deadlinePace.hasDeadline) {
      activeWithDeadline += 1;
      if (row.deadlinePace.isOverdue) overdueCount += 1;
    }
    const d = row.deadlineVsCompletion;
    if (d?.outcome === "on_time") completedOnTime += 1;
    if (d?.outcome === "early") completedEarly += 1;
    if (d?.outcome === "late") completedLate += 1;
  }

  return {
    activeWithDeadline,
    overdueCount,
    completedOnTime,
    completedEarly,
    completedLate,
  };
};

module.exports = {
  enrichAssignmentsWithSessions,
  summarize,
  computeAnalyticsForAssignment,
};
