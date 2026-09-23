const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to check for errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Award points validation
exports.awardPointsValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),
  body('points')
    .notEmpty()
    .withMessage('Points are required')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('source')
    .notEmpty()
    .withMessage('Source is required')
    .isIn(['story_read', 'assignment_completed', 'badge_earned', 'streak_bonus', 'achievement', 'manual', 'daily_login'])
    .withMessage('Invalid source type'),
  body('childId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Child ID format'),
  validate
];

// Create badge validation
exports.createBadgeValidation = [
  body('name')
    .notEmpty()
    .withMessage('Badge name is required')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Badge name must be between 3 and 50 characters'),
  body('description')
    .notEmpty()
    .withMessage('Badge description is required')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
  body('category')
    .optional()
    .isIn(['reading', 'streak', 'achievement', 'social', 'special'])
    .withMessage('Invalid badge category'),
  body('tier')
    .optional()
    .isIn(['bronze', 'silver', 'gold', 'platinum', 'diamond'])
    .withMessage('Invalid badge tier'),
  body('points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Points must be a non-negative integer'),
  body('criteria.type')
    .notEmpty()
    .withMessage('Criteria type is required')
    .isIn(['story_count', 'days_streak', 'total_points', 'assignments_completed', 'custom'])
    .withMessage('Invalid criteria type'),
  body('criteria.threshold')
    .notEmpty()
    .withMessage('Criteria threshold is required')
    .isInt({ min: 1 })
    .withMessage('Threshold must be a positive integer'),
  validate
];

// Award badge validation
exports.awardBadgeValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),
  body('badgeId')
    .notEmpty()
    .withMessage('Badge ID is required')
    .isMongoId()
    .withMessage('Invalid Badge ID format'),
  body('childId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Child ID format'),
  validate
];

// Create achievement validation
exports.createAchievementValidation = [
  body('name')
    .notEmpty()
    .withMessage('Achievement name is required')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Achievement name must be between 3 and 50 characters'),
  body('description')
    .notEmpty()
    .withMessage('Achievement description is required')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
  body('category')
    .optional()
    .isIn(['reading', 'consistency', 'milestone', 'social', 'exploration'])
    .withMessage('Invalid achievement category'),
  body('targetValue')
    .notEmpty()
    .withMessage('Target value is required')
    .isInt({ min: 1 })
    .withMessage('Target value must be a positive integer'),
  body('reward.points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reward points must be a non-negative integer'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'expert'])
    .withMessage('Invalid difficulty level'),
  validate
];

// Update achievement progress validation
exports.updateAchievementProgressValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),
  body('achievementId')
    .notEmpty()
    .withMessage('Achievement ID is required')
    .isMongoId()
    .withMessage('Invalid Achievement ID format'),
  body('progressIncrement')
    .notEmpty()
    .withMessage('Progress increment is required')
    .isInt({ min: 1 })
    .withMessage('Progress increment must be a positive integer'),
  body('childId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Child ID format'),
  validate
];

// Get user progress validation
exports.getUserProgressValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),
  query('childId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Child ID format'),
  validate
];

// Get transaction history validation
exports.getTransactionHistoryValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),
  query('childId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Child ID format'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['earn', 'spend', 'bonus', 'penalty', 'adjustment'])
    .withMessage('Invalid transaction type'),
  validate
];
