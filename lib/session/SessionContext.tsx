// ============================================
// SESSION CONTEXT - Provides session engine to all components
// ============================================

import { createContext, useContext, type ReactNode } from 'react';
import { useSessionEngine } from './sessionEngine';
import type { SessionState } from './types';

interface SessionContextValue {
  state: SessionState;
  qrCode: string | null;
  isQrExpired: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  lastEvent: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  retry: () => Promise<void>;
  refresh: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  onStateChange?: (state: SessionState) => void;
  enabled?: boolean;
}

export function SessionProvider({ 
  children, 
  onStateChange,
  enabled = true 
}: SessionProviderProps) {
  const session = useSessionEngine({ onStateChange, enabled });

  return (
    <SessionContext.Provider value={{ ...session, qrCode: session.qrCode ?? null }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}