// ============================================
// useOrderStats - React Query hook for order statistics
// Cache Strategy: 1 min stale (event-derived)
// ============================================

import { useQuery } from '@tanstack/react-query';
import { getOrderStats } from '../api/endpoints';

export type StatsPeriod = 'day' | 'week' | 'month';

export const useOrderStats = (period: StatsPeriod = 'day') => {
  return useQuery({
    queryKey: ['orders', 'stats', period],
    queryFn: () => getOrderStats(period),
    staleTime: 60 * 1000, // 1 minute - event-derived
    refetchOnWindowFocus: false,
  });
};