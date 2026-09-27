const mongoose = require("mongoose");
const User = require("../models/User");
const Child = require("../models/Child");

const normalizeRole = (role) => {
  if (role === "user") return "parent";
  return role;
};

/**
 * Ensures that the authenticated user is allowed to access
 * the requested gamification user/child resource.
 */
exports.authorizeGamificationTarget = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Admin users may access any gamification target.
    if (req.user.role === "admin") {
      return next();
    }

    const requestedUserId =
      req.params?.userId ||
      req.body?.userId;

    const requestedChildId =
      req.query?.childId ||
      req.body?.childId ||
      null;

    if (!requestedUserId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(requestedUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    if (
      requestedChildId &&
      !mongoose.Types.ObjectId.isValid(requestedChildId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid childId",
      });
    }

    const targetUser = await User.findById(requestedUserId).select(
      "role parentAccount childProfile"
    );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    let targetParentId = targetUser._id.toString();
    let targetChildId = requestedChildId
      ? requestedChildId.toString()
      : null;

    // Child accounts are represented through their parent account
    // and linked Child profile in the gamification records.
    if (targetUser.role === "child") {
      if (!targetUser.parentAccount || !targetUser.childProfile) {
        return res.status(403).json({
          success: false,
          message: "Child account is not correctly linked",
        });
      }

      targetParentId = targetUser.parentAccount.toString();
      const linkedChildId = targetUser.childProfile.toString();

      // Prevent mixing one child account with another child profile.
      if (
        targetChildId &&
        targetChildId !== linkedChildId
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this gamification resource",
        });
      }

      targetChildId = linkedChildId;
    }

    const requesterRole =
      req.user.normalizedRole || normalizeRole(req.user.role);

    // Child users may only access their own linked gamification resource.
    if (requesterRole === "child") {
      const ownParentId = req.user.parentAccount?.toString();
      const ownChildId = req.user.childProfile?.toString();

      if (
        !ownParentId ||
        !ownChildId ||
        targetParentId !== ownParentId ||
        targetChildId !== ownChildId
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this gamification resource",
        });
      }

      return next();
    }

    // Parent users may only access their own account.
    if (targetParentId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this gamification resource",
      });
    }

    // If a child is specified, ensure that the child belongs to this parent.
    if (targetChildId) {
      const ownedChild = await Child.exists({
        _id: targetChildId,
        parent: req.user._id,
        isActive: true,
      });

      if (!ownedChild) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this child resource",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Gamification authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Authorization check failed",
    });
  }
};