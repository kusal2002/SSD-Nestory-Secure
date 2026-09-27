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
const { authorizeGamificationTarget } = require("../../middleware/gamificationAuthorizationMiddleware");

// Progress routes old 
// router.get('/progress/:userId', protect, getUserProgress);
//New
router.get('/progress/:userId', protect, authorizeGamificationTarget, getUserProgress);

// Points routes old 
// router.post('/points/award', protect, awardPoints);
//vul -1
// router.post('/points/award', protect, authorizeGamificationTarget, awardPoints);
router.post('/points/award', protect, admin, awardPoints);

//old 
// router.get('/transactions/:userId', protect, getTransactionHistory);
//new
router.get('/transactions/:userId', protect, authorizeGamificationTarget, getTransactionHistory);

// Leaderboard
router.get('/leaderboard', protect, getLeaderboard);

// Badge routes
router.get('/badges', protect, getAllBadges);
router.get('/test', protect, test);
router.post('/badges', protect, admin, createBadge);
/*
router.post('/badges/award', protect, awardBadge);
router.get('/user-badges/:userId', protect, getUserBadges); */
router.post('/badges/award', protect, authorizeGamificationTarget, awardBadge);
router.get('/user-badges/:userId', protect, authorizeGamificationTarget, getUserBadges);


// Achievement routes
router.get('/achievements', protect, getAllAchievements);
router.post('/achievements', protect, admin, createAchievement);
/*
router.post('/achievements/progress', protect, updateAchievementProgress);
router.get('/user-achievements/:userId', protect, getUserAchievements); */
router.post('/achievements/progress', protect, authorizeGamificationTarget, updateAchievementProgress);
router.get('/user-achievements/:userId', protect, authorizeGamificationTarget, getUserAchievements);

// Daily AI challenge routes
/*
router.post('/challenges/generate', protect, generateTodayChallenge);
router.get('/challenges/today/:userId', protect, getTodayChallenge);
router.post('/challenges/progress', protect, updateTodayChallengeProgress);

// AI Quiz routes
router.post('/quizzes/generate', protect, generateQuiz);
router.post('/quizzes/complete', protect, completeQuiz); */

router.post('/challenges/generate', protect, authorizeGamificationTarget, generateTodayChallenge);
router.get('/challenges/today/:userId', protect, authorizeGamificationTarget, getTodayChallenge);
router.post('/challenges/progress', protect, authorizeGamificationTarget, updateTodayChallengeProgress);

router.post('/quizzes/generate', protect, authorizeGamificationTarget, generateQuiz);
router.post('/quizzes/complete', protect, authorizeGamificationTarget, completeQuiz);

// Admin statistics routes
router.get('/stats/system', protect, admin, getSystemStats);
router.get('/stats/level-distribution', protect, admin, getLevelDistribution);
router.get('/stats/xp-timeline', protect, admin, getXpTimeline);

module.exports = router;


