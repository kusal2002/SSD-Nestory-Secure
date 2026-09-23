import apiClient from './apiClient';

export interface SearchRequestItem {
  _id: string;
  requesterName: string;
  query: string;
  suggestedBookName: string;
  googleBookId?: string;
  author?: string;
  coverImage?: string;
  previewLink?: string;
  pageCount?: number;
  status: 'pending' | 'reviewing' | 'ignored';
  createdAt: string;
}

class SearchRequestService {
  async createRequest(payload: {
    query: string;
    suggestedBookName?: string;
    googleBookId?: string;
    author?: string;
    coverImage?: string;
    previewLink?: string;
    pageCount?: number;
  }) {
    const response = await apiClient.getInstance().post('/search-requests', payload);
    return response.data.data;
  }

  async getPendingRequests(): Promise<SearchRequestItem[]> {
    const response = await apiClient.getInstance().get('/search-requests/pending');
    return response.data.data || [];
  }

  async markReviewing(id: string) {
    const response = await apiClient.getInstance().put(`/search-requests/${id}/reviewing`);
    return response.data.data;
  }

  async ignoreRequest(id: string) {
    const response = await apiClient.getInstance().put(`/search-requests/${id}/ignore`);
    return response.data.data;
  }
}

export default new SearchRequestService();