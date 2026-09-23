const express = require("express");
const router = express.Router();
const {
  createFamily,
  getMyFamily,
  getFamilyById,
  updateFamily,
  deleteFamily,
} = require("../controllers/familyController");
const { protect, parentOnly } = require("../middleware/authMiddleware");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const {
  createFamilyValidation,
  updateFamilyValidation,
} = require("../validators/familyValidator");

// All routes are protected (must be logged in)
router.post(
  "/",
  protect,
  parentOnly,
  createFamilyValidation,
  handleValidationErrors,
  createFamily,
);
router.get("/my", protect, parentOnly, getMyFamily);
router.get("/:id", protect, parentOnly, getFamilyById);
router.put(
  "/:id",
  protect,
  parentOnly,
  updateFamilyValidation,
  handleValidationErrors,
  updateFamily,
);
router.delete("/:id", protect, parentOnly, deleteFamily);

module.exports = router;
