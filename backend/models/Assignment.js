const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: [true, "Child is required"],
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: [true, "Story is required"],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    status: {
      type: String,
      enum: ["assigned", "in_progress", "completed"],
      default: "assigned",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
      maxlength: [300, "Notes cannot exceed 300 characters"],
    },
  },
  { timestamps: true },
);

// Prevent assigning the same story to the same child twice
assignmentSchema.index({ child: 1, story: 1 }, { unique: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
