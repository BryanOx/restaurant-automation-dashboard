// ============================================
// Hooks index - Export all hooks
// ============================================

export { useMessages } from './useMessages';
export { useOrders, useCreateOrder, useUpdateOrderStatus } from './useOrders';
export { useOrderStats, type StatsPeriod } from './useOrderStats';
export { useSessionsHealth } from './useSessionsHealth';
export { useCustomers } from './useCustomers';
export { useDashboardMetrics } from './useDashboardMetrics';

// Catalog hooks
export { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './useCategories';
export { useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct } from './useProducts';