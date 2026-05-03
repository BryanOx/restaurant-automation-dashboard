'use client';

// ============================================
// AuthGate - Wraps authenticated content
// ============================================

import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useSession } from '../session';
import { ConnectionManager, type SessionState } from '../session';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { state: sessionState, isLoading: sessionLoading } = useSession();

  // Handle authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Not logged in - redirect to login (handled by router in useEffect)
    return null;
  }

  // Authenticated - show connection manager if not READY
  const showConnectionManager = sessionState !== 'READY' && !sessionLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      
      {/* Connection overlay when not connected */}
      {showConnectionManager && (
        <ConnectionManager />
      )}
    </div>
  );
}

// ============================================
// Alternative: Session-only gate (for pages that need session but not auth)
interface SessionGateProps {
  children: React.ReactNode;
  requiredState?: SessionState[];
}

export function SessionGate({ 
  children, 
  requiredState = ['READY'] 
}: SessionGateProps) {
  const { state, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!requiredState.includes(state)) {
    return <ConnectionManager />;
  }

  return <>{children}</>;
}