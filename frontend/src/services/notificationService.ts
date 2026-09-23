import apiClient from './apiClient';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: string;
  type: 'search_request' | 'assignment' | 'badge' | 'system' | 'chat';
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.getInstance().get('/notifications');
  return response.data.data;
};

export const markAllAsRead = async (): Promise<void> => {
  await apiClient.getInstance().put('/notifications/read-all');
};

export const markOneAsRead = async (id: string): Promise<Notification> => {
  const response = await apiClient.getInstance().put(`/notifications/${id}/read`);
  return response.data.data;
};
