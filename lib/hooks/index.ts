// ============================================
// Hooks index - Export all hooks
// ============================================

export { useMessages, useGroupedMessages } from './useMessages';
export { useOrders, useCreateOrder, useUpdateOrderStatus } from './useOrders';
export { useOrderStats, type StatsPeriod } from './useOrderStats';
export { useSessionsHealth } from './useSessionsHealth';
export { useCustomers } from './useCustomers';
export { useDashboardMetrics } from './useDashboardMetrics';
export { useTenant, useUpdateTenant } from './useTenant';

// Catalog hooks
export { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './useCategories';
export { useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct } from './useProducts';