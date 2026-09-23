const Child = require("../models/Child");
const Family = require("../models/Family");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const ReadingSession = require("../models/ReadingSession");
const ReadingActivity = require("../models/ReadingActivity");
const UserProgress = require("../models/gamification/UserProgress");
const PointTransaction = require("../models/gamification/PointTransaction");
const mongoose = require("mongoose");
const { normalizeChild } = require("../utils/contractTransformers");
const generateToken = require("../utils/generateToken");

const toSafeSlug = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12) || "child";

const generateTemporaryPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < 10; i += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return password;
};

const buildChildLoginEmail = async ({ childName, parentId }) => {
  const base = `${toSafeSlug(childName)}.${String(parentId).slice(-6)}`;
  let candidate = `${base}@nestory.app`;
  let suffix = 1;

  // Ensure unique login email across all user accounts.
  while (await User.exists({ email: candidate })) {
    candidate = `${base}${suffix}@nestory.app`;
    suffix += 1;
  }

  return candidate;
};

// @desc    Add a child to the parent's family
// @route   POST /api/children
// @access  Private
exports.addChild = async (req, res) => {
  try {
    const { name, age, avatar, readingLevel, email } = req.body;

    // Parent must have a family group first
    const family = await Family.findOne({ parent: req.user._id });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "No family group found. Please create a family group first.",
      });
    }

    // Determine the email to use for child account
    let childLoginEmail;
    if (email) {
      // Check if provided email is unique
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use. Please provide a different email.",
        });
      }
      childLoginEmail = email.toLowerCase();
    } else {
      // Generate email if not provided
      childLoginEmail = await buildChildLoginEmail({
        childName: name,
        parentId: req.user._id,
      });
    }

    const temporaryPassword = generateTemporaryPassword();

    // Create the child profile first, then create the linked child account.
    const child = await Child.create({
      name,
      age,
      avatar: avatar || "",
      readingLevel: readingLevel || "beginner",
      family: family._id,
      parent: req.user._id,
      email: childLoginEmail,
    });

    let childUser;
    try {
      childUser = await User.create({
        name,
        email: childLoginEmail,
        password: temporaryPassword,
        role: "child",
        childProfile: child._id,
        parentAccount: req.user._id,
        mustChangePassword: true,
      });
    } catch (accountError) {
      await Child.findByIdAndDelete(child._id);
      throw accountError;
    }

    if (!childUser) {
      await Child.findByIdAndDelete(child._id);
      return res.status(500).json({
        success: false,
        message: "Failed to create child account",
      });
    }

    // Add child reference to the family's children array
    family.children.push(child._id);
    await family.save();

    res.status(201).json({
      success: true,
      message: "Child added successfully",
      data: {
        child: normalizeChild(child),
        credentials: {
          email: childLoginEmail,
          temporaryPassword,
          mustChangePassword: true,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all children in the parent's family
// @route   GET /api/children
// @access  Private
exports.getChildren = async (req, res) => {
  try {
    const family = await Family.findOne({ parent: req.user._id });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "No family group found. Please create a family group first.",
      });
    }

    const children = await Child.find({
      parent: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Children retrieved successfully",
      count: children.length,
      data: children.map(normalizeChild),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get a single child by ID
// @route   GET /api/children/:id
// @access  Private
exports.getChildById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid child ID format",
      });
    }

    const child = await Child.findById(req.params.id).populate(
      "family",
      "familyName",
    );

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Only the parent who owns this child can view it
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this child profile",
      });
    }

    res.status(200).json({
      success: true,
      message: "Child retrieved successfully",
      data: normalizeChild(child),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update a child profile
// @route   PUT /api/children/:id
// @access  Private
exports.updateChild = async (req, res) => {
  try {
    const { name, age, avatar, readingLevel } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid child ID format",
      });
    }

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Only the parent who owns this child can update it
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this child profile",
      });
    }

    child.name = name || child.name;
    child.age = age !== undefined ? age : child.age;
    child.avatar = avatar !== undefined ? avatar : child.avatar;
    child.readingLevel =
      readingLevel !== undefined ? readingLevel : child.readingLevel;
    await child.save();

    // Keep linked child user profile name aligned with child profile name.
    await User.updateOne(
      { childProfile: child._id },
      {
        $set: {
          name: child.name,
        },
      },
    );

    res.status(200).json({
      success: true,
      message: "Child profile updated successfully",
      data: normalizeChild(child),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete a child (remove from family)
// @route   DELETE /api/children/:id
// @access  Private
exports.deleteChild = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid child ID format",
      });
    }

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Only the parent who owns this child can delete it
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this child profile",
      });
    }

    const childObjectId = child._id;

    await Promise.all([
      Assignment.deleteMany({ child: childObjectId }),
      ReadingSession.deleteMany({ childId: childObjectId }),
      ReadingActivity.deleteMany({ childId: childObjectId }),
      UserProgress.deleteMany({ child: childObjectId }),
      PointTransaction.deleteMany({ child: childObjectId }),
    ]);

    await Family.findByIdAndUpdate(child.family, {
      $pull: { children: childObjectId },
    });

    await User.deleteOne({ childProfile: childObjectId });

    await Child.findByIdAndDelete(childObjectId);

    res.status(200).json({
      success: true,
      message: "Child removed successfully",
      data: {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Reset a child's login password (parent-triggered)
// @route   POST /api/children/:id/reset-password
// @access  Private (Parent only)
exports.resetChildPassword = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid child ID format",
      });
    }

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reset password for this child",
      });
    }

    const childUser = await User.findOne({
      childProfile: child._id,
      role: "child",
      parentAccount: req.user._id,
    }).select("+password");

    if (!childUser) {
      return res.status(404).json({
        success: false,
        message: "Child login account not found",
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    childUser.password = temporaryPassword;
    childUser.mustChangePassword = true;
    await childUser.save();

    res.status(200).json({
      success: true,
      message: "Child password reset successfully",
      data: {
        child: normalizeChild(child),
        credentials: {
          email: childUser.email,
          temporaryPassword,
          mustChangePassword: true,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
