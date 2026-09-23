const Family = require("../models/Family");
const ChatGroup = require("../models/ChatGroup");
const ChatMessage = require("../models/ChatMessage");
const mongoose = require("mongoose");
require("../models/Child"); // Register Child model so populate('children') works
const { normalizeFamily } = require("../utils/contractTransformers");
const { ensureChatGroupForFamily } = require("../services/chatService");
// @desc    Create a new family group
// @route   POST /api/family
// @access  Private (Parent only)
exports.createFamily = async (req, res) => {
  try {
    const { familyName } = req.body;

    // Check if this parent already has a family
    const existingFamily = await Family.findOne({ parent: req.user._id });
    if (existingFamily) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a family group. Only one family group is allowed per parent.",
      });
    }

    const family = await Family.create({
      familyName,
      parent: req.user._id,
    });

    const chatGroup = await ensureChatGroupForFamily(family);
    if (chatGroup) {
      family.chatGroup = chatGroup._id;
      await family.save();
    }

    res.status(201).json({
      success: true,
      message: "Family group created successfully",
      data: normalizeFamily(family),
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

// @desc    Get my family group (with children populated)
// @route   GET /api/family/my
// @access  Private
exports.getMyFamily = async (req, res) => {
  try {
    const family = await Family.findOne({ parent: req.user._id }).populate(
      "children",
      "name age avatar readingLevel isActive",
    );

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "No family group found. Please create one.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Family group retrieved successfully",
      data: normalizeFamily(family),
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

// @desc    Get family by ID
// @route   GET /api/family/:id
// @access  Private
exports.getFamilyById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid family ID format",
      });
    }

    const family = await Family.findById(req.params.id).populate(
      "children",
      "name age avatar readingLevel isActive",
    );

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found",
      });
    }

    // Only the parent who owns the family can view it
    if (family.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this family",
      });
    }

    res.status(200).json({
      success: true,
      message: "Family retrieved successfully",
      data: normalizeFamily(family),
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

// @desc    Update family name
// @route   PUT /api/family/:id
// @access  Private
exports.updateFamily = async (req, res) => {
  try {
    const { familyName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid family ID format",
      });
    }

    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found",
      });
    }

    // Only the parent who owns the family can update it
    if (family.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this family",
      });
    }

    family.familyName = familyName || family.familyName;
    await family.save();

    res.status(200).json({
      success: true,
      message: "Family updated successfully",
      data: normalizeFamily(family),
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

// @desc    Delete family group
// @route   DELETE /api/family/:id
// @access  Private
exports.deleteFamily = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid family ID format",
      });
    }

    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found",
      });
    }

    // Only the parent who owns the family can delete it
    if (family.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this family",
      });
    }

    await ChatMessage.deleteMany({ family: family._id });
    await ChatGroup.deleteOne({ family: family._id });
    await Family.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Family group deleted successfully",
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

// @desc    Get chat group for a family
// @route   GET /api/family/:id/chat
// @access  Private
exports.getFamilyChat = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid family ID format",
      });
    }

    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found",
      });
    }

    // Get or create chat group for this family
    let chatGroup = await ChatGroup.findOne({ family: family._id });
    if (!chatGroup) {
      chatGroup = await ensureChatGroupForFamily(family);
    }

    res.status(200).json({
      success: true,
      message: "Chat group retrieved successfully",
      data: {
        chatGroupId: chatGroup._id,
        chatGroup: chatGroup,
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
