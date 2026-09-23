const mongoose = require("mongoose");

/**
 * One row per "Save progress" — enables accurate pages/minutes in a date range.
 */
const readingActivitySchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingSession",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },
    pagesAdded: {
      type: Number,
      default: 0,
      min: 0,
    },
    minutesAdded: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

readingActivitySchema.index({ childId: 1, createdAt: -1 });

module.exports = mongoose.model("ReadingActivity", readingActivitySchema);
