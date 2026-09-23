import apiClient from './apiClient';
import { Child, AddChildResponse, ApiResponse } from '../types';
import { normalizeChild } from './contractNormalizer';

class ChildService {
  async addChild(data: {
    name: string;
    age: number;
    avatar?: string;
    family?: string;
    readingLevel?: 'beginner' | 'intermediate' | 'advanced';
    email?: string;
  }): Promise<AddChildResponse> {
    const response = await apiClient.getInstance().post<ApiResponse<AddChildResponse>>(
      '/children',
      data
    );

    const payload = response.data.data;
    return {
      child: normalizeChild(payload?.child),
      credentials: {
        email: payload?.credentials?.email || '',
        temporaryPassword: payload?.credentials?.temporaryPassword || '',
        mustChangePassword: payload?.credentials?.mustChangePassword ?? true,
      },
    };
  }

  async getChildren(): Promise<Child[]> {
    const response = await apiClient.getInstance().get<ApiResponse<Child[]>>(
      '/children'
    );
    return (response.data.data || []).map(normalizeChild);
  }

  async getChildById(id: string): Promise<Child> {
    const response = await apiClient.getInstance().get<ApiResponse<Child>>(
      `/children/${id}`
    );
    return normalizeChild(response.data.data);
  }

  async updateChild(id: string, data: Partial<Child>): Promise<Child> {
    const response = await apiClient.getInstance().put<ApiResponse<Child>>(
      `/children/${id}`,
      data
    );
    return normalizeChild(response.data.data);
  }

  async deleteChild(id: string): Promise<void> {
    await apiClient.getInstance().delete(`/children/${id}`);
  }

  async resetChildPassword(id: string): Promise<AddChildResponse> {
    const response = await apiClient.getInstance().post<ApiResponse<AddChildResponse>>(
      `/children/${id}/reset-password`
    );

    const payload = response.data.data;
    return {
      child: normalizeChild(payload?.child),
      credentials: {
        email: payload?.credentials?.email || '',
        temporaryPassword: payload?.credentials?.temporaryPassword || '',
        mustChangePassword: payload?.credentials?.mustChangePassword ?? true,
      },
    };
  }
}

export default new ChildService();
