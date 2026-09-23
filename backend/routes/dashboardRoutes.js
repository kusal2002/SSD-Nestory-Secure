const express = require("express");
const router = express.Router();
const { protect, parentOnly } = require("../middleware/authMiddleware");
const {
  getFamilyDashboard,
  getChildDashboard,
  getFamilySummary,
} = require("../controllers/dashboardController");

// GET /api/dashboard/family  — full family dashboard
router.get("/family", protect, parentOnly, getFamilyDashboard);

// GET /api/dashboard/child/:childId  — single child detailed view
router.get("/child/:childId", protect, parentOnly, getChildDashboard);

// GET /api/dashboard/summary  — quick totals summary
router.get("/summary", protect, parentOnly, getFamilySummary);

module.exports = router;
