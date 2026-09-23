const { body } = require("express-validator");

const readingLevels = ["beginner", "intermediate", "advanced"];
const avatarEmojiRegex = /^(\p{Extended_Pictographic}|\uFE0F|\u200D)+$/u;

const isValidAvatar = (value) => {
  if (value === "") return true;

  const isUrl = /^https?:\/\//i.test(value);
  if (isUrl) {
    try {
      new URL(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  return avatarEmojiRegex.test(value.trim());
};

// Validation rules for adding a child
exports.addChildValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Child name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Child name must be between 2 and 50 characters"),

  body("age")
    .notEmpty()
    .withMessage("Child age is required")
    .isInt({ min: 1, max: 17 })
    .withMessage("Age must be a whole number between 1 and 17"),

  body("avatar")
    .optional()
    .trim()
    .isLength({ max: 2048 })
    .withMessage("Avatar must be 2048 characters or less")
    .custom((value) => isValidAvatar(value))
    .withMessage("Avatar must be an emoji or a valid http/https URL"),

  body("readingLevel")
    .optional()
    .isIn(readingLevels)
    .withMessage(
      "Reading level must be one of: beginner, intermediate, advanced",
    ),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

// Validation rules for updating a child
exports.updateChildValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Child name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Child name must be between 2 and 50 characters"),

  body("age")
    .optional()
    .isInt({ min: 1, max: 17 })
    .withMessage("Age must be a whole number between 1 and 17"),

  body("avatar")
    .optional()
    .trim()
    .isLength({ max: 2048 })
    .withMessage("Avatar must be 2048 characters or less")
    .custom((value) => isValidAvatar(value))
    .withMessage("Avatar must be an emoji or a valid http/https URL"),

  body("readingLevel")
    .optional()
    .isIn(readingLevels)
    .withMessage(
      "Reading level must be one of: beginner, intermediate, advanced",
    ),
];
