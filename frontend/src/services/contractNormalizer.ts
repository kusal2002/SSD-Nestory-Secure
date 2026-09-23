import {
  Assignment,
  AssignmentStatus,
  Child,
  Family,
  FamilyDashboardData,
  FamilySummary,
} from '../types';

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

export const getId = (value: unknown): string => {
  if (typeof value === 'string') return value;
  const record = asRecord(value);
  if (typeof record.id === 'string') return record.id;
  if (typeof record._id === 'string') return record._id;
  return '';
};

const asStatus = (value: unknown): AssignmentStatus => {
  if (value === 'assigned' || value === 'in_progress' || value === 'completed') {
    return value;
  }
  return 'assigned';
};

export const normalizeChild = (value: unknown): Child => {
  const record = asRecord(value);

  return {
    ...(record as unknown as Partial<Child>),
    id: getId(record),
    _id: typeof record._id === 'string' ? record._id : undefined,
    name: typeof record.name === 'string' ? record.name : '',
    age: typeof record.age === 'number' ? record.age : 0,
    family: getId(record.family) || String(record.family || ''),
    parent: getId(record.parent) || String(record.parent || ''),
    isActive: typeof record.isActive === 'boolean' ? record.isActive : true,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
  };
};

export const normalizeFamily = (value: unknown): Family => {
  const record = asRecord(value);
  const childrenRaw = Array.isArray(record.children) ? record.children : [];

  return {
    ...(record as unknown as Partial<Family>),
    id: getId(record),
    _id: typeof record._id === 'string' ? record._id : undefined,
    familyName: typeof record.familyName === 'string' ? record.familyName : '',
    parent: getId(record.parent) || String(record.parent || ''),
    children: childrenRaw.map((child) =>
      typeof child === 'string' ? ({ id: child, name: '', age: 0 } as Child) : normalizeChild(child),
    ),
    isActive: typeof record.isActive === 'boolean' ? record.isActive : true,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
  };
};

export const normalizeAssignment = (value: unknown): Assignment => {
  const record = asRecord(value);
  const child = asRecord(record.child);
  const story = asRecord(record.story);

  return {
    ...(record as unknown as Partial<Assignment>),
    id: getId(record),
    _id: typeof record._id === 'string' ? record._id : undefined,
    childId: String(record.childId || getId(child) || getId(record.child) || ''),
    storyId: String(record.storyId || getId(story) || getId(record.story) || ''),
    familyId: String(record.familyId || getId(record.family) || ''),
    assignedBy: String(record.assignedById || getId(record.assignedBy) || record.assignedBy || ''),
    status: asStatus(record.status),
    dueDate: typeof record.dueDate === 'string' ? record.dueDate : undefined,
    completedAt: typeof record.completedAt === 'string' ? record.completedAt : undefined,
    notes: typeof record.notes === 'string' ? record.notes : undefined,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
    child:
      Object.keys(child).length > 0
        ? {
            id: getId(child),
            _id: typeof child._id === 'string' ? child._id : undefined,
            name: typeof child.name === 'string' ? child.name : '',
            age: typeof child.age === 'number' ? child.age : undefined,
            avatar: typeof child.avatar === 'string' ? child.avatar : undefined,
          }
        : undefined,
    story:
      Object.keys(story).length > 0
        ? {
            id: getId(story),
            _id: typeof story._id === 'string' ? story._id : undefined,
            title: typeof story.title === 'string' ? story.title : 'Untitled story',
            author: typeof story.author === 'string' ? story.author : 'Unknown',
            readingLevel:
              story.readingLevel === 'beginner' ||
              story.readingLevel === 'intermediate' ||
              story.readingLevel === 'advanced'
                ? story.readingLevel
                : undefined,
            coverImage: typeof story.coverImage === 'string' ? story.coverImage : undefined,
            ageGroup:
              story.ageGroup === 'toddler' ||
              story.ageGroup === 'early-reader' ||
              story.ageGroup === 'middle-grade' ||
              story.ageGroup === 'young-adult'
                ? story.ageGroup
                : undefined,
          }
        : undefined,
  };
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const sanitized = value.replace('%', '');
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const normalizeFamilySummary = (value: unknown): FamilySummary => {
  const record = asRecord(value);

  return {
    familyId: String(record.familyId || getId(record) || ''),
    familyName: typeof record.familyName === 'string' ? record.familyName : '',
    totalChildren: toNumber(record.totalChildren),
    totalAssignments: toNumber(record.totalAssignments),
    assigned: toNumber(record.assigned),
    inProgress: toNumber(record.inProgress ?? record.in_progress),
    completed: toNumber(record.completed),
    completionRate: toNumber(record.completionRate),
  };
};

const normalizeStats = (value: unknown) => {
  const record = asRecord(value);
  const inProgress = toNumber(record.inProgress ?? record.in_progress);
  const completionRate = toNumber(record.completionRate);

  return {
    total: toNumber(record.total),
    assigned: toNumber(record.assigned),
    inProgress,
    in_progress: inProgress,
    completed: toNumber(record.completed),
    completionRate,
    completionRateLabel: typeof record.completionRateLabel === 'string' ? record.completionRateLabel : `${completionRate}%`,
  };
};

export const normalizeFamilyDashboardData = (value: unknown): FamilyDashboardData => {
  const record = asRecord(value);
  const family = asRecord(record.family);
  const children = Array.isArray(record.children) ? record.children : [];

  return {
    family: {
      id: String(family.id || family.familyId || getId(family) || ''),
      familyId: String(family.familyId || family.id || getId(family) || ''),
      familyName: typeof family.familyName === 'string' ? family.familyName : '',
      totalChildren: toNumber(family.totalChildren),
    },
    overallStats: normalizeStats(record.overallStats),
    mostActiveReader: record.mostActiveReader
      ? {
          id: getId(record.mostActiveReader),
          childId: String(asRecord(record.mostActiveReader).childId || getId(record.mostActiveReader)),
          name: String(asRecord(record.mostActiveReader).name || ''),
          completedStories: toNumber(asRecord(record.mostActiveReader).completedStories),
        }
      : null,
    children: children.map((item) => {
      const child = asRecord(item);
      return {
        id: getId(child),
        childId: String(child.childId || getId(child) || ''),
        name: typeof child.name === 'string' ? child.name : '',
        age: toNumber(child.age),
        avatar: typeof child.avatar === 'string' ? child.avatar : '',
        assignments: normalizeStats(child.assignments),
      };
    }),
    recentAssignments: Array.isArray(record.recentAssignments)
      ? record.recentAssignments.map(normalizeAssignment)
      : [],
    recentCompletions: Array.isArray(record.recentCompletions)
      ? record.recentCompletions.map(normalizeAssignment)
      : [],
  };
};
