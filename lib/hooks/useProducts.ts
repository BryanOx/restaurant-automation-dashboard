// ============================================
// useProducts - React Query hook for catalog products
// Cache Strategy: 5 min stale (manual management)
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../api/endpoints';
import type { CreateProductRequest, UpdateProductRequest } from '../types';

export const useProducts = (enabled = true) => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });
};

export const useProduct = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: enabled && !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) => 
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};