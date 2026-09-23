import apiClient from './apiClient';
import { FamilyDashboardData, ChildDashboard, ApiResponse, FamilySummary } from '../types';
import {
  normalizeFamilyDashboardData,
  normalizeFamilySummary,
} from './contractNormalizer';

class DashboardService {
  async getFamilyDashboard(): Promise<FamilyDashboardData> {
    const response = await apiClient.getInstance().get<ApiResponse<unknown>>(
      '/dashboard/family'
    );
    return normalizeFamilyDashboardData(response.data.data);
  }

  async getChildDashboard(childId: string): Promise<ChildDashboard> {
    const response = await apiClient.getInstance().get<ApiResponse<ChildDashboard>>(
      `/dashboard/child/${childId}`
    );
    return response.data.data!;
  }

  async getFamilySummary(): Promise<FamilySummary> {
    const response = await apiClient.getInstance().get<ApiResponse<unknown>>(
      '/dashboard/summary'
    );
    return normalizeFamilySummary(response.data.data);
  }
}

export default new DashboardService();
