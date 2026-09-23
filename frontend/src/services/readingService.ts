import apiClient from './apiClient';
import {
  ApiResponse,
  MyReadingSessionRow,
  BookReadingProgress,
  ReadingActivitySummary,
} from '../types';

export type SessionListItem = MyReadingSessionRow;

class ReadingService {
  async getMySessions(status?: 'active' | 'completed'): Promise<MyReadingSessionRow[]> {
    const response = await apiClient.getInstance().get<ApiResponse<MyReadingSessionRow[]>>(
      '/sessions/my-sessions',
      { params: status ? { status } : undefined }
    );
    return response.data.data ?? [];
  }

  /** Parent: pass childId + storyId. Child: storyId only. */
  async startSession(data: {
    childId?: string;
    storyId?: string;
    bookId?: string;
    totalPages?: number;
  }): Promise<Record<string, unknown>> {
    const response = await apiClient.getInstance().post<
      ApiResponse<Record<string, unknown>>
    >('/sessions/start', data);
    return response.data.data!;
  }

  /** Child account: start or resume a session for a story (no parent flow). */
  async startMySession(body: { storyId?: string; bookId?: string }): Promise<{ _id: string }> {
    const response = await apiClient.getInstance().post<ApiResponse<{ _id?: string; id?: string }>>(
      '/sessions/start-me',
      body
    );
    const data = response.data.data!;
    const _id = data._id ?? data.id;
    if (!_id) {
      throw new Error('Session id missing from server response');
    }
    return { _id: String(_id) };
  }

  async updateSession(data: {
    sessionId: string;
    pagesRead?: number;
    timeSpent?: number;
    completed?: boolean;
  }): Promise<{ session: Record<string, unknown>; progress: number }> {
    const response = await apiClient.getInstance().post<
      ApiResponse<{ session: Record<string, unknown>; progress: number }>
    >('/sessions/update', data);
    return response.data.data!;
  }

  async getProgressByBook(bookId: string): Promise<BookReadingProgress> {
    const response = await apiClient.getInstance().get<ApiResponse<BookReadingProgress>>(
      `/sessions/progress/${bookId}`
    );
    return response.data.data!;
  }

  async getMyActivitySummary(days = 7): Promise<ReadingActivitySummary> {
    const response = await apiClient.getInstance().get<ApiResponse<ReadingActivitySummary>>(
      '/sessions/me/activity-summary',
      { params: { days } }
    );
    return response.data.data!;
  }

  async getFamilyActivitySummary(days = 7): Promise<ReadingActivitySummary> {
    const response = await apiClient.getInstance().get<ApiResponse<ReadingActivitySummary>>(
      '/sessions/activity-summary/family',
      { params: { days } }
    );
    return response.data.data!;
  }

  async getWeeklyReadingTime(childId: string): Promise<{ totalTime: number; unit: string }> {
    const response = await apiClient.getInstance().get<ApiResponse<{ totalTime: number; unit: string }>>(
      `/sessions/weekly/${childId}`
    );
    return response.data.data!;
  }

  async getReadingStreak(childId: string): Promise<{ streak: number; longestStreak: number }> {
    const response = await apiClient.getInstance().get<ApiResponse<{ streak: number; longestStreak: number }>>(
      `/sessions/streak/${childId}`
    );
    return response.data.data!;
  }
}

export default new ReadingService();
