const UserProgress = require('../../models/gamification/UserProgress');
const Badge = require('../../models/gamification/Badge');
const Achievement = require('../../models/gamification/Achievement');
const PointTransaction = require('../../models/gamification/PointTransaction');
const DailyChallenge = require('../../models/gamification/DailyChallenge');
const User = require('../../models/User');
const Child = require('../../models/Child');
const GamificationService = require('../../services/gamification/gamificationService');
const { generateDailyChallenge } = require('../../services/gamification/aiChallengeService');
const aiQuizService = require('../../services/gamification/aiQuizService');

// Helper function to check if achievement is available to user
const checkAchievementAvailability = (progress, achievement) => {
  // Check prerequisites
  if (achievement.prerequisites && achievement.prerequisites.length > 0) {
    for (const prereqName of achievement.prerequisites) {
      const prereqAchievement = progress.achievements.find(
        ua => ua.achievement.name === prereqName && ua.completed
      );
      if (!prereqAchievement) {
        return false;
      }
    }
  }
  return true;
};

const getDateKey = (inputDate = new Date()) => {
  const d = new Date(inputDate);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resolveUserAndChild = async (userId, childId) => {
  const user = await User.findById(userId).select('role parentAccount childProfile');

  let actualUserId = userId;
  let actualChildId = childId;

  if (user && user.role === 'child') {
    actualUserId = user.parentAccount || userId;
    if (!actualChildId) {
      actualChildId = user.childProfile || null;
    }
  }

  return {
    actualUserId,
    actualChildId
  };
};

// @desc    Get user progress/stats
// @route   GET /api/gamification/progress/:userId
// @access  Private
exports.getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { childId } = req.query;

    // If the userId matches a child user, we need to resolve to parent account
    const user = await User.findById(userId).select('role parentAccount childProfile');
    
    let actualUserId = userId;
    let actualChildId = childId;

    // If requesting user is a child, use their parent account
    if (user && user.role === 'child') {
      actualUserId = user.parentAccount || userId;
      // If no explicit childId provided, use the child's own childProfile
      if (!actualChildId) {
        actualChildId = user.childProfile;
      }
    }

    const query = { user: actualUserId };
    if (actualChildId) {
      query.child = actualChildId;
    }

    let progress = await UserProgress.findOne(query)
      .populate({
        path: 'badges.badge'
      })
      .populate({
        path: 'achievements.achievement'
      })
      .populate({
        path: 'child',
        select: 'name age avatar'
      });

    if (!progress) {
      // Create initial progress for user
      progress = await UserProgress.create({
        user: actualUserId,
        child: actualChildId || null
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user progress',
      error: error.message
    });
  }
};

// @desc    Gamification controller health check
// @route   GET /api/gamification/test
// @access  Private
exports.test = async (req, res) => {
  res.status(200).json({ success: true, message: 'Gamification controller is available' });
};

// @desc    Get progress system statistics (admin)
// @route   GET /api/gamification/stats/system
// @access  Private/Admin
exports.getSystemStats = async (req, res) => {
  try {
    // Total players with progress
    const totalPlayers = await UserProgress.countDocuments({
      user: { $ne: null }
    });

    // Get all progress records to calculate average level and total XP
    const allProgress = await UserProgress.find({
      user: { $ne: null }
    }).select('level totalPoints');

    const avgLevel = totalPlayers > 0 
      ? Math.round((allProgress.reduce((sum, p) => sum + (p.level || 1), 0) / totalPlayers) * 10) / 10
      : 0;

    const totalXpAwarded = allProgress.reduce((sum, p) => sum + (p.totalPoints || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalPlayers,
        avgLevel,
        totalXpAwarded
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching system stats',
      error: error.message
    });
  }
};

// @desc    Get level distribution chart data (admin)
// @route   GET /api/gamification/stats/level-distribution
// @access  Private/Admin
exports.getLevelDistribution = async (req, res) => {
  try {
    // Get distribution of players across levels
    const distribution = await UserProgress.aggregate([
      {
        $match: { user: { $ne: null } }
      },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const data = distribution.map(d => ({
      level: d._id || 1,
      players: d.count
    }));

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching level distribution',
      error: error.message
    });
  }
};

// @desc    Get XP progress over time (admin)
// @route   GET /api/gamification/stats/xp-timeline
// @access  Private/Admin
exports.getXpTimeline = async (req, res) => {
  try {
    // Get XP transactions over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeline = await PointTransaction.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalPoints: { $sum: '$points' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const data = timeline.map(t => ({
      date: t._id,
      points: t.totalPoints,
      transactions: t.count
    }));

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching XP timeline',
      error: error.message
    });
  }
};

// @desc    Award points to user
// @route   POST /api/gamification/points/award
// @access  Private
exports.awardPoints = async (req, res) => {
  try {
    const { userId, childId, points, source, description, reference } = req.body;

    // Validation
    if (!userId || !points || !source) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, points, and source'
      });
    }

    if (points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Points must be greater than 0'
      });
    }

    // Find or create user progress
    const query = { user: userId };
    if (childId) {
      query.child = childId;
    }

    let progress = await UserProgress.findOne(query);
    if (!progress) {
      progress = await UserProgress.create({
        user: userId,
        child: childId || null
      });
    }

    const balanceBefore = progress.totalPoints;
    progress.totalPoints += Number(points);
    
    // Ensure methods exist before calling them
    if (typeof progress.calculateLevel === 'function') {
      progress.calculateLevel();
    }
    if (typeof progress.updateStreak === 'function') {
      progress.updateStreak();
    }

    // Update stats based on source
    if (source === 'story_read') {
      progress.stats.storiesRead += 1;
    } else if (source === 'assignment_completed') {
      progress.stats.assignmentsCompleted += 1;
    }

    await progress.save();

    // Create transaction record
    const transaction = await PointTransaction.create({
      user: userId,
      child: childId || null,
      points,
      type: 'earn',
      source,
      description: description || `Earned ${points} points from ${source}`,
      reference: reference || { model: 'None', id: null },
      balanceBefore,
      balanceAfter: progress.totalPoints
    });

    // Check for badge eligibility
    await checkAndAwardBadges(progress);

    res.status(200).json({
      success: true,
      message: `${points} points awarded successfully`,
      data: {
        transaction,
        currentBalance: progress.totalPoints,
        level: progress.level,
        streak: progress.currentStreak
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error awarding points',
      error: error.message
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Use aggregation to explicitly join with Child collection
    const leaderboard = await UserProgress.aggregate([
      { $match: { child: { $ne: null } } },
      {
        $lookup: {
          from: 'children',
          localField: 'child',
          foreignField: '_id',
          as: 'childData'
        }
      },
      { $unwind: '$childData' },
      {
        $project: {
          _id: 1,
          child: {
            _id: '$childData._id',
            name: '$childData.name',
            age: '$childData.age',
            avatar: '$childData.avatar'
          },
          totalPoints: 1,
          level: 1,
          currentStreak: 1,
          longestStreak: 1,
          stats: 1,
          badges: 1
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};


// @desc    Get all badges
// @route   GET /api/gamification/badges
// @access  Private
exports.getAllBadges = async (req, res) => {
  try {
    const { category, tier, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (tier) query.tier = tier;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const badges = await Badge.find(query).sort({ tier: 1, points: 1 });

    res.status(200).json({
      success: true,
      count: badges.length,
      data: badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching badges',
      error: error.message
    });
  }
};

// @desc    Create new badge
// @route   POST /api/gamification/badges
// @access  Private/Admin
// @desc    Create a new badge (Admin only)
// @route   POST /api/gamification/badges
// @access  Private (Admin)
exports.createBadge = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can create badges'
      });
    }

    const { name, description, icon, category, tier, points, criteria, rarity, isActive } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }

    if (!criteria || !criteria.type || criteria.threshold === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Criteria with type and threshold are required'
      });
    }

    // Prepare badge data with defaults
    const badgeData = {
      name: name.trim(),
      description: description.trim(),
      icon: icon || '🏆',
      category: category || 'achievement',
      tier: tier || 'bronze',
      points: points || 10,
      criteria: {
        type: criteria.type,
        threshold: criteria.threshold
      },
      rarity: rarity || 'common',
      isActive: isActive !== undefined ? isActive : true
    };

    const badge = await Badge.create(badgeData);

    res.status(201).json({
      success: true,
      message: 'Badge created successfully',
      data: badge
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Badge with this name already exists'
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating badge',
      error: error.message
    });
  }
};

// @desc    Award badge to user
// @route   POST /api/gamification/badges/award
// @access  Private
exports.awardBadge = async (req, res) => {
  try {
    const { userId, childId, badgeId } = req.body;

    if (!userId || !badgeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and badgeId'
      });
    }

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    const query = { user: userId };
    if (childId) query.child = childId;

    let progress = await UserProgress.findOne(query);
    if (!progress) {
      progress = await UserProgress.create({
        user: userId,
        child: childId || null
      });
    }

    // Check if badge already earned
    const alreadyEarned = progress.badges.some(
      b => b.badge.toString() === badgeId
    );

    if (alreadyEarned) {
      return res.status(400).json({
        success: false,
        message: 'Badge already earned'
      });
    }

    // Add badge
    progress.badges.push({
      badge: badgeId,
      earnedAt: new Date()
    });

    // Award badge points
    progress.totalPoints += badge.points;
    progress.calculateLevel();

    await progress.save();

    // Create point transaction
    await PointTransaction.create({
      user: userId,
      child: childId || null,
      points: badge.points,
      type: 'earn',
      source: 'badge_earned',
      description: `Earned badge: ${badge.name}`,
      reference: { model: 'Badge', id: badgeId },
      balanceBefore: progress.totalPoints - badge.points,
      balanceAfter: progress.totalPoints
    });

    res.status(200).json({
      success: true,
      message: 'Badge awarded successfully',
      data: {
        badge,
        totalPoints: progress.totalPoints,
        level: progress.level
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error awarding badge',
      error: error.message
    });
  }
};

// @desc    Get all achievements
// @route   GET /api/gamification/achievements
// @access  Private
exports.getAllAchievements = async (req, res) => {
  try {
    const { category, difficulty, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const achievements = await Achievement.find(query)
      .populate('reward.badge')
      .sort({ difficulty: 1 });

    res.status(200).json({
      success: true,
      count: achievements.length,
      data: achievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements',
      error: error.message
    });
  }
};

// @desc    Create new achievement
// @route   POST /api/gamification/achievements
// @access  Private/Admin
// @desc    Create a new achievement (Admin only)
// @route   POST /api/gamification/achievements
// @access  Private (Admin)
exports.createAchievement = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can create achievements'
      });
    }

    const { name, description, icon, category, type, targetValue, reward, difficulty, prerequisites, order, isActive } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }

    if (targetValue === undefined || targetValue < 1) {
      return res.status(400).json({
        success: false,
        message: 'Target value is required and must be at least 1'
      });
    }

    // Prepare achievement data with defaults
    const achievementData = {
      name: name.trim(),
      description: description.trim(),
      icon: icon || '⭐',
      category: category || 'milestone',
      type: type || 'one_time',
      targetValue: parseInt(targetValue, 10),
      reward: {
        points: reward?.points || 50,
        badge: reward?.badge || null
      },
      difficulty: difficulty || 'medium',
      prerequisites: prerequisites || [],
      order: order !== undefined ? parseInt(order, 10) : 0,
      isActive: isActive !== undefined ? isActive : true
    };

    // Validate prerequisites if provided
    if (achievementData.prerequisites.length > 0) {
      const prerequisiteAchievements = await Achievement.find({
        name: { $in: achievementData.prerequisites }
      });
      if (prerequisiteAchievements.length !== achievementData.prerequisites.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more prerequisite achievements do not exist'
        });
      }
    }

    const achievement = await Achievement.create(achievementData);

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully',
      data: achievement
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Achievement with this name already exists'
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating achievement',
      error: error.message
    });
  }
};

// @desc    Update achievement progress
// @route   POST /api/gamification/achievements/progress
// @access  Private
exports.updateAchievementProgress = async (req, res) => {
  try {
    const { userId, childId, achievementId, progressIncrement } = req.body;

    if (!userId || !achievementId || progressIncrement === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, achievementId, and progressIncrement'
      });
    }

    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    const query = { user: userId };
    if (childId) query.child = childId;

    let progress = await UserProgress.findOne(query);
    if (!progress) {
      progress = await UserProgress.create({
        user: userId,
        child: childId || null
      });
    }

    // Find or create achievement progress
    let achievementProgress = progress.achievements.find(
      a => a.achievement.toString() === achievementId
    );

    if (!achievementProgress) {
      achievementProgress = {
        achievement: achievementId,
        progress: 0,
        completed: false,
        completedAt: null
      };
      progress.achievements.push(achievementProgress);
    }

    // Update progress
    achievementProgress.progress += progressIncrement;

    // Check if completed
    if (achievementProgress.progress >= achievement.targetValue && !achievementProgress.completed) {
      achievementProgress.completed = true;
      achievementProgress.completedAt = new Date();

      // Award points
      progress.totalPoints += achievement.reward.points;
      progress.calculateLevel();

      // Award badge if any
      if (achievement.reward.badge) {
        const badgeExists = progress.badges.some(
          b => b.badge.toString() === achievement.reward.badge.toString()
        );
        if (!badgeExists) {
          progress.badges.push({
            badge: achievement.reward.badge,
            earnedAt: new Date()
          });
        }
      }

      await progress.save();

      // Create point transaction
      await PointTransaction.create({
        user: userId,
        child: childId || null,
        points: achievement.reward.points,
        type: 'earn',
        source: 'achievement',
        description: `Completed achievement: ${achievement.name}`,
        reference: { model: 'Achievement', id: achievementId },
        balanceBefore: progress.totalPoints - achievement.reward.points,
        balanceAfter: progress.totalPoints
      });

      return res.status(200).json({
        success: true,
        message: 'Achievement completed!',
        data: {
          achievement,
          progress: achievementProgress,
          totalPoints: progress.totalPoints,
          level: progress.level
        }
      });
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Achievement progress updated',
      data: {
        achievement,
        progress: achievementProgress
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating achievement progress',
      error: error.message
    });
  }
};

// @desc    Get user badges
// @route   GET /api/gamification/user-badges/:userId
// @access  Private
exports.getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const { childId } = req.query;

    // If the userId matches a child user, resolve to parent account
    const User = require('../../models/User');
    const user = await User.findById(userId).select('role parentAccount childProfile');
    
    let actualUserId = userId;
    let actualChildId = childId;

    if (user && user.role === 'child') {
      actualUserId = user.parentAccount || userId;
      if (!actualChildId) {
        actualChildId = user.childProfile;
      }
    }

    const query = { user: actualUserId };
    if (actualChildId) query.child = actualChildId;

    const progress = await UserProgress.findOne(query)
      .populate('badges.badge');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    res.status(200).json({
      success: true,
      data: progress.badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user badges',
      error: error.message
    });
  }
};

// @desc    Get user achievements with progress
// @route   GET /api/gamification/user-achievements/:userId
// @access  Private
exports.getUserAchievements = async (req, res) => {
  try {
    const { userId } = req.params;
    const { childId } = req.query;

    // If the userId matches a child user, resolve to parent account
    const User = require('../../models/User');
    const user = await User.findById(userId).select('role parentAccount childProfile');
    
    let actualUserId = userId;
    let actualChildId = childId;

    if (user && user.role === 'child') {
      actualUserId = user.parentAccount || userId;
      if (!actualChildId) {
        actualChildId = user.childProfile;
      }
    }

    const query = { user: actualUserId };
    if (actualChildId) query.child = actualChildId;

    const progress = await UserProgress.findOne(query)
      .populate('achievements.achievement');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    // Get all achievements
    const allAchievements = await Achievement.find({ isActive: true })
      .sort({ order: 1 });

    // Combine user progress with achievement definitions
    const userAchievements = allAchievements.map(achievement => {
      const userAchievement = progress.achievements.find(ua => {
        const achievementId = ua.achievement && ua.achievement._id ? ua.achievement._id.toString() : ua.achievement.toString();
        return achievementId === achievement._id.toString();
      });

      return {
        achievement: achievement,
        progress: userAchievement ? userAchievement.progress : 0,
        completed: userAchievement ? userAchievement.completed : false,
        completedAt: userAchievement ? userAchievement.completedAt : null,
        isAvailable: checkAchievementAvailability(progress, achievement)
      };
    });

    res.status(200).json({
      success: true,
      data: userAchievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user achievements',
      error: error.message
    });
  }
};

// @desc    Get point transaction history
// @route   GET /api/gamification/transactions/:userId
// @access  Private
exports.getTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { childId, limit = 50, type, source } = req.query;

    // If the userId matches a child user, resolve to parent account
    const User = require('../../models/User');
    const user = await User.findById(userId).select('role parentAccount childProfile');
    
    let actualUserId = userId;
    let actualChildId = childId;

    if (user && user.role === 'child') {
      actualUserId = user.parentAccount || userId;
      if (!actualChildId) {
        actualChildId = user.childProfile;
      }
    }

    const query = { user: actualUserId };
    if (actualChildId) query.child = actualChildId;
    if (type) query.type = type;
    if (source) query.source = source;

    const transactions = await PointTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction history',
      error: error.message
    });
  }
};

// @desc    Generate today's AI challenge
// @route   POST /api/gamification/challenges/generate
// @access  Private
// @desc    Generate AI quiz for story
// @route   POST /api/gamification/quizzes/generate
// @access  Private
exports.generateQuiz = async (req, res) => {
  try {
    const { storyId, userId, childId } = req.body;
    
    if (!storyId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide storyId and userId'
      });
    }

    const { actualUserId, actualChildId } = await resolveUserAndChild(userId, childId);

    // Check if an uncompleted quiz already exists
    let quiz = await aiQuizService.getStoredQuiz(storyId, actualUserId, actualChildId);
    
    if (!quiz) {
      quiz = await aiQuizService.generateQuizForStory(storyId, actualUserId, actualChildId);
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating quiz',
      error: error.message
    });
  }
};

// @desc    Submit quiz answers
// @route   POST /api/gamification/quizzes/complete
// @access  Private
exports.completeQuiz = async (req, res) => {
  try {
    const { quizId, answers, userId, childId } = req.body;

    if (!quizId || !answers || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide quizId, answers, and userId'
      });
    }

    const { actualUserId, actualChildId } = await resolveUserAndChild(userId, childId);

    const result = await aiQuizService.completeQuiz(quizId, answers, actualUserId, actualChildId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing quiz',
      error: error.message
    });
  }
};

exports.generateTodayChallenge = async (req, res) => {
  try {
    const { userId, childId, forceNew = false } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId'
      });
    }

    const { actualUserId, actualChildId } = await resolveUserAndChild(userId, childId);
    const dateKey = getDateKey();

    const query = {
      user: actualUserId,
      child: actualChildId || null,
      dateKey
    };

    const existingChallenge = await DailyChallenge.findOne(query);

    if (existingChallenge && forceNew !== true) {
      return res.status(200).json({
        success: true,
        message: 'Today challenge already exists',
        data: existingChallenge
      });
    }

    const progressQuery = { user: actualUserId };
    if (actualChildId) {
      progressQuery.child = actualChildId;
    }

    let progress = await UserProgress.findOne(progressQuery);
    if (!progress) {
      progress = await UserProgress.create({
        user: actualUserId,
        child: actualChildId || null
      });
    }

    let childProfile = null;
    if (actualChildId) {
      childProfile = await Child.findById(actualChildId).select('age readingLevel name');
    }

    const challengePayload = await generateDailyChallenge({
      childProfile,
      progress,
      dateKey
    });

    const challenge = await DailyChallenge.findOneAndUpdate(
      query,
      {
        $set: {
          title: challengePayload.title,
          description: challengePayload.description,
          challengeType: challengePayload.challengeType,
          targetValue: challengePayload.targetValue,
          rewardPoints: challengePayload.rewardPoints,
          generatedBy: challengePayload.generatedBy,
          metadata: challengePayload.metadata,
          currentProgress: 0,
          isCompleted: false,
          completedAt: null
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(201).json({
      success: true,
      message: 'Daily challenge generated successfully',
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating daily challenge',
      error: error.message
    });
  }
};

// @desc    Get today's challenge
// @route   GET /api/gamification/challenges/today/:userId
// @access  Private
exports.getTodayChallenge = async (req, res) => {
  try {
    const { userId } = req.params;
    const { childId } = req.query;

    const { actualUserId, actualChildId } = await resolveUserAndChild(userId, childId);

    const challenge = await DailyChallenge.findOne({
      user: actualUserId,
      child: actualChildId || null,
      dateKey: getDateKey()
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No challenge generated for today'
      });
    }

    res.status(200).json({
      success: true,
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today challenge',
      error: error.message
    });
  }
};

// @desc    Update challenge progress
// @route   POST /api/gamification/challenges/progress
// @access  Private
exports.updateTodayChallengeProgress = async (req, res) => {
  try {
    const { userId, childId, progressIncrement = 1, challengeId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId'
      });
    }

    if (!Number.isFinite(Number(progressIncrement)) || Number(progressIncrement) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'progressIncrement must be a positive number'
      });
    }

    const { actualUserId, actualChildId } = await resolveUserAndChild(userId, childId);

    let challenge;
    if (challengeId) {
      challenge = await DailyChallenge.findById(challengeId);
    } else {
      challenge = await DailyChallenge.findOne({
        user: actualUserId,
        child: actualChildId || null,
        dateKey: getDateKey()
      });
    }

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Daily challenge not found'
      });
    }

    if (challenge.isCompleted) {
      return res.status(200).json({
        success: true,
        message: 'Challenge already completed',
        data: challenge
      });
    }

    challenge.currentProgress = Math.min(
      challenge.targetValue,
      challenge.currentProgress + Number(progressIncrement)
    );

    if (challenge.currentProgress >= challenge.targetValue) {
      challenge.isCompleted = true;
      challenge.completedAt = new Date();
      await challenge.save();

      const awardResult = await GamificationService.awardPointsToUser(
        actualUserId,
        challenge.rewardPoints,
        'manual',
        `Completed daily AI challenge: ${challenge.title}`,
        actualChildId || null,
        { model: 'None', id: null }
      );

      return res.status(200).json({
        success: true,
        message: 'Challenge completed and points awarded',
        data: {
          challenge,
          reward: {
            pointsAwarded: challenge.rewardPoints,
            totalPoints: awardResult.progress.totalPoints,
            level: awardResult.progress.level
          }
        }
      });
    }

    await challenge.save();

    res.status(200).json({
      success: true,
      message: 'Challenge progress updated',
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating challenge progress',
      error: error.message
    });
  }
};

async function checkAndAwardBadges(progress) {
  try {
    const badges = await Badge.find({ isActive: true });

    for (const badge of badges) {
      const alreadyEarned = progress.badges.some(
        b => b.badge.toString() === badge._id.toString()
      );
      if (alreadyEarned) continue;

      let shouldAward = false;
      switch (badge.criteria.type) {
        case 'story_count':
          shouldAward = progress.stats.storiesRead >= badge.criteria.threshold;
          break;
        case 'days_streak':
          shouldAward = progress.currentStreak >= badge.criteria.threshold;
          break;
        case 'total_points':
          shouldAward = progress.totalPoints >= badge.criteria.threshold;
          break;
        case 'assignments_completed':
          shouldAward = progress.stats.assignmentsCompleted >= badge.criteria.threshold;
          break;
        default:
          shouldAward = false;
      }

      if (shouldAward) {
        progress.badges.push({ badge: badge._id, earnedAt: new Date() });
        progress.totalPoints += badge.points;
        await PointTransaction.create({
          user: progress.user,
          child: progress.child,
          points: badge.points,
          type: 'bonus',
          source: 'badge_earned',
          description: `Earned badge: ${badge.name}`,
          reference: { model: 'Badge', id: badge._id },
          balanceBefore: progress.totalPoints - badge.points,
          balanceAfter: progress.totalPoints
        });
      }
    }

    await progress.save();
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}
