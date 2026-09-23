const express = require("express");
const router = express.Router();
const {
  startSession,
  startMySession,
  updateSession,
  getWeeklyReadingTime,
  getReadingStreak,
  getMySessions,
  getProgressByBook,
  deleteSession,
  getMonthlyAnalytics,
  getTopBooks,
  getAchievements,
  getMyActivitySummary,
  getFamilyActivitySummary,
} = require("../controllers/readingController");
const { protect, parentOnly, authorize } = require("../middleware/authMiddleware");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const {
  startSessionValidation,
  startMySessionValidation,
  updateSessionValidation,
  childIdParamValidation,
} = require("../validators/readingValidator");

router.get("/", (req, res) =>
  res.json({ success: true, message: "Reading sessions API" }),
);

router.post(
  "/start",
  protect,
  startSessionValidation,
  handleValidationErrors,
  startSession,
);

router.post(
  "/start-me",
  protect,
  authorize("child"),
  startMySessionValidation,
  handleValidationErrors,
  startMySession,
);

router.post(
  "/update",
  protect,
  updateSessionValidation,
  handleValidationErrors,
  updateSession,
);

router.get(
  "/weekly/:childId",
  protect,
  parentOnly,
  childIdParamValidation,
  handleValidationErrors,
  getWeeklyReadingTime,
);

router.get(
  "/streak/:childId",
  protect,
  parentOnly,
  childIdParamValidation,
  handleValidationErrors,
  getReadingStreak,
);

router.get("/my-sessions", protect, getMySessions);

router.get(
  "/me/activity-summary",
  protect,
  authorize("child"),
  getMyActivitySummary,
);

router.get(
  "/activity-summary/family",
  protect,
  parentOnly,
  getFamilyActivitySummary,
);

router.get("/progress/:bookId", protect, getProgressByBook);

router.delete("/:sessionId", protect, deleteSession);

router.get("/monthly/:childId", protect, getMonthlyAnalytics);

router.get("/top-books/:childId", protect, getTopBooks);

router.get("/achievements/:childId", protect, getAchievements);

module.exports = router;
