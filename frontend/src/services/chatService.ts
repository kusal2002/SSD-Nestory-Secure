import { io, Socket } from 'socket.io-client';
import apiClient from './apiClient';
import { ApiResponse, ChatGroupSummary, ChatMessage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

class ChatService {
  private socket: Socket | null = null;

  async getMyGroup(): Promise<ChatGroupSummary> {
    const response = await apiClient
      .getInstance()
      .get<ApiResponse<ChatGroupSummary>>('/chat/my-group');
    return response.data.data as ChatGroupSummary;
  }

  async getMessages(limit = 50, before?: string): Promise<ChatMessage[]> {
    const response = await apiClient.getInstance().get<ApiResponse<ChatMessage[]>>('/chat/messages', {
      params: {
        limit,
        ...(before ? { before } : {}),
      },
    });

    return response.data.data || [];
  }

  async sendMessage(content: string): Promise<ChatMessage> {
    const response = await apiClient
      .getInstance()
      .post<ApiResponse<ChatMessage>>('/chat/messages', { content });
    return response.data.data as ChatMessage;
  }

  async markRead(messageIds: string[] = []): Promise<{ modifiedCount: number; unreadCount: number }> {
    const response = await apiClient
      .getInstance()
      .patch<ApiResponse<{ modifiedCount: number; unreadCount: number }>>('/chat/messages/read', {
        messageIds,
      });

    return (
      response.data.data || {
        modifiedCount: 0,
        unreadCount: 0,
      }
    );
  }

  async getUnread(): Promise<number> {
    const response = await apiClient
      .getInstance()
      .get<ApiResponse<{ unreadCount: number }>>('/chat/unread');

    return Number(response.data.data?.unreadCount || 0);
  }

  async clearChat(): Promise<{ deletedCount: number }> {
    const response = await apiClient
      .getInstance()
      .delete<ApiResponse<{ deletedCount: number }>>('/chat/messages');

    return response.data.data || { deletedCount: 0 };
  }

  connectSocket(token: string): Socket {
    if (this.socket && this.socket.connected) {
      console.log("[ChatService] Socket already connected, returning:", this.socket.id);
      return this.socket;
    }

    if (this.socket) {
      console.log("[ChatService] Socket exists but not connected, reconnecting...");
      this.socket.connect();
      return this.socket;
    }

    console.log("[ChatService] Creating new Socket.io connection to:", SOCKET_BASE_URL);
    this.socket = io(SOCKET_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      auth: {
        token,
      },
    });

    console.log("[ChatService] Socket created, ID:", this.socket.id);
    return this.socket;
  }

  disconnectSocket() {
    if (this.socket) {
      console.log("[ChatService] Disconnecting socket:", this.socket.id);
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new ChatService();
