const { body, param } = require("express-validator");

exports.startSessionValidation = [
  body("childId").optional().isMongoId().withMessage("Invalid childId format"),

  body("storyId").optional().isMongoId().withMessage("Invalid storyId format"),

  body("bookId").optional().isMongoId().withMessage("Invalid bookId format"),

  body().custom((value, { req }) => {
    if (!value.storyId && !value.bookId) {
      throw new Error("Either storyId or bookId is required");
    }
    const role = req.user?.role;
    if (role === "child") {
      return true;
    }
    if (!value.childId) {
      throw new Error("childId is required");
    }
    return true;
  }),

  body("totalPages")
    .optional()
    .isInt({ min: 1 })
    .withMessage("totalPages must be a positive integer"),
];

exports.updateSessionValidation = [
  body("sessionId")
    .notEmpty()
    .withMessage("sessionId is required")
    .isMongoId()
    .withMessage("Invalid sessionId format"),

  body("pagesRead")
    .optional()
    .isInt({ min: 0 })
    .withMessage("pagesRead must be a non-negative integer"),

  body("timeSpent")
    .optional()
    .isInt({ min: 0 })
    .withMessage("timeSpent must be a non-negative integer"),
];

exports.startMySessionValidation = [
  body("storyId")
    .optional()
    .trim()
    .custom((value) => {
      if (value === "undefined" || value === "null") {
        throw new Error("storyId cannot be 'undefined' or 'null'");
      }
      return true;
    }),

  body("bookId")
    .optional()
    .trim()
    .custom((value) => {
      if (value === "undefined" || value === "null") {
        throw new Error("bookId cannot be 'undefined' or 'null'");
      }
      return true;
    }),

  body().custom((value) => {
    console.log("[readingValidator] startMySessionValidation - body:", value);
    const hasStoryId =
      value &&
      value.storyId &&
      value.storyId !== "undefined" &&
      value.storyId !== "null";
    const hasBookId =
      value &&
      value.bookId &&
      value.bookId !== "undefined" &&
      value.bookId !== "null";
    if (!hasStoryId && !hasBookId) {
      throw new Error(
        "Either storyId or bookId is required (cannot be 'undefined' or 'null')",
      );
    }
    return true;
  }),

  body("totalPages")
    .optional()
    .isInt({ min: 1 })
    .withMessage("totalPages must be a positive integer"),
];

exports.childIdParamValidation = [
  param("childId")
    .notEmpty()
    .withMessage("childId is required")
    .isMongoId()
    .withMessage("Invalid childId format"),
];
