import apiClient from './apiClient';
import { Family, ApiResponse } from '../types';
import { normalizeFamily } from './contractNormalizer';

class FamilyService {
  async createFamily(data: { familyName: string }): Promise<Family> {
    const response = await apiClient.getInstance().post<ApiResponse<Family>>(
      '/family',
      data
    );
    return normalizeFamily(response.data.data);
  }

  async getMyFamily(): Promise<Family> {
    const response = await apiClient.getInstance().get<ApiResponse<Family>>(
      '/family/my'
    );
    return normalizeFamily(response.data.data);
  }

  async getFamilyById(id: string): Promise<Family> {
    const response = await apiClient.getInstance().get<ApiResponse<Family>>(
      `/family/${id}`
    );
    return normalizeFamily(response.data.data);
  }

  async updateFamily(id: string, data: Partial<Family>): Promise<Family> {
    const response = await apiClient.getInstance().put<ApiResponse<Family>>(
      `/family/${id}`,
      data
    );
    return normalizeFamily(response.data.data);
  }

  async deleteFamily(id: string): Promise<void> {
    await apiClient.getInstance().delete(`/family/${id}`);
  }
}

export default new FamilyService();
