const toPlainObject = (value) => {
  if (!value) return value;
  if (typeof value.toObject === "function") {
    return value.toObject({ virtuals: true });
  }
  return value;
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (value.id) return String(value.id);
    if (value._id) return String(value._id);
  }
  return String(value);
};

const normalizeChild = (child) => {
  const plain = toPlainObject(child);
  if (!plain) return plain;

  return {
    ...plain,
    id: getId(plain),
    family: typeof plain.family === "object" && plain.family !== null ? getId(plain.family) : plain.family,
    parent: typeof plain.parent === "object" && plain.parent !== null ? getId(plain.parent) : plain.parent,
  };
};

const normalizeFamily = (family) => {
  const plain = toPlainObject(family);
  if (!plain) return plain;

  const normalizedChildren = Array.isArray(plain.children)
    ? plain.children.map((child) =>
        typeof child === "object" && child !== null ? normalizeChild(child) : getId(child),
      )
    : [];

  return {
    ...plain,
    id: getId(plain),
    parent: typeof plain.parent === "object" && plain.parent !== null ? getId(plain.parent) : plain.parent,
    children: normalizedChildren,
  };
};

const normalizeAssignment = (assignment) => {
  const plain = toPlainObject(assignment);
  if (!plain) return plain;

  const childId = getId(plain.child);
  const storyId = getId(plain.story);
  const familyId = getId(plain.family);
  const assignedById = getId(plain.assignedBy);

  return {
    ...plain,
    id: getId(plain),
    childId,
    storyId,
    familyId,
    assignedById,
  };
};

const normalizeAssignmentStats = (stats) => {
  const inProgress = Number(stats.inProgress ?? stats.in_progress ?? 0);
  const completionRateRaw = stats.completionRate;
  const completionRate =
    typeof completionRateRaw === "string"
      ? Number(completionRateRaw.replace("%", "")) || 0
      : Number(completionRateRaw || 0);

  return {
    ...stats,
    inProgress,
    in_progress: inProgress,
    completionRate,
    completionRateLabel: `${completionRate}%`,
  };
};

module.exports = {
  getId,
  normalizeChild,
  normalizeFamily,
  normalizeAssignment,
  normalizeAssignmentStats,
};
