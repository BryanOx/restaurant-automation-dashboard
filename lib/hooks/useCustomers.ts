// ============================================
// useCustomers - React Query hook for customers
// Cache Strategy: 5 min stale (SQL source, strong consistency)
// ============================================

import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../api/endpoints';

export const useCustomers = (includeInactive?: boolean, enabled = true) => {
  return useQuery({
    queryKey: ['customers', includeInactive],
    queryFn: () => getCustomers(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes - SQL source
    refetchOnWindowFocus: false,
    enabled,
  });
};