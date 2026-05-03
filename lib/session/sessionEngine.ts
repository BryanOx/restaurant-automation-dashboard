// ============================================
// SESSION STATE ENGINE
// Deterministic state machine based on backend contract
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../api/apiClient';
import type { SessionState, MySessionResponse } from './types';
import { mapLastEventToState, POLL_INTERVALS } from './types';

// ============================================
// API Calls
const fetchMySession = async (): Promise<MySessionResponse> => {
  const response = await apiClient.get<{ data: MySessionResponse }>('/sessions/my');
  return response.data;
};

const startSession = async (): Promise<{ ok: boolean }> => {
  return apiClient.post<{ ok: boolean }>('/sessions/start');
};

// ============================================
// Session Engine Hook
interface UseSessionEngineOptions {
  onStateChange?: (state: SessionState) => void;
  enabled?: boolean;
}

export function useSessionEngine(options: UseSessionEngineOptions = {}) {
  const { onStateChange, enabled = true } = options;
  const queryClient = useQueryClient();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const currentStateRef = useRef<SessionState>('UNKNOWN');
  const qrStartTimeRef = useRef<number | null>(null);

  // Fetch session state - determines current state from backend
  const {
    data: sessionData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['session', 'my'],
    queryFn: fetchMySession,
    enabled,
    staleTime: 0, // Always fetch fresh
    retry: 1,
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: startSession,
    onSuccess: () => {
      // After starting, refetch to get new state
      refetch();
    },
  });

  // Determine current state from backend response
  const currentState = useCallback((): SessionState => {
    if (!sessionData) return 'UNKNOWN';
    
    // Backend sends status directly - use it
    return sessionData.status;
  }, [sessionData]);

  // Determine QR availability
  const qrCode = sessionData?.status === 'WAITING_QR' ? sessionData.qr : null;
  
  // Check QR timeout (60 seconds)
  const isQrExpired = useCallback((): boolean => {
    if (currentState() !== 'WAITING_QR') return false;
    if (!qrStartTimeRef.current) return false;
    return Date.now() - qrStartTimeRef.current > 60000;
  }, [currentState]);

  // Start tracking QR time when entering WAITING_QR
  useEffect(() => {
    const state = currentState();
    if (state === 'WAITING_QR' && !qrStartTimeRef.current) {
      qrStartTimeRef.current = Date.now();
    } else if (state !== 'WAITING_QR') {
      qrStartTimeRef.current = null;
    }
  }, [currentState]);

  // Notify state changes
  useEffect(() => {
    const state = currentState();
    if (state !== currentStateRef.current) {
      currentStateRef.current = state;
      onStateChange?.(state);
    }
  }, [currentState, onStateChange]);

  // ============================================
  // POLLING ENGINE
  // Dynamic intervals based on state
  useEffect(() => {
    if (!enabled) return;

    const scheduleNextPoll = () => {
      const state = currentState();
      const interval = POLL_INTERVALS[state];

      if (interval === null) {
        // STOP polling for READY/FAILED
        return;
      }

      pollingRef.current = setTimeout(() => {
        refetch().then(() => scheduleNextPoll());
      }, interval);
    };

    // Initial poll scheduled after first data
    if (sessionData) {
      scheduleNextPoll();
    }

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [enabled, sessionData, refetch, currentState]);

  // ============================================
  // Actions
  const connect = useCallback(async () => {
    // Reset QR timeout tracking
    qrStartTimeRef.current = null;
    await startSessionMutation.mutateAsync();
  }, [startSessionMutation]);

  const retry = connect;

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['session', 'my'] });
  }, [queryClient]);

  return {
    // State
    state: currentState(),
    qrCode,
    isQrExpired: isQrExpired(),
    isLoading,
    isError,
    error,
    lastEvent: sessionData?.lastEvent ?? null,
    timestamp: sessionData?.timestamp,

    // Actions
    connect,
    retry,
    refresh,
    refetch,

    // Mutation state
    isConnecting: startSessionMutation.isPending,
  };
}