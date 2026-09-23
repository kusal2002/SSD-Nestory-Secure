/**
 * Dummy Data Fixtures for Testing
 * All test data is isolated to test database only
 */

// Optional imports - mock ObjectId if mongoose not available
let ObjectId;
try {
  const mongoose = require("mongoose");
  ObjectId = mongoose.Types.ObjectId;
} catch (e) {
  // Mock SimpleObjectId for tests when mongoose is not available
  ObjectId = class {
    constructor(id) {
      if (id && typeof id === "string") {
        this._id = id;
      } else {
        this._id = "507f1f77bcf86cd799439" + Math.random().toString(36).substr(2, 9);
      }
    }
    toString() {
      return this._id;
    }
    toHexString() {
      return this._id;
    }
  };
}

let jwt;
try {
  jwt = require("jsonwebtoken");
} catch (e) {
  // Mock JWT if not available
  jwt = {
    sign: () => "mock-token-" + Math.random().toString(36).substr(2, 9),
    verify: () => ({ _id: "test-user-id" }),
  };
}

// Test JWT Secret (different from production)
const TEST_JWT_SECRET = "test-secret-key-12345";

// ========================
// 1️⃣ STORY LIBRARY DATA
// ========================

const dummyStories = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0001"),
    title: "The Cat in the Moon",
    author: "John Smith",
    description: "A magical tale of a curious cat",
    ageGroup: ["4-6", "7-9"],
    genres: ["fantasy", "adventure"],
    readingLevel: "beginner",
    coverImage: "https://example.com/cover1.jpg",
    content: "Once upon a time, there was a cat...",
    pageCount: 45,
    source: "internal",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0002"),
    title: "Adventure in the Enchanted Forest",
    author: "Sarah Johnson",
    description: "Kids explore a magical forest",
    ageGroup: ["7-9", "10-12"],
    genres: ["fantasy", "adventure"],
    readingLevel: "intermediate",
    coverImage: "https://example.com/cover2.jpg",
    content: "Three friends entered the forest...",
    pageCount: 125,
    source: "google-books",
    googleBooksId: "gb123456",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0003"),
    title: "The Space Adventure",
    author: "Tom Wilson",
    description: "A journey through the galaxy",
    ageGroup: ["10-12", "13-15"],
    genres: ["science-fiction", "adventure"],
    readingLevel: "advanced",
    coverImage: "https://example.com/cover3.jpg",
    content: "Captain Nova launched into space...",
    pageCount: 200,
    source: "internal",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
];

// ========================
// 2️⃣ FAMILY & USER DATA
// ========================

const dummyUsers = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0101"),
    email: "parent1@test.com",
    password: "hashedpassword123",
    name: "Alice Johnson",
    role: "parent",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0102"),
    email: "parent2@test.com",
    password: "hashedpassword123",
    name: "Bob Smith",
    role: "parent",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0103"),
    email: "admin@test.com",
    password: "hashedpassword123",
    name: "Admin User",
    role: "admin",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

const dummyChildren = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0201"),
    email: "child1@test.com",
    password: "hashedpassword123",
    name: "Emma Johnson",
    role: "child",
    dateOfBirth: new Date("2016-05-15"),
    ageGroup: "7-9",
    familyId: new ObjectId("60d5ec49f1c1b0001f5a0301"),
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0202"),
    email: "child2@test.com",
    password: "hashedpassword123",
    name: "Liam Smith",
    role: "child",
    dateOfBirth: new Date("2014-08-20"),
    ageGroup: "10-12",
    familyId: new ObjectId("60d5ec49f1c1b0001f5a0302"),
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
  },
];

const dummyFamilies = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0301"),
    name: "Johnson Family",
    parentId: new ObjectId("60d5ec49f1c1b0001f5a0101"),
    members: [
      new ObjectId("60d5ec49f1c1b0001f5a0101"),
      new ObjectId("60d5ec49f1c1b0001f5a0201"),
    ],
    chatGroupId: new ObjectId("60d5ec49f1c1b0001f5a0401"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0302"),
    name: "Smith Family",
    parentId: new ObjectId("60d5ec49f1c1b0001f5a0102"),
    members: [
      new ObjectId("60d5ec49f1c1b0001f5a0102"),
      new ObjectId("60d5ec49f1c1b0001f5a0202"),
    ],
    chatGroupId: new ObjectId("60d5ec49f1c1b0001f5a0402"),
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
];

// ========================
// 3️⃣ ASSIGNMENT DATA
// ========================

const dummyAssignments = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0501"),
    storyId: new ObjectId("60d5ec49f1c1b0001f5a0001"),
    childId: new ObjectId("60d5ec49f1c1b0001f5a0201"),
    parentId: new ObjectId("60d5ec49f1c1b0001f5a0101"),
    familyId: new ObjectId("60d5ec49f1c1b0001f5a0301"),
    status: "assigned",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0502"),
    storyId: new ObjectId("60d5ec49f1c1b0001f5a0002"),
    childId: new ObjectId("60d5ec49f1c1b0001f5a0201"),
    parentId: new ObjectId("60d5ec49f1c1b0001f5a0101"),
    familyId: new ObjectId("60d5ec49f1c1b0001f5a0301"),
    status: "in-progress",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(),
  },
];

// ========================
// 4️⃣ READING SESSION DATA
// ========================

const dummyReadingSessions = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0601"),
    childId: new ObjectId("60d5ec49f1c1b0001f5a0201"),
    storyId: new ObjectId("60d5ec49f1c1b0001f5a0001"),
    assignmentId: new ObjectId("60d5ec49f1c1b0001f5a0501"),
    startPage: 0,
    currentPage: 15,
    totalPages: 45,
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    endTime: null,
    timeSpent: 0,
    status: "reading",
    activities: [
      {
        _id: new ObjectId("60d5ec49f1c1b0001f5a0701"),
        type: "page_read",
        page: 5,
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
      },
    ],
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0602"),
    childId: new ObjectId("60d5ec49f1c1b0001f5a0202"),
    storyId: new ObjectId("60d5ec49f1c1b0001f5a0002"),
    assignmentId: new ObjectId("60d5ec49f1c1b0001f5a0502"),
    startPage: 0,
    currentPage: 125,
    totalPages: 125,
    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    endTime: null, // Will be set when session ends
    timeSpent: 0,
    status: "reading",
    activities: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
  },
];

// ========================
// 5️⃣ GAMIFICATION DATA
// ========================

const dummyUserProgress = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0801"),
    childId: new ObjectId("60d5ec49f1c1b0001f5a0201"),
    totalPoints: 150,
    level: 2,
    currentStreak: 5,
    longestStreak: 10,
    storiesRead: 3,
    assignmentsCompleted: 2,
    badgesEarned: [
      new ObjectId("60d5ec49f1c1b0001f5a0902"),
    ],
    achievementsEarned: [
      new ObjectId("60d5ec49f1c1b0001f5a1001"),
    ],
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date(),
  },
];

const dummyBadges = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0901"),
    name: "Story Starter",
    description: "Read your first story",
    icon: "📖",
    category: "reading",
    tier: "bronze",
    rarity: "common",
    criteria: {
      storiesRead: 1,
    },
    points: 10,
    createdAt: new Date(),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0902"),
    name: "Week Warrior",
    description: "Maintain a 7-day reading streak",
    icon: "⚔️",
    category: "streak",
    tier: "silver",
    rarity: "uncommon",
    criteria: {
      streakDays: 7,
    },
    points: 50,
    createdAt: new Date(),
  },
];

const dummyAchievements = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a1001"),
    name: "Story Lover Milestone",
    description: "Complete 5 stories",
    icon: "🏆",
    category: "reading",
    type: "progressive",
    milestone: 5,
    criteria: {
      storiesRead: 5,
    },
    points: 100,
    createdAt: new Date(),
  },
];

// ========================
// 6️⃣ CHAT DATA
// ========================

const dummyChatGroups = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a0401"),
    name: "Johnson Family Chat",
    familyId: new ObjectId("60d5ec49f1c1b0001f5a0301"),
    members: [
      new ObjectId("60d5ec49f1c1b0001f5a0101"),
      new ObjectId("60d5ec49f1c1b0001f5a0201"),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const dummyChatMessages = [
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a1101"),
    chatGroupId: new ObjectId("60d5ec49f1c1b0001f5a0401"),
    senderId: new ObjectId("60d5ec49f1c1b0001f5a0101"),
    senderName: "Alice Johnson",
    message: "How is the reading going?",
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    _id: new ObjectId("60d5ec49f1c1b0001f5a1102"),
    chatGroupId: new ObjectId("60d5ec49f1c1b0001f5a0401"),
    senderId: new ObjectId("60d5ec49f1c1b0001f5a0201"),
    senderName: "Emma Johnson",
    message: "I'm on page 15 of The Cat in the Moon!",
    timestamp: new Date(Date.now() - 55 * 60 * 1000), // 55 mins ago
    createdAt: new Date(Date.now() - 55 * 60 * 1000),
  },
];

// ========================
// 7️⃣ JWT TOKENS
// ========================

function generateTestToken(userId, role) {
  return jwt.sign({ userId, role }, TEST_JWT_SECRET, { expiresIn: "7d" });
}

const testTokens = {
  parentToken: generateTestToken(
    new ObjectId("60d5ec49f1c1b0001f5a0101").toString(),
    "parent"
  ),
  childToken: generateTestToken(
    new ObjectId("60d5ec49f1c1b0001f5a0201").toString(),
    "child"
  ),
  adminToken: generateTestToken(
    new ObjectId("60d5ec49f1c1b0001f5a0103").toString(),
    "admin"
  ),
};

// ========================
// EXPORT ALL FIXTURES
// ========================

module.exports = {
  // Stories
  dummyStories,

  // Users & Families
  dummyUsers,
  dummyChildren,
  dummyFamilies,

  // Assignments
  dummyAssignments,

  // Reading Sessions
  dummyReadingSessions,

  // Gamification
  dummyUserProgress,
  dummyBadges,
  dummyAchievements,

  // Chat
  dummyChatGroups,
  dummyChatMessages,

  // JWT Tokens
  testTokens,
  TEST_JWT_SECRET,
  generateTestToken,
};
