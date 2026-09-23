const { body } = require("express-validator");

// Validation rules for creating a family
exports.createFamilyValidation = [
  body("familyName")
    .trim()
    .notEmpty()
    .withMessage("Family name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Family name must be between 2 and 100 characters"),
];

// Validation rules for updating a family
exports.updateFamilyValidation = [
  body("familyName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Family name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Family name must be between 2 and 100 characters"),
];
