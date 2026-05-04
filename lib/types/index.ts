// ============================================
// TypeScript types from Backend Source of Truth
// DO NOT modify structure - matches backend contracts exactly
// ============================================

// ============================================
// Global Response Contract
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ============================================
// Enums
// ============================================

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED'
}

export enum SessionStatus {
  READY = 'READY',
  FAILED = 'FAILED',
  DISCONNECTED = 'DISCONNECTED',
  UNKNOWN = 'UNKNOWN'
}

// Session UI States (from FRONTEND_SESSION_AUTH_FLOW.md)
export type SessionUIState =
  | 'NO_SESSION'
  | 'WAITING_QR'
  | 'CONNECTING'
  | 'READY'
  | 'DISCONNECTED'
  | 'FAILED'
  | 'UNKNOWN';

// Messages Page View Modes
export type ViewMode = 'grouped' | 'flat';

// Messages Page Sort Options
export type SortMode = 'newest-first' | 'oldest-first' | 'by-contact';

// Messages Page User Preferences
export interface MessagePreferences {
  viewMode: ViewMode;
  sortMode: SortMode;
}

// ============================================
// DTOs from Endpoints
// ============================================

// Auth
export interface AuthRegisterRequest {
  tenantName: string;
  email: string;
}

export interface AuthLoginRequest {
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
}

// Alias for backwards compatibility
export type AuthRegisterResponse = AuthResponse;

// Messages (GET /messages)
export interface MessageDTO {
  from: string;
  to: string;
  message: string;
  timestamp: string; // ISO 8601
}

export interface MessagesResponse {
  messages: MessageDTO[];
}

// Orders (GET /orders)
export interface OrderItemDTO {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderDTO {
  id: string;
  tenantId: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  items: OrderItemDTO[];
  customer: {
    id: string;
    name: string;
  };
}

// Order Stats (GET /orders/summary)
export interface OrderStatsDTO {
  orderCount: number;
  revenue: number;
  avgTicket: number;
}

// Dashboard Metrics (GET /orders/dashboard)
export interface PopularProduct {
  productName: string;
  totalQuantity: number;
}

export interface DashboardMetrics {
  ordersByStatus: Record<string, number>;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  avgOrderValue: number;
  popularProducts: PopularProduct[];
}

// Update Order Status (PATCH /orders/:id/status)
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// Session Health (GET /sessions/health)
export interface TenantSessionStatus {
  tenantId: string;
  status: SessionStatus;
  lastEvent: string | null;
  timestamp: string | null;
}

export interface HealthResponse {
  tenants: TenantSessionStatus[];
}

// My Session (GET /sessions/my) - from FRONTEND_SESSION_AUTH_FLOW.md
export interface MySessionResponse {
  status: SessionUIState;
  lastEvent: string | null;
  qr?: string;
  timestamp?: string;
}

// Customers (GET /customers)
export interface CustomerDTO {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Create Order (POST /orders)
export interface CreateOrderItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderRequest {
  customerId: string;
  notes?: string;
  items: CreateOrderItem[];
}

// ============================================
// Pagination
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// ============================================
// API Error
// ============================================

export interface ApiError {
  message: string;
  statusCode: number;
}

// ============================================
// Catalog - Products & Categories
// ============================================

// Category (GET /catalog/categories, POST /catalog/categories)
export interface CategoryDTO {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
}

// Product (GET /catalog/products, POST /catalog/products)
export interface ProductDTO {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  aliases?: string[];
  categoryId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  aliases?: string[];
  categoryId?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  aliases?: string[];
  categoryId?: string;
  isActive?: boolean;
}

// ============================================
// Tenant (GET /tenants/:id, PATCH /tenants/:id)
// ============================================

export interface TenantDTO {
  id: string;
  name: string;
  email: string;
  conversationEnabled: boolean;
  createdAt: string;
}

export interface UpdateTenantRequest {
  conversationEnabled: boolean;
}

// ============================================
// Bot Reply (POST /bot/incoming)
// ============================================

export type BotState = 'START' | 'MENU' | 'SELECT_ITEM' | 'CONFIRM' | 'COMPLETED' | 'IDLE';

export interface BotReply {
  reply: string;
  language: 'es' | 'en';
  state: BotState;
}