// ============================================
// useOrders - React Query hook for orders
// Cache Strategy: 2 min stale (SQL source, strong consistency)
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, createOrder as apiCreateOrder, updateOrderStatus as apiUpdateOrderStatus } from '../api/endpoints';
import type { PaginationParams, CreateOrderRequest, UpdateOrderStatusRequest, OrderDTO } from '../types';

export const useOrders = (params?: PaginationParams, enabled = true) => {
  return useQuery({
    queryKey: ['orders', params?.page, params?.limit],
    queryFn: () => getOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minutes - SQL source
    refetchOnWindowFocus: false,
    enabled,
  });
};

// Mutation: Create Order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => apiCreateOrder(data),
    onSuccess: () => {
      // Invalidate orders list to reflect new order
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Mutation: Update Order Status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusRequest }) =>
      apiUpdateOrderStatus(id, data),
    onSuccess: () => {
      // Invalidate orders list to reflect status change
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};