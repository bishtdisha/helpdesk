/**
 * API Client for Frontend Integration
 * 
 * Provides a centralized HTTP client with:
 * - Error handling for different HTTP status codes
 * - Authentication header management
 * - Request/response interceptors
 * - Type-safe API calls
 * - Performance monitoring
 */

import { APIError } from './types/api';
import { performanceMonitor } from './performance/monitoring';

export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    // If endpoint already starts with /api, use it as-is, otherwise prepend baseURL
    const fullPath = endpoint.startsWith('/api') ? endpoint : `${this.baseURL}${endpoint}`;
    const url = new URL(fullPath, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Parse error response
   */
  private async parseError(response: Response): Promise<APIError> {
    let errorData: APIError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: response.statusText || 'Unknown error',
        statusCode: response.status,
      };
    }

    return {
      ...errorData,
      statusCode: response.status,
    };
  }

  /**
   * Handle HTTP errors based on status code
   */
  private async handleError(response: Response): Promise<never> {
    const error = await this.parseError(response);

    switch (response.status) {
      case 401:
        // Unauthorized - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error(error.message || 'Unauthorized. Please log in.');

      case 403:
        // Forbidden - access denied
        throw new Error(error.message || 'Access denied. You do not have permission to perform this action.');

      case 404:
        // Not found
        throw new Error(error.message || 'The requested resource was not found.');

      case 500:
        // Server error
        throw new Error(error.message || 'An internal server error occurred. Please try again later.');

      default:
        // Generic error
        throw new Error(error.message || error.error || 'An error occurred. Please try again.');
    }
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    // Add default headers only if not FormData
    // For FormData, let the browser set the Content-Type with boundary
    const isFormData = options.body instanceof FormData;
    const headers: HeadersInit = isFormData 
      ? { ...options.headers } 
      : {
          'Content-Type': 'application/json',
          ...options.headers,
        };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for session management
      });

      // Record performance metrics
      const duration = performance.now() - startTime;
      performanceMonitor.recordApiResponseTime(url, duration);

      // Handle error responses
      if (!response.ok) {
        await this.handleError(response);
      }

      // Parse successful response
      const data = await response.json();
      return data;
    } catch (error) {
      // Record failed request performance
      const duration = performance.now() - startTime;
      performanceMonitor.recordApiResponseTime(url, duration);
      
      // Re-throw if it's already our formatted error
      if (error instanceof Error) {
        throw error;
      }
      
      // Handle network errors
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildURL(endpoint, params);
    return this.request<T>(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: { headers?: HeadersInit }): Promise<T> {
    const url = this.buildURL(endpoint);
    
    // Check if data is FormData - if so, don't stringify and don't set Content-Type
    const isFormData = data instanceof FormData;
    
    return this.request<T>(url, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? options?.headers : { 'Content-Type': 'application/json', ...options?.headers },
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = this.buildURL(endpoint);
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildURL(endpoint);
    return this.request<T>(url, {
      method: 'DELETE',
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const url = this.buildURL(endpoint);
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();
