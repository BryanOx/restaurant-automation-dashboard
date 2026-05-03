// ============================================
// Typed API Functions - Strictly matches backend contracts
// ============================================

import apiClient from './apiClient';
import type {
  ApiResponse,
  AuthRegisterRequest,
  AuthLoginRequest,
  AuthResponse,
  MessagesResponse,
  OrderDTO,
  OrderStatsDTO,
  HealthResponse,
  CustomerDTO,
  CreateOrderRequest,
  PaginationParams,
  MySessionResponse,
  CategoryDTO,
  CreateCategoryRequest,
  ProductDTO,
  CreateProductRequest,
  UpdateProductRequest,
  DashboardMetrics,
  UpdateOrderStatusRequest,
} from '../types';

// ============================================
// Auth Endpoints
// ============================================

export const registerTenant = async (data: AuthRegisterRequest): Promise<AuthResponse> => {
  return apiClient.post<AuthResponse>('/auth/register', data);
};

export const loginTenant = async (data: AuthLoginRequest): Promise<AuthResponse> => {
  return apiClient.post<AuthResponse>('/auth/login', data);
};

export const refreshToken = async (): Promise<AuthResponse> => {
  return apiClient.post<AuthResponse>('/auth/refresh');
};

// ============================================
// Messages Endpoints
// ============================================

export const getMessages = async (params?: PaginationParams): Promise<ApiResponse<MessagesResponse>> => {
  return apiClient.get<ApiResponse<MessagesResponse>>('/messages', {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  });
};

// ============================================
// Orders Endpoints
// ============================================

export const getOrders = async (params?: PaginationParams): Promise<ApiResponse<OrderDTO[]>> => {
  return apiClient.get<ApiResponse<OrderDTO[]>>('/orders', {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  });
};

export const getOrderStats = async (period: 'day' | 'week' | 'month' = 'day'): Promise<ApiResponse<OrderStatsDTO>> => {
  console.log('[getOrderStats] Calling API with period:', period);
  return apiClient.get<ApiResponse<OrderStatsDTO>>('/orders/summary', { period });
};

// Dashboard Metrics (GET /orders/dashboard)
export const getDashboardMetrics = async (): Promise<ApiResponse<DashboardMetrics>> => {
  console.log('[getDashboardMetrics] Calling API...');
  return apiClient.get<ApiResponse<DashboardMetrics>>('/orders/dashboard');
};

// Update Order Status (PATCH /orders/:id/status)
export const updateOrderStatus = async (id: string, data: UpdateOrderStatusRequest): Promise<OrderDTO> => {
  console.log('[updateOrderStatus] Calling API for order:', id, 'with status:', data.status);
  return apiClient.patch<OrderDTO>(`/orders/${id}/status`, data);
};

export const createOrder = async (data: CreateOrderRequest): Promise<OrderDTO> => {
  return apiClient.post<OrderDTO>('/orders', data);
};

// ============================================
// Sessions Endpoints
// ============================================

export const getSessionsHealth = async (): Promise<ApiResponse<HealthResponse>> => {
  return apiClient.get<ApiResponse<HealthResponse>>('/sessions/health');
};

export const getMySession = async (): Promise<ApiResponse<MySessionResponse>> => {
  console.warn('⚠️ [getMySession] Calling /sessions/my API');
  try {
    const response = await apiClient.get<ApiResponse<MySessionResponse>>('/sessions/my');
    console.warn('⚠️ [getMySession] Response:', response);
    console.warn('⚠️ [getMySession] Response.data:', response.data);
    console.warn('⚠️ [getMySession] Response.data.status:', response.data.status);
    return response;
  } catch (error) {
    console.error('❌ [getMySession] ERROR:', error);
    throw error;
  }
};

export const startSession = async (): Promise<{ ok: boolean }> => {
  console.warn('🚀 [startSession] Calling /sessions/start API');
  try {
    const response = await apiClient.post<{ ok: boolean }>('/sessions/start');
    console.warn('🚀 [startSession] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [startSession] ERROR:', error);
    throw error;
  }
};

// ============================================
// Customers Endpoints
// ============================================

export const getCustomers = async (includeInactive?: boolean): Promise<ApiResponse<CustomerDTO[]>> => {
  return apiClient.get<ApiResponse<CustomerDTO[]>>('/customers', {
    includeInactive: includeInactive ? 'true' : undefined,
  });
};

export const createCustomer = async (data: {
  name: string;
  phone: string;
  email?: string;
}): Promise<CustomerDTO> => {
  return apiClient.post<CustomerDTO>('/customers', data);
};

// ============================================
// Catalog - Categories
// ============================================

export const getCategories = async (): Promise<ApiResponse<CategoryDTO[]>> => {
  return apiClient.get<ApiResponse<CategoryDTO[]>>('/catalog/categories');
};

export const createCategory = async (data: CreateCategoryRequest): Promise<ApiResponse<CategoryDTO>> => {
  return apiClient.post<ApiResponse<CategoryDTO>>('/catalog/categories', data);
};

export const updateCategory = async (id: string, data: Partial<CreateCategoryRequest>): Promise<ApiResponse<CategoryDTO>> => {
  return apiClient.patch<ApiResponse<CategoryDTO>>(`/catalog/categories/${id}`, data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  return apiClient.delete<void>(`/catalog/categories/${id}`);
};

// ============================================
// Catalog - Products
// ============================================

export const getProducts = async (): Promise<ApiResponse<ProductDTO[]>> => {
  return apiClient.get<ApiResponse<ProductDTO[]>>('/catalog/products');
};

export const getProduct = async (id: string): Promise<ApiResponse<ProductDTO>> => {
  return apiClient.get<ApiResponse<ProductDTO>>(`/catalog/products/${id}`);
};

export const createProduct = async (data: CreateProductRequest): Promise<ApiResponse<ProductDTO>> => {
  return apiClient.post<ApiResponse<ProductDTO>>('/catalog/products', data);
};

export const updateProduct = async (id: string, data: UpdateProductRequest): Promise<ApiResponse<ProductDTO>> => {
  return apiClient.patch<ApiResponse<ProductDTO>>(`/catalog/products/${id}`, data);
};

export const deleteProduct = async (id: string): Promise<void> => {
  return apiClient.delete<void>(`/catalog/products/${id}`);
};

// ============================================
// Auth Token Management
// ============================================

export const clearToken = () => apiClient.clearToken();