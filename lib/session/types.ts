// ============================================
// SESSION STATE MACHINE - Strict Backend Contract
// Source: docs/FRONTEND_SESSION_AUTH_FLOW.md
// ============================================

import type { ApiResponse } from '../types';

// ============================================
// Session States (MUST match backend exactly)
export type SessionState =
  | 'NO_SESSION'       // No events exist for tenant
  | 'WAITING_QR'        // SESSION_AUTH_STARTED - QR ready
  | 'CONNECTING'        // SESSION_CONNECT_STARTED - waiting for scan
  | 'READY'             // SESSION_CONNECTED - fully connected
  | 'DISCONNECTED'      // SESSION_DISCONNECTED - was connected, lost
  | 'FAILED'            // SESSION_FAILED - connection failed
  | 'UNKNOWN';          // Any other/unrecognized event

// Polling intervals per state (in milliseconds)
export const POLL_INTERVALS: Record<SessionState, number | null> = {
  'NO_SESSION': 5000,
  'WAITING_QR': 2000,
  'CONNECTING': 2000,
  'READY': null,         // STOP polling
  'DISCONNECTED': 5000,
  'FAILED': null,        // STOP polling
  'UNKNOWN': 5000,
};

// ============================================
// Backend Response Types
export interface MySessionResponse {
  status: SessionState;
  lastEvent: string | null;
  qr?: string;
  timestamp?: string;
}

export interface SessionStateResponse {
  data: MySessionResponse;
}

// ============================================
// Event to State Mapping (from backend contract)
export const mapLastEventToState = (lastEvent: string | null): SessionState => {
  switch (lastEvent) {
    case null:
      return 'NO_SESSION';
    case 'SESSION_AUTH_STARTED':
      return 'WAITING_QR';
    case 'SESSION_CONNECT_STARTED':
      return 'CONNECTING';
    case 'SESSION_CONNECTED':
      return 'READY';
    case 'SESSION_FAILED':
      return 'FAILED';
    case 'SESSION_DISCONNECTED':
      return 'DISCONNECTED';
    default:
      return 'UNKNOWN';
  }
};

// ============================================
// Valid State Transitions
// This prevents invalid UI states
export const isValidTransition = (
  from: SessionState,
  to: SessionState
): boolean => {
  const validTransitions: Record<SessionState, SessionState[]> = {
    'NO_SESSION': ['WAITING_QR', 'FAILED'],
    'WAITING_QR': ['CONNECTING', 'FAILED', 'NO_SESSION'], // timeout can reset
    'CONNECTING': ['READY', 'FAILED', 'DISCONNECTED'],
    'READY': ['DISCONNECTED'],
    'DISCONNECTED': ['READY', 'FAILED', 'WAITING_QR', 'NO_SESSION'],
    'FAILED': ['WAITING_QR', 'NO_SESSION'], // can retry
    'UNKNOWN': ['NO_SESSION', 'WAITING_QR', 'CONNECTING', 'READY', 'FAILED', 'DISCONNECTED'],
  };

  return validTransitions[from].includes(to);
};

// ============================================
// State Descriptions for UI
export const SESSION_STATE_INFO: Record<SessionState, {
  title: string;
  description: string;
  action?: string;
}> = {
  'NO_SESSION': {
    title: 'Sin sesión',
    description: 'Conecta tu WhatsApp para comenzar',
    action: 'Conectar WhatsApp',
  },
  'WAITING_QR': {
    title: 'Escanea el código QR',
    description: 'Abre WhatsApp y escanea el código',
  },
  'CONNECTING': {
    title: 'Conectando...',
    description: 'Tu teléfono se está conectando',
  },
  'READY': {
    title: 'Conectado',
    description: 'Listo para recibir pedidos',
  },
  'DISCONNECTED': {
    title: 'Conexión perdida',
    description: 'La sesión se desconectó',
    action: 'Reconectar',
  },
  'FAILED': {
    title: 'Error de conexión',
    description: 'Hubo un problema al conectar',
    action: 'Reintentar',
  },
  'UNKNOWN': {
    title: 'Estado desconocido',
    description: 'Verificando conexión...',
  },
};