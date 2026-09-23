const UserProgress = require('../../models/gamification/UserProgress');
const Badge = require('../../models/gamification/Badge');
const Achievement = require('../../models/gamification/Achievement');
const PointTransaction = require('../../models/gamification/PointTransaction');
const { sendNotification } = require('../../utils/notificationHelper');

/**
 * Service for handling gamification logic
 */
class GamificationService {
  /**
   * Initialize default badges in the system
   */
  static async initializeDefaultBadges() {
    try {
      const defaultBadges = [
        {
          name: 'First Steps',
          description: 'Read your first story',
          icon: '👶',
          category: 'reading',
          tier: 'bronze',
          points: 10,
          criteria: { type: 'story_count', threshold: 1 },
          rarity: 'common'
        },
        {
          name: 'Bookworm',
          description: 'Read 10 stories',
          icon: '📚',
          category: 'reading',
          tier: 'silver',
          points: 50,
          criteria: { type: 'story_count', threshold: 10 },
          rarity: 'common'
        },
        {
          name: 'Story Master',
          description: 'Read 50 stories',
          icon: '🎓',
          category: 'reading',
          tier: 'gold',
          points: 200,
          criteria: { type: 'story_count', threshold: 50 },
          rarity: 'rare'
        },
        {
          name: 'Library Legend',
          description: 'Read 100 stories',
          icon: '👑',
          category: 'reading',
          tier: 'platinum',
          points: 500,
          criteria: { type: 'story_count', threshold: 100 },
          rarity: 'epic'
        },
        {
          name: 'Day Streak',
          description: 'Maintain a 3-day reading streak',
          icon: '🔥',
          category: 'streak',
          tier: 'bronze',
          points: 30,
          criteria: { type: 'days_streak', threshold: 3 },
          rarity: 'common'
        },
        {
          name: 'Week Warrior',
          description: 'Maintain a 7-day reading streak',
          icon: '⚡',
          category: 'streak',
          tier: 'silver',
          points: 100,
          criteria: { type: 'days_streak', threshold: 7 },
          rarity: 'rare'
        },
        {
          name: 'Dedication Master',
          description: 'Maintain a 30-day reading streak',
          icon: '💎',
          category: 'streak',
          tier: 'gold',
          points: 500,
          criteria: { type: 'days_streak', threshold: 30 },
          rarity: 'legendary'
        },
        {
          name: 'Points Collector',
          description: 'Earn 500 total points',
          icon: '💰',
          category: 'achievement',
          tier: 'silver',
          points: 50,
          criteria: { type: 'total_points', threshold: 500 },
          rarity: 'common'
        },
        {
          name: 'Points Champion',
          description: 'Earn 2000 total points',
          icon: '🏆',
          category: 'achievement',
          tier: 'gold',
          points: 200,
          criteria: { type: 'total_points', threshold: 2000 },
          rarity: 'rare'
        },
        {
          name: 'Task Completer',
          description: 'Complete 5 assignments',
          icon: '✅',
          category: 'achievement',
          tier: 'bronze',
          points: 40,
          criteria: { type: 'assignments_completed', threshold: 5 },
          rarity: 'common'
        }
      ];

      for (const badgeData of defaultBadges) {
        const exists = await Badge.findOne({ name: badgeData.name });
        if (!exists) {
          await Badge.create(badgeData);
          console.log(`Created badge: ${badgeData.name}`);
        }
      }

      console.log('Default badges initialization completed');
    } catch (error) {
      console.error('Error initializing badges:', error);
    }
  }

  /**
   * Initialize default achievements in the system with proper progression chains
   */
  static async initializeDefaultAchievements() {
    try {
      const defaultAchievements = [
        // Level 1: Basic Reading Achievements
        {
          name: 'First Steps',
          description: 'Read your very first story',
          icon: '👶',
          category: 'reading',
          type: 'one_time',
          targetValue: 1,
          reward: { points: 25, badge: null },
          difficulty: 'easy',
          prerequisites: [],
          order: 1
        },
        {
          name: 'Story Explorer',
          description: 'Read 5 different stories',
          icon: '🧭',
          category: 'reading',
          type: 'one_time',
          targetValue: 5,
          reward: { points: 50 },
          difficulty: 'easy',
          prerequisites: ['First Steps'],
          order: 2
        },
        {
          name: 'Bookworm Beginner',
          description: 'Read 10 stories total',
          icon: '📖',
          category: 'reading',
          type: 'one_time',
          targetValue: 10,
          reward: { points: 75 },
          difficulty: 'easy',
          prerequisites: ['Story Explorer'],
          order: 3
        },

        // Level 2: Consistency Achievements
        {
          name: 'Daily Reader',
          description: 'Read for 3 consecutive days',
          icon: '📅',
          category: 'consistency',
          type: 'one_time',
          targetValue: 3,
          reward: { points: 100 },
          difficulty: 'medium',
          prerequisites: ['Bookworm Beginner'],
          order: 4
        },
        {
          name: 'Week Warrior',
          description: 'Read for 7 consecutive days',
          icon: '⚡',
          category: 'consistency',
          type: 'one_time',
          targetValue: 7,
          reward: { points: 150 },
          difficulty: 'medium',
          prerequisites: ['Daily Reader'],
          order: 5
        },

        // Level 3: Advanced Reading
        {
          name: 'Avid Reader',
          description: 'Read 25 stories total',
          icon: '📚',
          category: 'reading',
          type: 'one_time',
          targetValue: 25,
          reward: { points: 200 },
          difficulty: 'medium',
          prerequisites: ['Week Warrior'],
          order: 6
        },
        {
          name: 'Genre Explorer',
          description: 'Read stories from 3 different categories',
          icon: '🌍',
          category: 'exploration',
          type: 'one_time',
          targetValue: 3,
          reward: { points: 125 },
          difficulty: 'medium',
          prerequisites: ['Avid Reader'],
          order: 7
        },

        // Level 4: Assignment Achievements
        {
          name: 'First Assignment',
          description: 'Complete your first assignment',
          icon: '✅',
          category: 'milestone',
          type: 'one_time',
          targetValue: 1,
          reward: { points: 50 },
          difficulty: 'easy',
          prerequisites: ['Bookworm Beginner'],
          order: 8
        },
        {
          name: 'Assignment Master',
          description: 'Complete 5 assignments',
          icon: '🎯',
          category: 'milestone',
          type: 'one_time',
          targetValue: 5,
          reward: { points: 150 },
          difficulty: 'medium',
          prerequisites: ['First Assignment'],
          order: 9
        },

        // Level 5: Expert Level
        {
          name: 'Reading Champion',
          description: 'Read 50 stories total',
          icon: '🏆',
          category: 'reading',
          type: 'one_time',
          targetValue: 50,
          reward: { points: 300 },
          difficulty: 'hard',
          prerequisites: ['Avid Reader', 'Assignment Master'],
          order: 10
        },
        {
          name: 'Streak Master',
          description: 'Maintain a 14-day reading streak',
          icon: '🔥',
          category: 'consistency',
          type: 'one_time',
          targetValue: 14,
          reward: { points: 250 },
          difficulty: 'hard',
          prerequisites: ['Week Warrior'],
          order: 11
        },

        // Level 6: Legendary Achievements
        {
          name: 'Legendary Reader',
          description: 'Read 100 stories total',
          icon: '👑',
          category: 'reading',
          type: 'one_time',
          targetValue: 100,
          reward: { points: 500 },
          difficulty: 'expert',
          prerequisites: ['Reading Champion'],
          order: 12
        },
        {
          name: 'Dedication Legend',
          description: 'Maintain a 30-day reading streak',
          icon: '💎',
          category: 'consistency',
          type: 'one_time',
          targetValue: 30,
          reward: { points: 400 },
          difficulty: 'expert',
          prerequisites: ['Streak Master'],
          order: 13
        },
        {
          name: 'Assignment Legend',
          description: 'Complete 20 assignments',
          icon: '🌟',
          category: 'milestone',
          type: 'one_time',
          targetValue: 20,
          reward: { points: 300 },
          difficulty: 'expert',
          prerequisites: ['Assignment Master'],
          order: 14
        },

        // Special Time-based Achievements
        {
          name: 'Early Bird',
          description: 'Read a story before 8 AM for 5 days',
          icon: '🌅',
          category: 'consistency',
          type: 'one_time',
          targetValue: 5,
          reward: { points: 100 },
          difficulty: 'medium',
          prerequisites: ['Daily Reader'],
          order: 15
        },
        {
          name: 'Night Owl',
          description: 'Read a story after 10 PM for 5 days',
          icon: '🦉',
          category: 'consistency',
          type: 'one_time',
          targetValue: 5,
          reward: { points: 100 },
          difficulty: 'medium',
          prerequisites: ['Daily Reader'],
          order: 16
        },

        // Repeatable Achievements
        {
          name: 'Monthly Reader',
          description: 'Read 30 stories in a month',
          icon: '📊',
          category: 'consistency',
          type: 'repeatable',
          targetValue: 30,
          reward: { points: 200 },
          difficulty: 'hard',
          prerequisites: ['Reading Champion'],
          order: 17
        },
        {
          name: 'Speed Reader',
          description: 'Complete 10 stories in one week',
          icon: '💨',
          category: 'consistency',
          type: 'repeatable',
          targetValue: 10,
          reward: { points: 150 },
          difficulty: 'medium',
          prerequisites: ['Week Warrior'],
          order: 18
        }
      ];

      for (const achievementData of defaultAchievements) {
        const exists = await Achievement.findOne({ name: achievementData.name });
        if (!exists) {
          await Achievement.create(achievementData);
          console.log(`Created achievement: ${achievementData.name}`);
        }
      }

      console.log('Default achievements initialization completed');
    } catch (error) {
      console.error('Error initializing achievements:', error);
    }
  }

  /**
   * Award points and handle related logic
   */
  static async awardPointsToUser(userId, points, source, description = '', childId = null, reference = null) {
    try {
      console.log(`[GamificationService] Awarding ${points} pts to User:${userId} Child:${childId} from ${source}`);
      
      const query = { user: userId };
      if (childId) query.child = childId;

      let progress = await UserProgress.findOne(query);
      if (!progress) {
        console.log(`[GamificationService] No progress found, creating new for User:${userId} Child:${childId}`);
        progress = await UserProgress.create({
          user: userId,
          child: childId
        });
      }

      const balanceBefore = progress.totalPoints;
      progress.totalPoints += Number(points);
      
      if (typeof progress.calculateLevel === 'function') {
        progress.calculateLevel();
      }
      if (typeof progress.updateStreak === 'function') {
        progress.updateStreak();
      }

      // Update stats
      if (source === 'story_read') {
        progress.stats.storiesRead += 1;
      } else if (source === 'assignment_completed') {
        progress.stats.assignmentsCompleted += 1;
      }

      await progress.save();
      console.log(`[GamificationService] Progress saved. New balance: ${progress.totalPoints}`);

      // Create transaction
      const transaction = await PointTransaction.create({
        user: userId,
        child: childId,
        points,
        type: 'earn',
        source,
        description: description || `Earned ${points} points from ${source}`,
        reference: reference || { model: 'None', id: null },
        balanceBefore,
        balanceAfter: progress.totalPoints
      });

      // Check badges
      await this.checkAndAwardBadges(progress);

      // Prepare activity data for achievements
      const now = new Date();
      const activityData = {
        isEarlyMorning: now.getHours() < 8,
        isLateNight: now.getHours() >= 22,
        reference: reference
      };

      // Check achievements
      await this.checkAndAwardAchievements(progress, source, activityData);

      return {
        success: true,
        transaction,
        progress
      };
    } catch (error) {
      console.error('[GamificationService] Error awarding points:', error);
      throw new Error(`Error awarding points: ${error.message}`);
    }
  }

  /**
   * Check if user is eligible for any badges and award them
   */
  static async checkAndAwardBadges(progress) {
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
        }

        if (shouldAward) {
          progress.badges.push({
            badge: badge._id,
            earnedAt: new Date()
          });
          progress.totalPoints += badge.points;
          
          // Create transaction for badge points
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

          // Notify the user (Child/Parent) about the new badge
          try {
            await sendNotification({
              recipient: progress.child || progress.user,
              type: 'badge',
              title: `New Badge: ${badge.name} ${badge.icon || '🏅'}`,
              message: `Congratulations! You've earned the "${badge.name}" badge and ${badge.points} bonus points!`,
              data: {
                badgeId: badge._id,
                badgeName: badge.name,
                points: badge.points
              }
            });
          } catch (notifyErr) {
            console.warn('[checkAndAwardBadges] Notification failed:', notifyErr.message);
          }
        }
      }

      await progress.save();
      return true;
    } catch (error) {
      console.error('Error checking badges:', error);
      return false;
    }
  }

  /**
   * Check if user is eligible for any achievements and award them
   */
  static async checkAndAwardAchievements(progress, activityType, activityData = {}) {
    try {
      const achievements = await Achievement.find({ isActive: true }).sort({ order: 1 });

      // Prepare activity data for achievement checking
      const enrichedActivityData = {
        ...activityData,
        categoriesRead: new Set(progress.stats.categoriesRead || []),
        earlyMorningReads: progress.stats.earlyMorningReads || 0,
        lateNightReads: progress.stats.lateNightReads || 0,
        monthlyReads: progress.stats.monthlyReads || 0,
        weeklyReads: progress.stats.weeklyReads || 0,
        isEarlyMorning: activityData.isEarlyMorning || false,
        isLateNight: activityData.isLateNight || false
      };

      for (const achievement of achievements) {
        // Skip if already completed
        const existingProgress = progress.achievements.find(
          a => a.achievement.toString() === achievement._id.toString()
        );

        if (existingProgress && existingProgress.completed) continue;

        // Check prerequisites
        if (!await this.checkPrerequisites(progress, achievement.prerequisites)) {
          continue;
        }

        let shouldAward = false;
        let progressIncrement = 0;

        // Check achievement criteria based on type and activity
        switch (achievement.name) {
          case 'First Steps':
            if (activityType === 'story_read' && progress.stats.storiesRead >= 1) {
              shouldAward = true;
              progressIncrement = 1;
            }
            break;

          case 'Story Explorer':
            if (activityType === 'story_read') {
              progressIncrement = progress.stats.storiesRead;
              shouldAward = progress.stats.storiesRead >= achievement.targetValue;
            }
            break;

          case 'Bookworm Beginner':
          case 'Avid Reader':
          case 'Reading Champion':
          case 'Legendary Reader':
            if (activityType === 'story_read') {
              progressIncrement = progress.stats.storiesRead;
              shouldAward = progress.stats.storiesRead >= achievement.targetValue;
            }
            break;

          case 'Daily Reader':
          case 'Week Warrior':
          case 'Streak Master':
          case 'Dedication Legend':
            if (activityType === 'story_read' || activityType === 'assignment_completed') {
              progressIncrement = progress.currentStreak;
              shouldAward = progress.currentStreak >= achievement.targetValue;
            }
            break;

          case 'First Assignment':
            if (activityType === 'assignment_completed' && progress.stats.assignmentsCompleted >= 1) {
              shouldAward = true;
              progressIncrement = 1;
            }
            break;

          case 'Assignment Master':
          case 'Assignment Legend':
            if (activityType === 'assignment_completed') {
              progressIncrement = progress.stats.assignmentsCompleted;
              shouldAward = progress.stats.assignmentsCompleted >= achievement.targetValue;
            }
            break;

          case 'Genre Explorer':
            if (activityType === 'story_read') {
              progressIncrement = enrichedActivityData.categoriesRead.size;
              shouldAward = enrichedActivityData.categoriesRead.size >= achievement.targetValue;
            }
            break;

          case 'Early Bird':
            if (activityType === 'story_read' && enrichedActivityData.isEarlyMorning) {
              progressIncrement = enrichedActivityData.earlyMorningReads;
              shouldAward = enrichedActivityData.earlyMorningReads >= achievement.targetValue;
            }
            break;

          case 'Night Owl':
            if (activityType === 'story_read' && enrichedActivityData.isLateNight) {
              progressIncrement = enrichedActivityData.lateNightReads;
              shouldAward = enrichedActivityData.lateNightReads >= achievement.targetValue;
            }
            break;

          case 'Monthly Reader':
            if (activityType === 'story_read') {
              progressIncrement = enrichedActivityData.monthlyReads;
              shouldAward = enrichedActivityData.monthlyReads >= achievement.targetValue;
            }
            break;

          case 'Speed Reader':
            if (activityType === 'story_read') {
              progressIncrement = enrichedActivityData.weeklyReads;
              shouldAward = enrichedActivityData.weeklyReads >= achievement.targetValue;
            }
            break;
        }

        if (shouldAward) {
          await this.awardAchievement(progress, achievement, progressIncrement);
        } else if (progressIncrement > 0) {
          // Update progress even if not completed
          await this.updateAchievementProgress(progress, achievement, progressIncrement);
        }
      }

      await progress.save();
      return true;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return false;
    }
  }

  /**
   * Check if prerequisites are met for an achievement
   */
  static async checkPrerequisites(progress, prerequisites) {
    if (!prerequisites || prerequisites.length === 0) return true;

    for (const prereqName of prerequisites) {
      const prereqAchievement = await Achievement.findOne({ name: prereqName });
      if (!prereqAchievement) continue;

      const userAchievement = progress.achievements.find(
        a => a.achievement.toString() === prereqAchievement._id.toString()
      );

      if (!userAchievement || !userAchievement.completed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Award an achievement to a user
   */
  static async awardAchievement(progress, achievement, progressValue) {
    let achievementProgress = progress.achievements.find(
      a => a.achievement.toString() === achievement._id.toString()
    );

    if (!achievementProgress) {
      achievementProgress = {
        achievement: achievement._id,
        progress: 0,
        completed: false,
        completedAt: null
      };
      progress.achievements.push(achievementProgress);
    }

    achievementProgress.progress = Math.max(achievementProgress.progress, progressValue);
    achievementProgress.completed = true;
    achievementProgress.completedAt = new Date();

    // Award points
    progress.totalPoints += achievement.reward.points;
    progress.calculateLevel();

    // Award badge if specified
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

    // Create transaction
    await PointTransaction.create({
      user: progress.user,
      child: progress.child,
      points: achievement.reward.points,
      type: 'earn',
      source: 'achievement',
      description: `Completed achievement: ${achievement.name}`,
      reference: { model: 'Achievement', id: achievement._id },
      balanceBefore: progress.totalPoints - achievement.reward.points,
      balanceAfter: progress.totalPoints
    });

    console.log(`Achievement awarded: ${achievement.name} to user ${progress.user}`);
  }

  /**
   * Update achievement progress without completing it
   */
  static async updateAchievementProgress(progress, achievement, increment) {
    let achievementProgress = progress.achievements.find(
      a => a.achievement.toString() === achievement._id.toString()
    );

    if (!achievementProgress) {
      achievementProgress = {
        achievement: achievement._id,
        progress: 0,
        completed: false,
        completedAt: null
      };
      progress.achievements.push(achievementProgress);
    }

    achievementProgress.progress = Math.min(
      achievementProgress.progress + increment,
      achievement.targetValue
    );
  }

  static async getUserRank(userId, childId = null) {
    const query = {};
    if (childId) query.child = childId;

    const progress = await UserProgress.findOne({ user: userId, ...(childId ? { child: childId } : {}) });
    if (!progress) {
      return null;
    }

    const higherRankedCount = await UserProgress.countDocuments({
      ...query,
      totalPoints: { $gt: progress.totalPoints }
    });

    return higherRankedCount + 1;
  }
}

module.exports = GamificationService;
