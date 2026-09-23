const jwt = require("jsonwebtoken");
const User = require("../models/User");

const normalizeRole = (role) => {
  if (role === "user") return "parent";
  return role;
};

// Protect routes - Authentication middleware
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      if (req.user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: "User account is inactive",
        });
      }

      req.user.normalizedRole = normalizeRole(req.user.role);

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};

exports.authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const roleToCheck = req.user.normalizedRole || normalizeRole(req.user.role);

    if (!allowedRoles.includes(roleToCheck)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this resource",
      });
    }

    next();
  };

exports.parentOnly = exports.authorize("parent");

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized as admin",
    });
  }
};
