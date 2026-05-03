// ============================================
// useDashboardMetrics - React Query hook for dashboard metrics
// Cache Strategy: 1 min stale (aggregated SQL queries)
// ============================================

import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '../api/endpoints';

export const useDashboardMetrics = (enabled = true) => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => getDashboardMetrics(),
    staleTime: 60 * 1000, // 1 minute - aggregated data
    refetchOnWindowFocus: false,
    enabled,
  });
};