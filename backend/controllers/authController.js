const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Compared against when no user matches, so login takes the same time
// whether or not the email is registered.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("nestory-dummy-password", 10);

// Same response for known and unknown emails, so forgot-password
// cannot be used to discover registered accounts.
const FORGOT_PASSWORD_RESPONSE = {
  success: true,
  message:
    "If an account exists for this email, password reset instructions have been sent.",
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword === true,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      await bcrypt.compare(String(password), DUMMY_PASSWORD_HASH);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password before revealing anything about the account's state
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword === true,
        token: generateToken(user._id),
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

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          childProfile: user.childProfile || null,
          profilePicture: user.profilePicture,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword === true,
          createdAt: user.createdAt,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    // Passwords may only change through /change-password, which verifies the
    // current password; a bearer token alone must not be enough.
    if (req.body.password !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Password cannot be changed here. Use the change password option",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (user) {
      // Changing the login email is an account-takeover step, so it also
      // requires the current password.
      const newEmail = req.body.email ? String(req.body.email).toLowerCase() : null;
      if (newEmail && newEmail !== user.email) {
        const { currentPassword } = req.body;
        if (!currentPassword || !(await user.matchPassword(currentPassword))) {
          return res.status(401).json({
            success: false,
            message: "Current password is required to change email",
          });
        }
        user.email = newEmail;
      }

      user.name = req.body.name || user.name;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.profilePicture = req.body.profilePicture || user.profilePicture;

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          profilePicture: updatedUser.profilePicture,
          phoneNumber: updatedUser.phoneNumber,
          mustChangePassword: updatedUser.mustChangePassword === true,
          token: generateToken(updatedUser._id),
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
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

// @desc    Delete user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    // Validate that :id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.status(200).json({
        success: true,
        message: "User removed successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Change current user's password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password and new password",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordMatch = await user.matchPassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    // Older tokens are now rejected, so give this session a fresh one
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: {
        mustChangePassword: false,
        token: generateToken(user._id),
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

// @desc    Forgot password - Generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json(FORGOT_PASSWORD_RESPONSE);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire time to 1 hour from now
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    await user.save();

    // Deliver the reset link out-of-band only (never in the API response).
    // No email service is configured, so outside production the link is
    // written to the server console to simulate email delivery.
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Password reset] Link for ${user.email}: ${resetUrl}`);
    }

    res.status(200).json(FORGOT_PASSWORD_RESPONSE);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide reset token and new password",
      });
    }

    // Hash the token to match with database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token and check if token is not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.mustChangePassword = false;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
      data: {
        token: generateToken(user._id),
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

// @desc    Change current user's username
// @route   PUT /api/auth/change-username
// @access  Private
exports.changeUsername = async (req, res) => {
  try {
    const { newUsername, password } = req.body;

    if (!newUsername || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide new username and password to confirm",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    // Check if username already exists (if username field exists in schema)
    if (user.username) {
      const usernameExists = await User.findOne({ 
        username: newUsername,
        _id: { $ne: user._id } 
      });

      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    // Update username (if schema supports it) or name
    if (user.username !== undefined) {
      user.username = newUsername;
    } else {
      user.name = newUsername;
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      message: "Username changed successfully",
      data: {
        username: user.username || user.name,
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
