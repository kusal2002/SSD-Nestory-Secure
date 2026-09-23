const mongoose = require("mongoose");

const readReceiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const chatMessageSchema = new mongoose.Schema(
  {
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
      index: true,
    },
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      default: null,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, "Sender name cannot exceed 80 characters"],
    },
    senderRole: {
      type: String,
      enum: ["parent", "child", "system"],
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "activity", "system"],
      default: "text",
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1500, "Message content cannot exceed 1500 characters"],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readBy: {
      type: [readReceiptSchema],
      default: [],
    },
  },
  { timestamps: true },
);

chatMessageSchema.index({ family: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
