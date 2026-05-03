'use client';

// ============================================
// Dashboard - Session State Machine with Polling Engine
// ============================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useDashboardMetrics } from '@/lib/hooks';
import { getMySession, startSession, clearToken } from '@/lib/api/endpoints';
import type { SessionUIState, OrderStatus, DashboardMetrics } from '@/lib/types';

// Helper to get status label in Spanish
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    IN_PREPARATION: 'En preparación',
    READY: 'Listo',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    PAYMENT_PENDING: 'Pago pendiente',
    PAYMENT_CONFIRMED: 'Pago confirmado',
  };
  return labels[status] || status;
};

// Helper to get color for status badge
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PREPARATION: 'bg-indigo-100 text-indigo-800',
    READY: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PAYMENT_PENDING: 'bg-orange-100 text-orange-800',
    PAYMENT_CONFIRMED: 'bg-teal-100 text-teal-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Polling intervals per state (in ms)
const POLL_INTERVALS: Record<SessionUIState, number | null> = {
  'NO_SESSION': 5000,
  'WAITING_QR': 2000,
  'CONNECTING': 2000,
  'READY': null,     // STOP polling
  'DISCONNECTED': 5000,
  'FAILED': null,    // STOP polling
  'UNKNOWN': 5000,
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, logout, tenant } = useAuth();

  const [sessionState, setSessionState] = useState<SessionUIState>('UNKNOWN');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrTimeout, setQrTimeout] = useState(false);

  // Fetch dashboard metrics when authenticated
  const { data: metricsData, isLoading: metricsLoading } = useDashboardMetrics(isAuthenticated);
  const metrics = metricsData?.data;
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const qrStartTimeRef = useRef<number | null>(null);

  // Manual redirect trigger - don't auto-redirect, show error instead
  useEffect(() => {
    console.log('[Dashboard] Auth check:', { isAuthenticated, authLoading });
  }, [isAuthenticated, authLoading]);

  // Show error if not authenticated instead of auto-redirect
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No autenticado</h1>
          <p className="text-gray-600 mb-4">Serás redirigido al login...</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Fetch session status
  const fetchSessionStatus = useCallback(async () => {
    try {
      console.log('[Dashboard] Fetching session status...');
      const response = await getMySession();
      console.log('[Dashboard] Session response:', JSON.stringify(response.data));
      const data = response.data;
      
      // Handle unknown statuses - map to valid UI states
      let resolvedStatus: SessionUIState = data.status as SessionUIState;
      const validStates: SessionUIState[] = ['NO_SESSION', 'WAITING_QR', 'CONNECTING', 'READY', 'DISCONNECTED', 'FAILED', 'UNKNOWN'];
      
      if (!validStates.includes(data.status)) {
        console.warn('[Dashboard] Unknown status from backend:', data.status, '- treating as NO_SESSION');
        resolvedStatus = 'NO_SESSION';
      } else if (data.status === 'UNKNOWN') {
        resolvedStatus = 'NO_SESSION';
      }
      
      console.log('[Dashboard] Backend status:', data.status, '→ Resolved:', resolvedStatus);
      setSessionState(resolvedStatus);
      
      // Handle QR code - only needed for WAITING_QR status
      if (resolvedStatus === 'READY') {
        console.log('[Dashboard] Status is READY - WhatsApp connected, no QR needed');
        setQrCode(null);
      } else if (data.qr) {
        setQrCode(data.qr);
        console.log('[Dashboard] QR code received, length:', data.qr.length);
      } else if (data.status === 'WAITING_QR') {
        // QR not yet generated - keep current
        console.log('[Dashboard] Status is WAITING_QR but no QR yet');
      } else {
        setQrCode(null);
      }

      // Handle QR timeout (60 seconds)
      if (data.status === 'WAITING_QR' && data.lastEvent === 'SESSION_AUTH_STARTED') {
        if (!qrStartTimeRef.current) {
          qrStartTimeRef.current = Date.now();
        } else if (Date.now() - qrStartTimeRef.current > 60000) {
          setQrTimeout(true);
        }
      } else {
        qrStartTimeRef.current = null;
        setQrTimeout(false);
      }

      return data.status;
    } catch (error: unknown) {
      console.error('[Dashboard] Error fetching session:', error);
      
      // Detailed error logging
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { status?: number; data?: unknown } 
        };
        console.error('[Dashboard] HTTP status:', axiosError.response?.status);
        console.error('[Dashboard] Response data:', axiosError.response?.data);
      }
      
      return sessionState;
    }
  }, [sessionState]);

  // Polling engine - separate effect
  useEffect(() => {
    const startPolling = async () => {
      const currentState = await fetchSessionStatus();
      const interval = POLL_INTERVALS[currentState];

      if (interval !== null) {
        pollingRef.current = setTimeout(startPolling, interval);
      }
    };

    if (isAuthenticated) {
      startPolling();
    }

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [isAuthenticated, fetchSessionStatus]);

  // Auto-start WhatsApp connection when no session exists (only once on initial load)
  // Uses a separate "initialized" state to ensure it only fires once
  const [autoStartDone, setAutoStartDone] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated && 
        (sessionState === 'NO_SESSION' || sessionState === 'DISCONNECTED') &&
        !autoStartDone) {
      setAutoStartDone(true); // Set FIRST before calling
      console.log('[Dashboard] Auto-starting WhatsApp connection...');
      handleConnect();
    }
  }, [isAuthenticated, sessionState, autoStartDone]);

  // Handle logout
  const handleLogout = useCallback(() => {
    console.log('[Dashboard] Logging out...');
    clearToken();
    router.push('/login');
  }, [router]);

  // Handle connect/start session (with guard against multiple calls)
  const handleConnect = async () => {
    // Prevent multiple simultaneous calls
    if (isConnecting) {
      console.log('[Dashboard] handleConnect ignored - already connecting');
      return;
    }
    
    // Don't start if we already have an active session
    if (sessionState === 'WAITING_QR' || sessionState === 'CONNECTING' || sessionState === 'READY') {
      console.log('[Dashboard] handleConnect ignored - session already exists:', sessionState);
      return;
    }
    
    console.log('[Dashboard] handleConnect clicked, current state:', sessionState);
    setIsConnecting(true);
    setQrTimeout(false);
    qrStartTimeRef.current = null;
    
    try {
      console.log('[Dashboard] Calling startSession API...');
      const result = await startSession();
      console.log('[Dashboard] startSession result:', result);
      // Polling will pick up the new state
    } catch (error: unknown) {
      console.error('[Dashboard] Error starting session:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('[Dashboard] startSession HTTP status:', axiosError.response?.status);
        console.error('[Dashboard] startSession response:', axiosError.response?.data);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render session-required states
  const renderSessionRequired = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Header with logout */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleLogout}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Bienvenido, {tenant?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Conecta tu WhatsApp para comenzar a recibir pedidos
        </p>
      </div>

      {/* NO_SESSION State */}
      {sessionState === 'NO_SESSION' && (
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            Haz clic en el botón para generar el código QR
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isConnecting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isConnecting ? 'Generando QR...' : 'Conectar WhatsApp'}
          </button>
        </div>
      )}

      {/* WAITING_QR State */}
      {sessionState === 'WAITING_QR' && (
        <div className="text-center">
          {qrCode ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Escanea el código QR
              </h2>
              <p className="text-gray-600 mb-6">
                Abre WhatsApp en tu teléfono y escanea este código
              </p>
              <img
                src={qrCode || undefined}
                alt="QR Code"
                className="w-64 h-64 mx-auto border-2 border-gray-200 rounded-lg"
              />
              <p className="mt-4 text-sm text-gray-500">
                El código se actualiza automáticamente
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Generando código QR...</p>
            </>
          )}

          {qrTimeout && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              <p className="font-medium">El código QR expiró</p>
              <button
                onClick={handleConnect}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Generar nuevo código
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONNECTING State */}
      {sessionState === 'CONNECTING' && (
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Conectando...
          </h2>
          <p className="text-gray-600 mb-6">
            Tu teléfono se está conectando. Esto puede tomar unos segundos.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            {isConnecting ? 'Conectando...' : 'Intentar de nuevo'}
          </button>
        </div>
      )}

      {/* FAILED State */}
      {sessionState === 'FAILED' && (
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error de conexión
          </h2>
          <p className="text-gray-600 mb-6">
            Hubo un problema al conectar con WhatsApp
          </p>
          <button
            onClick={handleConnect}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* DISCONNECTED State */}
      {sessionState === 'DISCONNECTED' && (
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Conexión perdida
          </h2>
          <p className="text-gray-600 mb-6">
            Tu sesión de WhatsApp se desconectó
          </p>
          <button
            onClick={handleConnect}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reconectar
          </button>
        </div>
      )}
    </div>
  );

  // Render full dashboard (READY state)
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {tenant?.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Conectado
          </span>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {metricsLoading || !metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Ingresos hoy</p>
              <p className="text-3xl font-bold text-green-600">
                ${metrics.revenue?.today?.toLocaleString('es-UY') ?? '0'}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Ingresos semana</p>
              <p className="text-3xl font-bold text-blue-600">
                ${metrics.revenue?.week?.toLocaleString('es-UY') ?? '0'}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Ingresos mes</p>
              <p className="text-3xl font-bold text-purple-600">
                ${metrics.revenue?.month?.toLocaleString('es-UY') ?? '0'}
              </p>
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos por Estado</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(metrics.ordersByStatus ?? {}).map(([status, count]) => (
                <span
                  key={status}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                >
                  {getStatusLabel(status)}: {count}
                </span>
              ))}
              {Object.keys(metrics.ordersByStatus ?? {}).length === 0 && (
                <p className="text-gray-500">No hay pedidos</p>
              )}
            </div>
          </div>

          {/* Avg Order Value */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Ticket promedio</p>
            <p className="text-3xl font-bold text-indigo-600">
              ${metrics.avgOrderValue?.toLocaleString('es-UY') ?? '0'}
            </p>
          </div>

          {/* Popular Products */}
          {(metrics.popularProducts?.length ?? 0) > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Populares</h3>
              <div className="space-y-2">
                {(metrics.popularProducts ?? []).slice(0, 5).map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">{product.productName}</span>
                    <span className="text-sm font-medium text-blue-600">
                      {product.totalQuantity} vendidos
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/orders" className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Pedidos</span>
          </div>
        </a>
        <a href="/messages" className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Mensajes</span>
          </div>
        </a>
        <a href="/customers" className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Clientes</span>
          </div>
        </a>
        <a href="/sessions" className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Sesiones</span>
          </div>
        </a>
      </div>
    </div>
  );

  // Show dashboard only when READY
  console.log('[Dashboard] Render decision - sessionState:', sessionState, '→', sessionState === 'READY' ? 'SHOW DASHBOARD' : 'SHOW SESSION REQUIRED');
  if (sessionState === 'READY') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {renderDashboard()}
      </div>
    );
  }

  // Show session required screen
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {renderSessionRequired()}
    </div>
  );
}