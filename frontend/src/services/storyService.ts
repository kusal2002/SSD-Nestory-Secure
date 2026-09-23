import apiClient from './apiClient';
import { Story, ApiResponse } from '../types';
import { normalizeStory } from '../utils/storyLibrary/storyMapper';

type StoryFilters = {
  ageGroup?: string;
  readingLevel?: string;
  genre?: string;
  search?: string;
  source?: string;
};

type StoryListResult = {
  stories: Story[];
  total: number;
  page: number;
  pages: number;
};

interface StoryListPayload {
  data?: any[];
  stories?: any[];
  total?: number;
  page?: number;
  pages?: number;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}

type GoogleBookImportPayload = {
  ageGroup: string;
  genres: string[];
  readingLevel: string;
  metadata?: {
    googleBookId: string;
    title: string;
    author: string;
    description?: string;
    coverImage?: string;
    previewLink?: string;
    pageCount?: number;
  };
};

class StoryService {
  async searchGoogle(query: string): Promise<any[]> {
    const response = await apiClient
      .getInstance()
      .get(`/stories/google/search?q=${encodeURIComponent(query)}`);
    return response.data.data || [];
  }

  async importFromGoogle(
    googleBookId: string,
    body: GoogleBookImportPayload
  ): Promise<Story> {
    const response = await apiClient.getInstance().post<ApiResponse<any>>(
      `/stories/google/import/${googleBookId}`,
      body
    );
    return normalizeStory(response.data.data);
  }

  async syncStoryMetadata(storyId: string): Promise<Story> {
    const response = await apiClient.getInstance().put<ApiResponse<any>>(
      `/stories/google/sync/${storyId}`
    );
    return normalizeStory(response.data.data);
  }

  async getStories(
    page: number = 1,
    limit: number = 12,
    filters?: StoryFilters
  ): Promise<StoryListResult> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    if (filters?.search) params.append('search', filters.search);
    if (filters?.ageGroup) params.append('ageGroup', filters.ageGroup);
    if (filters?.readingLevel) {
      params.append('readingLevel', filters.readingLevel);
    }
    if (filters?.genre) params.append('genre', filters.genre);
    if (filters?.source) params.append('source', filters.source);

    const response = await apiClient
      .getInstance()
      .get<ApiResponse<StoryListPayload>>(`/stories?${params.toString()}`);

    const payload = response.data.data || {};

    const rawStories = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.stories)
      ? payload.stories
      : [];

    const stories = rawStories.map(normalizeStory);
    const meta = payload.pagination || payload.meta;

    return {
      stories,
      total: Number(meta?.total ?? payload.total ?? rawStories.length),
      page: Number(meta?.page ?? payload.page ?? page),
      pages: Number(meta?.pages ?? payload.pages ?? 1),
    };
  }

  async getStoryById(id: string): Promise<Story> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      `/stories/${id}`
    );
    return normalizeStory(response.data.data);
  }

  async createStory(data: any): Promise<Story> {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    const response = await apiClient.getInstance().post<ApiResponse<any>>(
      '/stories',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return normalizeStory(response.data.data);
  }

  async updateStory(id: string, data: any): Promise<Story> {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    const response = await apiClient.getInstance().put<ApiResponse<any>>(
      `/stories/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return normalizeStory(response.data.data);
  }

  async deleteStory(id: string): Promise<void> {
    await apiClient.getInstance().delete(`/stories/${id}`);
  }
}

export default new StoryService();