const mongoose = require("mongoose");

const readingSessionSchema = new mongoose.Schema(
  {
    // Link to the child profile who is reading
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    // Link to the Story from the story library
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },
    pagesRead: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeSpent: {
      type: Number, // minutes
      default: 0,
      min: 0,
    },
    // Stored on session until Book model exists
    totalPages: {
      type: Number,
      required: true,
      min: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ReadingSession", readingSessionSchema);
