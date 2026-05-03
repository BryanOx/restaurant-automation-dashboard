// ============================================
// SESSION UI COMPONENTS - State-driven, no manual API calls
// ============================================

import { useSession } from './SessionContext';
import { SESSION_STATE_INFO, type SessionState } from './types';

// ============================================
// SessionStatus - Shows current state badge
export function SessionStatus() {
  const { state } = useSession();
  const info = SESSION_STATE_INFO[state];

  const variant: Record<SessionState, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    'READY': 'success',
    'WAITING_QR': 'info',
    'CONNECTING': 'warning',
    'NO_SESSION': 'neutral',
    'DISCONNECTED': 'warning',
    'FAILED': 'error',
    'UNKNOWN': 'neutral',
  };

  const colors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[variant[state]]}`}>
      {state === 'READY' && (
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
      )}
      {info.title}
    </span>
  );
}

// ============================================
// QRCodePanel - Shows QR when in WAITING_QR state
export function QRCodePanel() {
  const { state, qrCode, isQrExpired, retry, isConnecting } = useSession();

  if (state !== 'WAITING_QR') return null;

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Escanea el código QR
      </h3>
      
      {qrCode ? (
        <>
          <img
            src={`data:image/png;base64,${qrCode}`}
            alt="QR Code"
            className="w-64 h-64 mx-auto border-2 border-gray-200 rounded-lg"
          />
          <p className="mt-4 text-sm text-gray-500">
            Abre WhatsApp en tu teléfono y escanea este código
          </p>
        </>
      ) : (
        <div className="py-8">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Generando código QR...</p>
        </div>
      )}

      {isQrExpired && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">El código QR expiró</p>
          <button
            onClick={retry}
            disabled={isConnecting}
            className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
          >
            Generar nuevo código
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// ConnectionManager - Main connection UI based on state
export function ConnectionManager() {
  const { state, connect, retry, isConnecting, error } = useSession();
  const info = SESSION_STATE_INFO[state];

  // Don't show if connected
  if (state === 'READY') return null;

  const handleAction = () => {
    if (state === 'NO_SESSION' || state === 'FAILED' || state === 'DISCONNECTED') {
      connect();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Icon based on state */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
        state === 'NO_SESSION' ? 'bg-blue-100' :
        state === 'WAITING_QR' ? 'bg-blue-100' :
        state === 'CONNECTING' ? 'bg-yellow-100' :
        state === 'FAILED' ? 'bg-red-100' :
        state === 'DISCONNECTED' ? 'bg-yellow-100' :
        'bg-gray-100'
      }`}>
        {state === 'CONNECTING' && (
          <div className="w-10 h-10 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        )}
        {state === 'FAILED' && (
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {state === 'DISCONNECTED' && (
          <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
        )}
        {state === 'NO_SESSION' && (
          <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {info.title}
      </h2>
      
      {/* Description */}
      <p className="text-gray-600 text-center mb-4 max-w-md">
        {info.description}
      </p>

      {/* Action button */}
      {info.action && (
        <button
          onClick={handleAction}
          disabled={isConnecting || state === 'CONNECTING'}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isConnecting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isConnecting ? 'Procesando...' : info.action}
        </button>
      )}

      {/* Error display */}
      {isConnecting && state !== 'CONNECTING' && (
        <p className="mt-2 text-sm text-gray-500">
          Iniciando conexión...
        </p>
      )}

      {/* Show QR panel when waiting */}
      <QRCodePanel />
    </div>
  );
}