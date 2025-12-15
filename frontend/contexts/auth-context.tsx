'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { User, LoginRequest, LoginResponse } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loadingAuth: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'fo.jwt';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoadingAuth(false);
      return;
    }

    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (storedToken) {
        setToken(storedToken);
        apiClient.setAuthToken(storedToken);
      }
    } catch (error) {
      // If there's an error, clear corrupted data
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const login = useCallback((token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
    setToken(token);
    apiClient.setAuthToken(token);
    router.push('/');
  }, [router]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    setToken(null);
    setUser(null);
    apiClient.setAuthToken(null);
    router.push('/login');
  }, [router]);

  const value: AuthContextType = {
    user,
    token,
    loadingAuth,
    login,
    logout,
    isAuthenticated: !!token,
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
