import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ROLE_FORBIDDEN = 'Not authorized for this resource';

const ROLE_SYNC_KEY = 'nestory_role_sync';

/** Child-scoped APIs (authorize("child")) — same 403 message as parent-only routes, so we branch on URL. */
function isChildOnlyEndpoint(url: string): boolean {
  if (!url) return false;
  const path = url.split('?')[0];
  return path.includes('assignments/me') || path.includes('sessions/me/');
}

/**
 * Parent and child routes both return ROLE_FORBIDDEN when the wrong role calls them.
 * Use the request path plus /auth/me to send the user to the right surface (or toast once).
 */
function syncSurfaceAfter403(requestUrl: string, apiMessage: string) {
  if (typeof window === 'undefined' || sessionStorage.getItem(ROLE_SYNC_KEY)) return;
  const token = localStorage.getItem('token');
  if (!token) {
    toast.error(apiMessage || 'You are not allowed to perform this action');
    return;
  }

  sessionStorage.setItem(ROLE_SYNC_KEY, '1');
  const meUrl = `${API_BASE_URL.replace(/\/$/, '')}/auth/me`;
  const origin = window.location.origin;

  void fetch(meUrl, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((body: { data?: { role?: string } } | null) => {
      const role = body?.data?.role;
      const childOnly = isChildOnlyEndpoint(requestUrl);

      if (childOnly) {
        if (role === 'user') {
          window.location.replace(`${origin}/dashboard`);
          return;
        }
        if (role === 'admin') {
          window.location.replace(`${origin}/admin`);
          return;
        }
        sessionStorage.removeItem(ROLE_SYNC_KEY);
        toast.error(apiMessage || 'You are not allowed to perform this action');
        return;
      }

      if (role === 'child') {
        window.location.replace(`${origin}/child`);
        return;
      }

      sessionStorage.removeItem(ROLE_SYNC_KEY);
      toast.error(apiMessage || 'You are not allowed to perform this action');
    })
    .catch(() => {
      sessionStorage.removeItem(ROLE_SYNC_KEY);
      toast.error(apiMessage || 'You are not allowed to perform this action');
    });
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';
        const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

        if (status === 401 && !isAuthEndpoint && localStorage.getItem('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        if (status === 403) {
          const apiMessage =
            (error.response?.data as { message?: string })?.message ||
            'You are not allowed to perform this action';
          const requestUrl = error.config?.url || '';

          if (apiMessage === ROLE_FORBIDDEN || isChildOnlyEndpoint(requestUrl)) {
            syncSurfaceAfter403(requestUrl, apiMessage);
          } else {
            toast.error(apiMessage);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  getInstance(): AxiosInstance {
    return this.client;
  }

  setToken(token: string): void {
    const cleanToken = token.replace(/^"(.*)"$/, '$1');
    this.client.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
    localStorage.setItem('token', cleanToken);
  }

  clearToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
}

export default new ApiClient();
