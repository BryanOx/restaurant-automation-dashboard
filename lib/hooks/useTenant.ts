// ============================================
// useTenant - React Query hook for tenant settings
// Cache Strategy: 5 min stale
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTenant, updateTenant } from '../api/endpoints';
import type { UpdateTenantRequest } from '../types';

export const useTenant = (enabled = true) => {
  return useQuery({
    queryKey: ['tenant'],
    queryFn: () => getTenant(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTenantRequest) => updateTenant(data),
    onSuccess: () => {
      // Invalidate tenant query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
  });
};