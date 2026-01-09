'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken, setOnUnauthorized } from '@/lib/api';
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
const TENANT_KEY = 'fo.tenantId';

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
        setAuthToken(storedToken);
      }
    } catch (error) {
      // If there's an error, clear corrupted data
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TENANT_KEY);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const login = useCallback((token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
    setToken(token);
    setAuthToken(token);
    router.push('/');
  }, [router]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TENANT_KEY);
    }
    setToken(null);
    setUser(null);
    setAuthToken(null);
    router.push('/login');
  }, [router]);

  // Configure onUnauthorized callback for apiClient
  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
    });
    return () => {
      setOnUnauthorized(null);
    };
  }, [logout]);

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
