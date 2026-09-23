const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  getAllUsers,
  deleteUser,
  changePassword,
  changeUsername,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../validators/authValidator");

// Public routes
router.post("/register", registerValidation, handleValidationErrors, register);
router.post("/login", loginValidation, handleValidationErrors, login);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  handleValidationErrors,
  forgotPassword
);
router.post(
  "/reset-password/:token",
  resetPasswordValidation,
  handleValidationErrors,
  resetPassword
);

// Protected routes
router.get("/me", protect, getMe);
router.put(
  "/profile",
  protect,
  updateProfileValidation,
  handleValidationErrors,
  updateProfile,
);
router.put(
  "/change-password",
  protect,
  changePasswordValidation,
  handleValidationErrors,
  changePassword,
);
router.put(
  "/change-username",
  protect,
  changeUsername,
);

// Admin routes
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, deleteUser);

module.exports = router;
