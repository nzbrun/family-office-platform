/**
 * API wrapper for backend requests
 * Handles JWT token in Authorization header
 * Centralized 401 handling (redirects to login)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export class ApiClient {
  private token: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setOnUnauthorized(callback: (() => void) | null) {
    this.onUnauthorized = callback;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add X-Tenant-Id header if tenant exists in localStorage
    if (typeof window !== 'undefined') {
      const tenantId = localStorage.getItem('fo.tenantId');
      if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.setToken(null);
        if (this.onUnauthorized) {
          this.onUnauthorized();
        } else if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        const error = new Error('No autorizado') as Error & {
          statusCode?: number;
        };
        error.statusCode = 403;
        throw error;
      }

      // Handle 429 Too Many Requests
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error('Demasiadas solicitudes. Por favor, intente más tarde.') as Error & {
          statusCode?: number;
          retryAfter?: number;
        };
        error.statusCode = 429;
        if (errorData.retryAfter) {
          error.retryAfter = errorData.retryAfter;
        }
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
          statusCode: response.status,
        }));
        const error = new Error(errorData.message || 'Request failed') as Error & {
          statusCode?: number;
          retryAfter?: number;
          requestId?: string;
        };
        error.statusCode = response.status;
        if (errorData.retryAfter) {
          error.retryAfter = errorData.retryAfter;
        }
        if (errorData.requestId) {
          error.requestId = errorData.requestId;
        }
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient();

export function setAuthToken(token: string | null) {
  apiClient.setToken(token);
}

export function setOnUnauthorized(callback: (() => void) | null) {
  apiClient.setOnUnauthorized(callback);
}
