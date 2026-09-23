// Auth & User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'admin' | 'child';
  childProfile?: string | null;
  mustChangePassword?: boolean;
  profilePicture?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'parent' | 'admin';
}

// Family & Child Types
export interface Family {
  id: string;
  _id?: string;
  familyName: string;
  parent: string;
  children: Child[];
  chatGroup?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMember {
  id: string;
  displayName: string;
  role: 'parent' | 'child';
  avatar?: string;
}

export interface ChatGroupSummary {
  id: string;
  familyId: string;
  name: string;
  room: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  members: ChatMember[];
}

export interface ChatMessageReadReceipt {
  user: string;
  readAt: string;
}

export interface ChatMessage {
  id: string;
  _id?: string;
  family: string;
  senderUser: string | null;
  senderChild: string | null;
  senderName: string;
  senderRole: 'parent' | 'child' | 'system';
  messageType: 'text' | 'activity' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  readBy: ChatMessageReadReceipt[];
  createdAt: string;
  updatedAt: string;
}

export interface Child {
  id: string;
  _id?: string;
  name: string;
  age: number;
  avatar?: string;
  family: string;
  parent: string;
  isActive: boolean;
  readingLevel?: 'beginner' | 'intermediate' | 'advanced';
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChildAccountCredentials {
  email: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
  token?: string;
}

export interface AddChildResponse {
  child: Child;
  credentials: ChildAccountCredentials;
}

// Story Types
export interface Story {
  id: string;
  _id?: string;
  title: string;
  author: string;
  description: string;
  ageGroup: 'toddler' | 'early-reader' | 'middle-grade' | 'young-adult';
  genres: string[];
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  coverImage: string;
  pageCount: number;
  source: 'internal' | 'google';
  googleBookId?: string;
  previewLink?: string;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoryListResponse {
  stories: Story[];
  total: number;
  page: number;
  pages: number;
}

// Reading Session Types
export interface ReadingSession {
  id: string;
  childId: string;
  storyId: string;
  pagesRead: number;
  totalPages: number;
  timeSpent: number; // in minutes
  completed: boolean;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Row from GET /sessions/my-sessions (bookId may be populated). */
export interface MyReadingSessionRow {
  _id: string;
  bookId:
    | string
    | {
        _id: string;
        title?: string;
        author?: string;
        coverImage?: string;
        pageCount?: number;
      };
  pagesRead: number;
  totalPages: number;
  progress: number;
  timeSpent: number;
  completed: boolean;
  startedAt: string;
  lastUpdatedAt: string;
}

// Assignment Types
export interface Assignment {
  id: string;
  _id?: string;
  childId: string;
  storyId: string;
  assignedBy: string;
  familyId: string;
  status: AssignmentStatus;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  dueState?: 'none' | 'overdue' | 'due_soon' | 'upcoming';
  isOverdue?: boolean;
  isDueSoon?: boolean;
  daysUntilDue?: number | null;
  dueMeta?: {
    hasDueDate: boolean;
    isOverdue: boolean;
    isDueSoon: boolean;
    daysUntilDue: number | null;
    dueState: 'none' | 'overdue' | 'due_soon' | 'upcoming';
  };
  createdAt: string;
  updatedAt: string;
  child?: {
    id: string;
    _id?: string;
    name: string;
    age?: number;
    avatar?: string;
  };
  story?: {
    id: string;
    _id?: string;
    title: string;
    author: string;
    readingLevel?: 'beginner' | 'intermediate' | 'advanced';
    coverImage?: string;
    ageGroup?: 'toddler' | 'early-reader' | 'middle-grade' | 'young-adult';
  };
}

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed';

export type AssignmentDueState = 'all' | 'overdue' | 'due_soon' | 'upcoming' | 'none';

export interface AssignmentPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AssignmentListMetadata {
  overdueCount: number;
  dueSoonCount: number;
}

export interface AssignmentListResult {
  data: Assignment[];
  pagination: AssignmentPagination;
  metadata: AssignmentListMetadata;
}

export type DeadlineVsCompletionOutcome =
  | 'on_time'
  | 'early'
  | 'late'
  | 'no_due_date'
  | 'incomplete';

export interface AssignmentProgressDeadlineVsCompletion {
  outcome: DeadlineVsCompletionOutcome;
  daysDifference?: number;
  label: string;
}

export interface AssignmentProgressReading {
  totalPages: number;
  pagesRead: number;
  pagesRemaining: number;
  progressPercent: number;
  timeSpentMinutes: number;
  sessionStartedAt: string | null;
}

export interface AssignmentProgressPace {
  pagesPerDayActual: number;
  avgMinutesPerPage: number | null;
  projectedCompletionDate: string | null;
}

export interface AssignmentProgressDeadlinePace {
  hasDeadline: boolean;
  daysUntilDue: number | null;
  isOverdue: boolean;
  pagesPerDayNeeded: number | null;
  minutesPerDayNeeded: number | null;
  onTrack: boolean | null;
}

export interface AssignmentProgressRow {
  childId: string;
  childName: string;
  assignmentId: string;
  storyTitle: string;
  status: AssignmentStatus;
  dueDate: string | null;
  completedAt: string | null;
  deadlineVsCompletion: AssignmentProgressDeadlineVsCompletion | null;
  reading: AssignmentProgressReading;
  pace: AssignmentProgressPace;
  deadlinePace: AssignmentProgressDeadlinePace;
}

export interface AssignmentProgressSummary {
  activeWithDeadline: number;
  overdueCount: number;
  completedOnTime: number;
  completedEarly: number;
  completedLate: number;
}

export interface AssignmentProgressOverview {
  generatedAt: string;
  summary: AssignmentProgressSummary;
  assignments: AssignmentProgressRow[];
}

export interface ChildActivitySlice {
  childId: string;
  childName: string;
  pages: number;
  minutes: number;
  progressSaveCount: number;
}

/** One calendar day in the activity window (UTC date key) — for charts. */
export interface ReadingActivityDayRow {
  date: string;
  pages: number;
  minutes: number;
  progressSaveCount: number;
}

export interface ReadingActivitySummary {
  days: number;
  periodStart: string;
  periodEnd: string;
  totalPagesLogged: number;
  totalMinutesLogged: number;
  progressSaveCount: number;
  byDay?: ReadingActivityDayRow[];
  byChild?: ChildActivitySlice[];
}

export interface BookReadingProgress {
  session: string | null;
  bookId?: unknown;
  pagesRead?: number;
  totalPages: number | null;
  progress?: number;
  completed?: boolean;
  lastUpdatedAt?: string;
}

export interface AssignmentStats {
  total: number;
  assigned: number;
  inProgress: number;
  in_progress: number;
  completed: number;
  completionRate: number;
  completionRateLabel: string;
}

export interface FamilySummary {
  familyId: string;
  familyName: string;
  totalChildren: number;
  totalAssignments: number;
  assigned: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

export interface FamilyDashboardData {
  family: {
    id: string;
    familyId: string;
    familyName: string;
    totalChildren: number;
  };
  overallStats: AssignmentStats;
  mostActiveReader: {
    id: string;
    childId: string;
    name: string;
    completedStories: number;
  } | null;
  children: Array<{
    id: string;
    childId: string;
    name: string;
    age: number;
    avatar: string;
    assignments: AssignmentStats;
  }>;
  recentAssignments: Assignment[];
  recentCompletions: Assignment[];
}

// Dashboard Types
export interface DashboardStats {
  totalReadingTime: number;
  storiesRead: number;
  currentStreak: number;
  assignmentsCompleted: number;
  averageReadingTimePerDay: number;
}

export interface ChildDashboard {
  child: Child;
  stats: DashboardStats;
  upcomingAssignments: Assignment[];
  recentReadingSessions: ReadingSession[];
}

export interface FamilyDashboard {
  family: Family;
  children: ChildDashboard[];
  totalFamilyReadingTime: number;
  familyStats: DashboardStats;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// UI State Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface GamificationBadge {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  criteria?: {
    type: string;
    threshold: number;
  };
}

export interface GamificationBadgeProgress {
  id: string;
  badge: GamificationBadge;
  earnedAt?: string;
}

export interface GamificationAchievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  type?: 'one_time' | 'repeatable' | 'progressive';
  difficulty: string;
  targetValue: number;
  reward: {
    points: number;
    badge?: GamificationBadge | string;
  };
  isActive?: boolean;
}

export interface GamificationAchievementProgress {
  id: string;
  achievement: GamificationAchievement;
  progress: number;
  completed: boolean;
  completedAt?: string;
}

export interface GamificationProgress {
  id: string;
  user: string;
  child?: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  stats: {
    storiesRead: number;
    assignmentsCompleted: number;
  };
  badges: GamificationBadgeProgress[];
  achievements: GamificationAchievementProgress[];
}

export interface GamificationTransaction {
  id: string;
  points: number;
  type: string;
  source: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  user: User | null;
  child?: Child | null;
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  stats: {
    storiesRead: number;
    assignmentsCompleted: number;
  };
}

export interface ModalState {
  isOpen: boolean;
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  _id: string;
  story: string;
  user: string;
  child?: string;
  questions: QuizQuestion[];
  completed: boolean;
  xpAwarded: number;
  expiresAt: string;
}

export interface QuizSubmitResult {
  success: boolean;
  correctCount: number;
  totalQuestions: number;
  xpAwarded: number;
  quiz: Quiz;
}
