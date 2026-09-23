import apiClient from './apiClient';
import {
  Assignment,
  AssignmentDueState,
  AssignmentListResult,
  AssignmentProgressOverview,
  AssignmentStatus,
  ApiResponse,
} from '../types';
import { normalizeAssignment, normalizeFamilyDashboardData } from './contractNormalizer';

interface AssignmentListApiResponse {
  success: boolean;
  message?: string;
  data?: Assignment[];
  pagination?: AssignmentListResult['pagination'];
  metadata?: AssignmentListResult['metadata'];
}

export interface ListAssignmentsQuery {
  childId?: string;
  status?: AssignmentStatus;
  dueState?: AssignmentDueState;
  dueSoonDays?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'dueDate' | 'status';
  sortOrder?: 'asc' | 'desc';
}

class AssignmentService {
  async createAssignment(data: {
    childId: string;
    storyId: string;
    dueDate?: string;
    notes?: string;
  }): Promise<Assignment> {
    const response = await apiClient.getInstance().post<ApiResponse<Assignment>>(
      '/assignments',
      data
    );
    return normalizeAssignment(response.data.data);
  }

  async getFamilyAssignments(): Promise<Assignment[]> {
    const response = await apiClient.getInstance().get<ApiResponse<unknown>>(
      '/assignments/family'
    );
    const dashboard = normalizeFamilyDashboardData(response.data.data);
    return dashboard.recentAssignments;
  }

  async getChildAssignments(childId: string): Promise<Assignment[]> {
    const response = await apiClient.getInstance().get<ApiResponse<Assignment[]>>(
      `/assignments/child/${childId}`
    );
    return (response.data.data || []).map(normalizeAssignment);
  }

  async getMyAssignments(): Promise<Assignment[]> {
    const response = await apiClient.getInstance().get<ApiResponse<Assignment[]>>(
      '/assignments/me'
    );
    return (response.data.data || []).map(normalizeAssignment);
  }

  async getMyProgressOverview(): Promise<AssignmentProgressOverview> {
    const response = await apiClient.getInstance().get<ApiResponse<AssignmentProgressOverview>>(
      '/assignments/me/progress'
    );
    return response.data.data!;
  }

  async getParentProgressOverview(childId?: string): Promise<AssignmentProgressOverview> {
    const response = await apiClient.getInstance().get<ApiResponse<AssignmentProgressOverview>>(
      '/assignments/progress',
      { params: childId ? { childId } : undefined }
    );
    return response.data.data!;
  }

  async getMyAssignmentById(id: string): Promise<Assignment> {
    const response = await apiClient.getInstance().get<ApiResponse<Assignment>>(
      `/assignments/me/${id}`
    );
    return normalizeAssignment(response.data.data);
  }

  async updateMyAssignmentStatus(id: string, status: AssignmentStatus): Promise<Assignment> {
    const response = await apiClient.getInstance().put<ApiResponse<Assignment>>(
      `/assignments/me/${id}/status`,
      { status }
    );
    return normalizeAssignment(response.data.data);
  }

  async listAssignments(query: ListAssignmentsQuery): Promise<AssignmentListResult> {
    const response = await apiClient
      .getInstance()
      .get<AssignmentListApiResponse>('/assignments', { params: query });

    const assignments = (response.data.data || []).map(normalizeAssignment);

    return {
      data: assignments,
      pagination: response.data.pagination || {
        page: query.page || 1,
        limit: query.limit || assignments.length || 1,
        totalItems: assignments.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      metadata: response.data.metadata || {
        overdueCount: assignments.filter((assignment) => assignment.isOverdue).length,
        dueSoonCount: assignments.filter((assignment) => assignment.isDueSoon).length,
      },
    };
  }

  async getAssignmentById(id: string): Promise<Assignment> {
    const response = await apiClient.getInstance().get<ApiResponse<Assignment>>(
      `/assignments/${id}`
    );
    return normalizeAssignment(response.data.data);
  }

  async updateAssignmentStatus(
    id: string,
    status: AssignmentStatus
  ): Promise<Assignment> {
    const response = await apiClient.getInstance().put<ApiResponse<Assignment>>(
      `/assignments/${id}/status`,
      { status }
    );
    return normalizeAssignment(response.data.data);
  }

  async updateAssignmentDetails(
    id: string,
    data: {
      dueDate?: string;
      notes?: string;
    }
  ): Promise<Assignment> {
    const response = await apiClient.getInstance().put<ApiResponse<Assignment>>(
      `/assignments/${id}`,
      data
    );
    return normalizeAssignment(response.data.data);
  }

  async deleteAssignment(id: string): Promise<void> {
    await apiClient.getInstance().delete(`/assignments/${id}`);
  }
}

export default new AssignmentService();
