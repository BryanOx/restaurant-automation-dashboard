// ============================================
// useGroupedMessages - React Query hook for grouped messages
// Cache Strategy: 5 min stale (event-derived, eventual consistency)
// ============================================

import { useQuery } from '@tanstack/react-query';
import { getGroupedMessages } from '../api/endpoints';
import type { PaginationParams } from '../types';

export const useGroupedMessages = (params?: PaginationParams, enabled = true) => {
  return useQuery({
    queryKey: ['messages', 'grouped', params?.page, params?.limit],
    queryFn: () => getGroupedMessages(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - event-derived data
    refetchOnWindowFocus: false,
    enabled,
  });
};