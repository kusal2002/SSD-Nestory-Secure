const express = require('express');
const router = express.Router();
const {
  getUserProgress,
  awardPoints,
  getLeaderboard,
  getAllBadges,
  createBadge,
  awardBadge,
  getAllAchievements,
  createAchievement,
  updateAchievementProgress,
  getTransactionHistory,
  getUserBadges,
  getUserAchievements,
  generateTodayChallenge,
  getTodayChallenge,
  updateTodayChallengeProgress,
  generateQuiz,
  completeQuiz,
  test,
  getSystemStats,
  getLevelDistribution,
  getXpTimeline
} = require('../../controllers/gamification/gamificationController');
const { protect } = require('../../middleware/authMiddleware');
const { admin } = require('../../middleware/authMiddleware');

// Progress routes
router.get('/progress/:userId', protect, getUserProgress);

// Points routes
router.post('/points/award', protect, awardPoints);
router.get('/transactions/:userId', protect, getTransactionHistory);

// Leaderboard
router.get('/leaderboard', protect, getLeaderboard);

// Badge routes
router.get('/badges', protect, getAllBadges);
router.get('/test', protect, test);
router.post('/badges', protect, admin, createBadge);
router.post('/badges/award', protect, awardBadge);
router.get('/user-badges/:userId', protect, getUserBadges);

// Achievement routes
router.get('/achievements', protect, getAllAchievements);
router.post('/achievements', protect, admin, createAchievement);
router.post('/achievements/progress', protect, updateAchievementProgress);
router.get('/user-achievements/:userId', protect, getUserAchievements);

// Daily AI challenge routes
router.post('/challenges/generate', protect, generateTodayChallenge);
router.get('/challenges/today/:userId', protect, getTodayChallenge);
router.post('/challenges/progress', protect, updateTodayChallengeProgress);

// AI Quiz routes
router.post('/quizzes/generate', protect, generateQuiz);
router.post('/quizzes/complete', protect, completeQuiz);

// Admin statistics routes
router.get('/stats/system', protect, admin, getSystemStats);
router.get('/stats/level-distribution', protect, admin, getLevelDistribution);
router.get('/stats/xp-timeline', protect, admin, getXpTimeline);

module.exports = router;
