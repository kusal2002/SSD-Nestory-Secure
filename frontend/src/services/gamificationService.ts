import apiClient from './apiClient';
import {
  ApiResponse,
  GamificationAchievement,
  GamificationAchievementProgress,
  GamificationBadge,
  GamificationBadgeProgress,
  GamificationProgress,
  GamificationTransaction,
  LeaderboardEntry,
  Quiz,
  QuizSubmitResult,
} from '../types';

class GamificationService {
  async generateQuiz(storyId: string, userId: string, childId?: string): Promise<Quiz> {
    const response = await apiClient.getInstance().post<ApiResponse<Quiz>>(
      '/gamification/quizzes/generate',
      { storyId, userId, childId }
    );
    return response.data.data;
  }

  async completeQuiz(quizId: string, answers: string[], userId: string, childId?: string): Promise<QuizSubmitResult> {
    const response = await apiClient.getInstance().post<ApiResponse<QuizSubmitResult>>(
      '/gamification/quizzes/complete',
      { quizId, answers, userId, childId }
    );
    return response.data.data;
  }

  async getUserProgress(userId: string, childId?: string): Promise<GamificationProgress> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      `/gamification/progress/${userId}`,
      { params: { childId } }
    );
    return this.normalizeProgress(response.data.data);
  }

  async getUserBadges(userId: string, childId?: string): Promise<GamificationBadgeProgress[]> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      `/gamification/user-badges/${userId}`,
      { params: { childId } }
    );
    const rawBadges = response.data.data || [];
    return rawBadges.map((item: any) => this.normalizeBadgeProgress(item));
  }

  async getUserAchievements(userId: string, childId?: string): Promise<GamificationAchievementProgress[]> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      `/gamification/user-achievements/${userId}`,
      { params: { childId } }
    );
    const rawAchievements = response.data.data || [];
    return rawAchievements.map((item: any) => this.normalizeAchievementProgress(item));
  }

  async getAllBadges(category?: string, tier?: number, isActive?: boolean): Promise<GamificationBadge[]> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      '/gamification/badges',
      {
        params: {
          category,
          tier,
          isActive,
        },
      }
    );
    return (response.data.data || []).map((item: any) => this.normalizeBadge(item));
  }

  async getAllAchievements(difficulty?: string, category?: string, isActive?: boolean): Promise<GamificationAchievement[]> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      '/gamification/achievements',
      {
        params: {
          difficulty,
          category,
          isActive,
        },
      }
    );
    return (response.data.data || []).map((item: any) => this.normalizeAchievement(item));
  }

  async getLeaderboard(limit = 10, childSpecific = false): Promise<LeaderboardEntry[]> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      '/gamification/leaderboard',
      {
        params: {
          limit,
          childSpecific,
        },
      }
    );
    return (response.data.data || []).map((item: any) => this.normalizeLeaderboardEntry(item));
  }

  async getTransactionHistory(
    userId: string,
    childId?: string,
    limit = 10,
    source?: string
  ): Promise<GamificationTransaction[]> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      `/gamification/transactions/${userId}`,
      {
        params: {
          childId,
          limit,
          source,
        },
      }
    );
    return (response.data.data || []).map((item: any) => this.normalizeTransaction(item));
  }

  async createBadge(badgeData: Partial<GamificationBadge>): Promise<GamificationBadge> {
    const response = await apiClient.getInstance().post<ApiResponse<any>>(
      '/gamification/badges',
      badgeData
    );
    return this.normalizeBadge(response.data.data);
  }

  async createAchievement(achievementData: Partial<GamificationAchievement>): Promise<GamificationAchievement> {
    const response = await apiClient.getInstance().post<ApiResponse<any>>(
      '/gamification/achievements',
      achievementData
    );
    return this.normalizeAchievement(response.data.data);
  }

  async getSystemStats(): Promise<{ totalPlayers: number; avgLevel: number; totalXpAwarded: number }> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      '/gamification/stats/system'
    );
    return response.data.data;
  }

  async getLevelDistribution(): Promise<Array<{ level: number; players: number }>> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      '/gamification/stats/level-distribution'
    );
    return response.data.data || [];
  }

  async getXpTimeline(): Promise<Array<{ date: string; points: number; transactions: number }>> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      '/gamification/stats/xp-timeline'
    );
    return response.data.data || [];
  }

  private normalizeProgress(raw: any): GamificationProgress {
    return {
      id: raw._id || raw.id,
      user: raw.user,
      child: raw.child,
      totalPoints: raw.totalPoints ?? 0,
      level: raw.level ?? 1,
      currentStreak: raw.currentStreak ?? 0,
      longestStreak: raw.longestStreak ?? 0,
      stats: {
        storiesRead: raw.stats?.storiesRead ?? 0,
        assignmentsCompleted: raw.stats?.assignmentsCompleted ?? 0,
      },
      badges: Array.isArray(raw.badges) ? raw.badges.map((item: any) => this.normalizeBadgeProgress(item)) : [],
      achievements: Array.isArray(raw.achievements)
        ? raw.achievements.map((item: any) => this.normalizeAchievementProgress(item))
        : [],
    };
  }

  private normalizeBadge(raw: any): GamificationBadge {
    return {
      id: raw._id || raw.id,
      name: raw.name,
      description: raw.description,
      category: raw.category,
      tier: raw.tier,
      points: raw.points,
      isActive: raw.isActive,
      criteria: raw.criteria,
    };
  }

  private normalizeBadgeProgress(raw: any): GamificationBadgeProgress {
    return {
      id: raw._id || raw.id,
      badge: this.normalizeBadge(raw.badge || raw),
      earnedAt: raw.earnedAt,
    };
  }

  private normalizeAchievement(raw: any): GamificationAchievement {
    return {
      id: raw._id || raw.id,
      name: raw.name,
      description: raw.description,
      category: raw.category,
      difficulty: raw.difficulty,
      targetValue: raw.targetValue,
      reward: {
        points: raw.reward?.points ?? 0,
        badge: raw.reward?.badge ? this.normalizeBadge(raw.reward.badge) : undefined,
      },
      isActive: raw.isActive,
    };
  }

  private normalizeAchievementProgress(raw: any): GamificationAchievementProgress {
    return {
      id: raw._id || raw.id,
      achievement: this.normalizeAchievement(raw.achievement || raw),
      progress: raw.progress ?? 0,
      completed: Boolean(raw.completed),
      completedAt: raw.completedAt,
    };
  }

  private normalizeLeaderboardEntry(raw: any): LeaderboardEntry {
    return {
      id: raw._id || raw.id,
      user: raw.user,
      child: raw.child,
      totalPoints: raw.totalPoints ?? 0,
      level: raw.level ?? 1,
      currentStreak: raw.currentStreak ?? 0,
      longestStreak: raw.longestStreak ?? 0,
      stats: {
        storiesRead: raw.stats?.storiesRead ?? 0,
        assignmentsCompleted: raw.stats?.assignmentsCompleted ?? 0,
      },
    };
  }

  private normalizeTransaction(raw: any): GamificationTransaction {
    return {
      id: raw._id || raw.id,
      points: raw.points,
      type: raw.type,
      source: raw.source,
      description: raw.description,
      balanceBefore: raw.balanceBefore,
      balanceAfter: raw.balanceAfter,
      createdAt: raw.createdAt,
    };
  }
}

export default new GamificationService();
