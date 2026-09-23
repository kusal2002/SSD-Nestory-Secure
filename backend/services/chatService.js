const mongoose = require("mongoose");
const Family = require("../models/Family");
const Child = require("../models/Child");
const Story = require("../models/storyLibrary/Story");
const ChatGroup = require("../models/ChatGroup");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");

const CHAT_ROOM_PREFIX = "family-";

const getAllFamilyMemberUserIds = async (family) => {
  try {
    const userIds = [];
    if (family.parent) {
      userIds.push(family.parent);
    }
    if (Array.isArray(family.children) && family.children.length > 0) {
      const childUsers = await User.find({
        childProfile: { $in: family.children },
        role: "child",
      }).select("_id");
      userIds.push(...childUsers.map((u) => u._id));
    }
    return userIds;
  } catch (error) {
    console.error('[ChatService] getAllFamilyMemberUserIds failed:', error.message);
    return [];
  }
};

const toRole = (user) => {
  if (!user) return "";
  if (user.normalizedRole) return user.normalizedRole;
  return user.role === "user" ? "parent" : user.role;
};

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
};

const resolveFamilyForUser = async (user) => {
  const normalizedRole = toRole(user);

  if (normalizedRole === "parent") {
    const family = await Family.findOne({
      parent: user._id,
      isActive: true,
    }).populate("children", "name avatar isActive");

    return family || null;
  }

  if (normalizedRole === "child") {
    const childId = toObjectId(user.childProfile);
    if (!childId) return null;

    const family = await Family.findOne({
      children: childId,
      isActive: true,
    }).populate("children", "name avatar isActive");

    return family || null;
  }

  return null;
};

const ensureChatGroupForFamily = async (family) => {
  const existing = await ChatGroup.findOne({ family: family._id });
  if (existing) return existing;

  const group = await ChatGroup.create({
    family: family._id,
    name: `${family.familyName} Chat`,
    lastMessagePreview: "Welcome to your family chat!",
    lastMessageAt: new Date(),
  });

  await ChatMessage.create({
    family: family._id,
    senderName: "Nestory",
    senderRole: "system",
    messageType: "system",
    content: `Welcome to ${family.familyName} chat! This space is for your family updates and reading moments.`,
    metadata: {
      event: "chat_group_created",
    },
  });

  return group;
};

const createMessage = async ({
  familyId,
  senderUser,
  senderChild,
  senderName,
  senderRole,
  content,
  messageType = "text",
  metadata = {},
}) => {
  const familyObjectId = toObjectId(familyId);
  if (!familyObjectId) {
    throw new Error("Invalid familyId");
  }

  const payload = {
    family: familyObjectId,
    senderUser: senderUser || null,
    senderChild: senderChild || null,
    senderName,
    senderRole,
    messageType,
    content,
    metadata,
  };

  if (senderUser) {
    payload.readBy = [{ user: senderUser, readAt: new Date() }];
  }

  const message = await ChatMessage.create(payload);

  await ChatGroup.findOneAndUpdate(
    { family: familyObjectId },
    {
      $set: {
        lastMessageAt: message.createdAt,
        lastMessagePreview: String(content).slice(0, 200),
      },
      $setOnInsert: {
        family: familyObjectId,
        name: "Family Chat",
      },
    },
    { upsert: true },
  );

  return message;
};

const createUserTextMessage = async ({ family, user, content }) => {
  const normalizedRole = toRole(user);
  const senderName =
    user.name || (normalizedRole === "child" ? "Child" : "Parent");
  const senderChild =
    normalizedRole === "child" ? user.childProfile || null : null;

  return createMessage({
    familyId: family._id,
    senderUser: user._id,
    senderChild,
    senderName,
    senderRole: normalizedRole,
    content,
    messageType: "text",
  });
};

const createReadingStartedMessage = async ({
  childId,
  storyId,
  startedByUserId,
  sessionId,
}) => {
  const child = await Child.findById(childId).select("name family");
  if (!child) return null;

  const family = await Family.findById(child.family).select("_id");
  if (!family) return null;

  const story = await Story.findById(storyId).select("title");
  const childName = child.name || "A child";
  const storyTitle = story?.title || "a story";

  return createMessage({
    familyId: family._id,
    senderUser: startedByUserId || null,
    senderChild: child._id,
    senderName: "Nestory",
    senderRole: "system",
    messageType: "activity",
    content: `📚 ${childName} started reading ${storyTitle}.`,
    metadata: {
      event: "reading_started",
      childId: String(child._id),
      storyId: String(storyId),
      sessionId: sessionId ? String(sessionId) : null,
    },
  });
};

const getMessages = async ({ familyId, limit = 50, before }) => {
  const familyObjectId = toObjectId(familyId);
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const filter = { family: familyObjectId };
  if (before && mongoose.Types.ObjectId.isValid(before)) {
    filter._id = { $lt: new mongoose.Types.ObjectId(before) };
  }

  const rows = await ChatMessage.find(filter)
    .sort({ _id: -1 })
    .limit(safeLimit)
    .lean();
  return rows.reverse();
};

const markFamilyMessagesRead = async ({
  familyId,
  userId,
  messageIds = [],
}) => {
  const familyObjectId = toObjectId(familyId);
  const userObjectId = toObjectId(userId);

  if (!familyObjectId || !userObjectId) return { modifiedCount: 0 };

  const filter = {
    family: familyObjectId,
    senderUser: { $ne: userObjectId },
    "readBy.user": { $ne: userObjectId },
  };

  if (Array.isArray(messageIds) && messageIds.length > 0) {
    const validIds = messageIds.map((id) => toObjectId(id)).filter(Boolean);

    if (!validIds.length) return { modifiedCount: 0 };
    filter._id = { $in: validIds };
  }

  const result = await ChatMessage.updateMany(filter, {
    $push: { readBy: { user: userObjectId, readAt: new Date() } },
  });

  return result;
};

const getUnreadCount = async ({ familyId, userId }) => {
  const familyObjectId = toObjectId(familyId);
  const userObjectId = toObjectId(userId);
  if (!familyObjectId || !userObjectId) return 0;

  return ChatMessage.countDocuments({
    family: familyObjectId,
    senderUser: { $ne: userObjectId },
    "readBy.user": { $ne: userObjectId },
  });
};

const getFamilyRoomName = (familyId) => `${CHAT_ROOM_PREFIX}${familyId}`;

const serializeMessage = (message) => ({
  ...message,
  id: String(message._id || message.id),
  family: String(message.family),
  senderUser: message.senderUser ? String(message.senderUser) : null,
  senderChild: message.senderChild ? String(message.senderChild) : null,
  readBy: Array.isArray(message.readBy)
    ? message.readBy.map((row) => ({
        user: String(row.user),
        readAt: row.readAt,
      }))
    : [],
});

const clearFamilyMessages = async (familyId) => {
  const familyObjectId = toObjectId(familyId);
  if (!familyObjectId) {
    throw new Error("Invalid family ID");
  }

  const result = await ChatMessage.deleteMany({
    family: familyObjectId,
  });

  return {
    deletedCount: result.deletedCount || 0,
  };
};

module.exports = {
  resolveFamilyForUser,
  ensureChatGroupForFamily,
  createUserTextMessage,
  createReadingStartedMessage,
  createMessage,
  getMessages,
  getUnreadCount,
  markFamilyMessagesRead,
  getFamilyRoomName,
  serializeMessage,
  clearFamilyMessages,
  getAllFamilyMemberUserIds,
};
