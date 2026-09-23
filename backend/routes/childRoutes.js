const express = require("express");
const router = express.Router();
const {
  addChild,
  getChildren,
  getChildById,
  updateChild,
  deleteChild,
  resetChildPassword,
} = require("../controllers/childController");
const { protect, parentOnly } = require("../middleware/authMiddleware");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const {
  addChildValidation,
  updateChildValidation,
} = require("../validators/childValidator");

// All routes are protected (must be logged in)
router.post(
  "/",
  protect,
  parentOnly,
  addChildValidation,
  handleValidationErrors,
  addChild,
);
router.get("/", protect, parentOnly, getChildren);
router.get("/:id", protect, parentOnly, getChildById);
router.put(
  "/:id",
  protect,
  parentOnly,
  updateChildValidation,
  handleValidationErrors,
  updateChild,
);
router.delete("/:id", protect, parentOnly, deleteChild);
router.post("/:id/reset-password", protect, parentOnly, resetChildPassword);

module.exports = router;
