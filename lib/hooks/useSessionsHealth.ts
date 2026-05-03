// ============================================
// useSessionsHealth - React Query hook for session status
// Cache Strategy: 30 sec stale (event-derived)
// ============================================

import { useQuery } from '@tanstack/react-query';
import { getSessionsHealth } from '../api/endpoints';

export const useSessionsHealth = () => {
  return useQuery({
    queryKey: ['sessions', 'health'],
    queryFn: getSessionsHealth,
    staleTime: 30 * 1000, // 30 seconds - event-derived
    refetchOnWindowFocus: false,
    // Poll more frequently for reconnection states
    refetchInterval: (query) => {
      const data = query.state.data?.data;
      const hasDisconnected = data?.tenants?.some(
        (t) => t.status === 'DISCONNECTED'
      );
      return hasDisconnected ? 5000 : false; // Poll every 5s if disconnected
    },
  });
};