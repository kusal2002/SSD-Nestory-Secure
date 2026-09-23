import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
import authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const parseStoredUser = (value: string | null): User | null => {
    if (!value || value === 'undefined' || value === 'null') {
      return null;
    }

    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      const roleValue = typeof parsed.role === 'string' ? parsed.role : '';
      if (!parsed || !roleValue) {
        return null;
      }

      const normalizedRole = roleValue === 'user' ? 'parent' : roleValue;
      if (!['admin', 'parent', 'child'].includes(normalizedRole)) {
        return null;
      }

      return {
        ...(parsed as Partial<User>),
        role: normalizedRole as User['role'],
      } as User;
    } catch {
      return null;
    }
  };

  // Initialize from localStorage
  useEffect(() => {
    const hydrateAuth = async () => {
      let storedToken = localStorage.getItem('token');
      if (storedToken) {
        storedToken = storedToken.replace(/^"(.*)"$/, '$1');
      }
      const storedUser = localStorage.getItem('user');
      const parsedUser = parseStoredUser(storedUser);

      if (storedToken && parsedUser) {
        try {
          authService.setToken(storedToken, parsedUser);
          const freshUser = await authService.getCurrentUser();

          if (!freshUser?.role || !['admin', 'parent', 'child'].includes(freshUser.role)) {
            throw new Error('Invalid role');
          }

          setToken(storedToken);
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
          sessionStorage.removeItem('nestory_role_sync');
          sessionStorage.removeItem('nestory_role_redirect');
        } catch {
          authService.logout();
          setToken(null);
          setUser(null);
        }
      } else if (storedToken || storedUser) {
        authService.logout();
        setToken(null);
        setUser(null);
      }

      setIsLoading(false);
    };

    hydrateAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await authService.login(data);
      authService.setToken(response.token, response.user);

      let finalUser = response.user;
      try {
        finalUser = await authService.getCurrentUser();
        localStorage.setItem('user', JSON.stringify(finalUser));
      } catch {
        finalUser = response.user;
      }

      setToken(response.token);
      setUser(finalUser);
      sessionStorage.removeItem('nestory_role_sync');
      sessionStorage.removeItem('nestory_role_redirect');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await authService.register(data);
      authService.setToken(response.token, response.user);

      let finalUser = response.user;
      try {
        finalUser = await authService.getCurrentUser();
        localStorage.setItem('user', JSON.stringify(finalUser));
      } catch {
        finalUser = response.user;
      }

      setToken(response.token);
      setUser(finalUser);
      sessionStorage.removeItem('nestory_role_sync');
      sessionStorage.removeItem('nestory_role_redirect');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('nestory_role_sync');
    sessionStorage.removeItem('nestory_role_redirect');
  };

  const updateUserProfile = async (data: Partial<User>) => {
    try {
      const updated = await authService.updateProfile(data);
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authService.changePassword({ currentPassword, newPassword });
    setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
    const storedUser = localStorage.getItem('user');
    const parsed = parseStoredUser(storedUser);
    if (parsed) {
      localStorage.setItem('user', JSON.stringify({ ...parsed, mustChangePassword: false }));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    updateUserProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
