const { body, param, query } = require("express-validator");

// Validation for creating an assignment
exports.createAssignmentValidation = [
  body("childId")
    .notEmpty()
    .withMessage("Child ID is required")
    .isMongoId()
    .withMessage("Invalid Child ID format"),

  body("storyId")
    .notEmpty()
    .withMessage("Story ID is required")
    .isMongoId()
    .withMessage("Invalid Story ID format"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Due date cannot be in the past");
      }
      return true;
    }),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Notes cannot exceed 300 characters"),
];

// Validation for updating assignment status
exports.updateStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["assigned", "in_progress", "completed"])
    .withMessage("Status must be one of: assigned, in_progress, completed"),
];

exports.updateAssignmentDetailsValidation = [
  body("dueDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Due date must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error("Due date cannot be in the past");
      }
      return true;
    }),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Notes cannot exceed 300 characters"),
];

exports.assignmentIdParamValidation = [
  param("id").isMongoId().withMessage("Invalid assignment ID format"),
];

exports.childIdParamValidation = [
  param("childId").isMongoId().withMessage("Invalid child ID format"),
];

exports.listAssignmentsQueryValidation = [
  query("childId")
    .optional()
    .isMongoId()
    .withMessage("Invalid child ID format"),
  query("status")
    .optional()
    .isIn(["assigned", "in_progress", "completed"])
    .withMessage("Status must be one of: assigned, in_progress, completed"),
  query("dueState")
    .optional()
    .isIn(["all", "overdue", "due_soon", "upcoming", "none"])
    .withMessage(
      "dueState must be one of: all, overdue, due_soon, upcoming, none",
    ),
  query("dueSoonDays")
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage("dueSoonDays must be an integer between 1 and 30"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100"),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "dueDate", "status"])
    .withMessage("sortBy must be one of: createdAt, dueDate, status"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be one of: asc, desc"),
];

exports.bulkUpdateStatusValidation = [
  body("assignmentIds")
    .isArray({ min: 1 })
    .withMessage("assignmentIds must be a non-empty array"),
  body("assignmentIds.*")
    .isMongoId()
    .withMessage("Each assignment ID must be a valid MongoDB ID"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["assigned", "in_progress", "completed"])
    .withMessage("Status must be one of: assigned, in_progress, completed"),
];
