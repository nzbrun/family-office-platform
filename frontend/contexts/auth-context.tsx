'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { User, LoginRequest, LoginResponse } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from memory (not localStorage)
  useEffect(() => {
    // In a real app, you might check for token in memory
    // For now, we start with no auth
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/auth/login',
        credentials
      );
      
      setToken(response.access_token);
      setUser(response.user);
      apiClient.setToken(response.access_token);
      
      router.push('/');
    } catch (error) {
      throw error;
    }
  }, [router]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
    router.push('/login');
  }, [router]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
