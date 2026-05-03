// ============================================
// API Client - Axios instance with JWT handling
// ============================================

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Environment variable for API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'yes',
        'ngrok-skip-browser-warning': 'yes',
      },
      timeout: 10000,
    });

    // Request interceptor - add JWT token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = ApiClient.getToken();
        console.warn('📡 [API] Request - Token:', token ? 'YES (' + token.length + ')' : 'NO');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.warn('>>> REQUEST URL:', config.baseURL || '' + config.url);
        console.warn('>>> HEADERS:', JSON.stringify(config.headers));
        console.warn('📡 [API]', config.method?.toUpperCase(), config.baseURL || '' + config.url, 'Auth:', !!config.headers.Authorization);
        return config;
      },
      (error: AxiosError) => {
        console.error('[API] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle 401
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] Response ${response.status}:`, response.data);
        return response;
      },
      (error: AxiosError) => {
        console.error(`[API] Response error:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
        if (error.response?.status === 401) {
          // TEMP: Disable redirect for debugging
          ApiClient.clearToken();
          console.warn('[API] 401 received - NOT redirecting (debug)');
          // if (typeof window !== 'undefined') {
          //   window.location.href = '/login';
          // }
        }
        return Promise.reject(error);
      }
    );
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Token management (in-memory for security)
  private static token: string | null = null;

  // Tenant storage (in-memory for security)
  private static tenant: { id: string; name: string; email: string } | null = null;

  static setToken(token: string): void {
    console.warn('🔥 [ApiClient] SET TOKEN, length:', token.length);
    ApiClient.token = token;
  }

  static getToken(): string | null {
    console.log('[ApiClient] getToken() called, returning:', ApiClient.token ? 'TOKEN (length: ' + ApiClient.token.length + ')' : 'NULL');
    return ApiClient.token;
  }

  static clearToken(): void {
    console.log('[ApiClient] clearToken() called - TOKEN CLEARED');
    ApiClient.token = null;
    ApiClient.tenant = null;
  }

  static setTenant(tenant: { id: string; name: string; email: string }): void {
    ApiClient.tenant = tenant;
  }

  static getTenant(): { id: string; name: string; email: string } | null {
    return ApiClient.tenant;
  }

  // Instance methods that delegate to static (for external use)
  setToken(token: string): void {
    ApiClient.setToken(token);
  }

  getToken(): string | null {
    return ApiClient.getToken();
  }

  clearToken(): void {
    ApiClient.clearToken();
  }

  setTenant(tenant: { id: string; name: string; email: string }): void {
    ApiClient.setTenant(tenant);
  }

  getTenant(): { id: string; name: string; email: string } | null {
    return ApiClient.getTenant();
  }

  // Generic request methods
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = ApiClient.getInstance();
export default apiClient;