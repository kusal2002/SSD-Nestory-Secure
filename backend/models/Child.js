const mongoose = require("mongoose");

const childSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide child name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    age: {
      type: Number,
      required: [true, "Please provide child age"],
      min: [1, "Age must be at least 1"],
      max: [17, "Age must be under 18"],
    },
    avatar: {
      type: String,
      default: "",
      maxlength: [2048, "Avatar value is too long"],
    },
    readingLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Child", childSchema);
