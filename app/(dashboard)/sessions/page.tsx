'use client';

// ============================================
// Sessions Page - Tenant session status
// ============================================

import { Card, CardHeader, Badge, getSessionStatusVariant } from '@/components/ui';
import { PageLoading, ErrorState, EmptyState } from '@/components/ui';
import { useSessionsHealth } from '@/lib/hooks';
import { TenantSessionStatus } from '@/lib/types';

function SessionRow({ session }: { session: TenantSessionStatus }) {
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'READY':
        return 'Conectado y funcionando';
      case 'FAILED':
        return 'Error de conexión';
      case 'DISCONNECTED':
        return 'Desconectado - intentando reconectar';
      case 'UNKNOWN':
        return 'Estado desconocido';
      default:
        return status;
    }
  };

  return (
    <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <p className="text-sm font-mono font-medium text-gray-900">{session.tenantId}</p>
            <Badge variant={getSessionStatusVariant(session.status)}>
              {session.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">{getStatusDescription(session.status)}</p>
          {session.lastEvent && (
            <p className="text-xs text-gray-400 mt-2">
              Último evento: <span className="font-mono">{session.lastEvent}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            {session.timestamp
              ? `Actualizado: ${new Date(session.timestamp).toLocaleString('es-UY')}`
              : 'Sin datos'}
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionsList({ sessions }: { sessions: TenantSessionStatus[] }) {
  if (!sessions || sessions.length === 0) {
    return <EmptyState title="Sin sesiones" message="No hay sesiones de WhatsApp registradas" />;
  }

  return (
    <div className="divide-y divide-gray-100">
      {sessions.map((session) => (
        <SessionRow key={session.tenantId} session={session} />
      ))}
    </div>
  );
}

function StatusSummary({ sessions }: { sessions: TenantSessionStatus[] }) {
  const counts = {
    READY: 0,
    FAILED: 0,
    DISCONNECTED: 0,
    UNKNOWN: 0,
  };

  sessions?.forEach((s) => {
    counts[s.status] = (counts[s.status] || 0) + 1;
  });

  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      <div className="p-3 bg-green-50 rounded-lg">
        <p className="text-2xl font-bold text-green-600">{counts.READY}</p>
        <p className="text-xs text-green-700">Conectados</p>
      </div>
      <div className="p-3 bg-red-50 rounded-lg">
        <p className="text-2xl font-bold text-red-600">{counts.FAILED}</p>
        <p className="text-xs text-red-700">Fallidos</p>
      </div>
      <div className="p-3 bg-yellow-50 rounded-lg">
        <p className="text-2xl font-bold text-yellow-600">{counts.DISCONNECTED}</p>
        <p className="text-xs text-yellow-700">Desconectados</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-2xl font-bold text-gray-600">{counts.UNKNOWN}</p>
        <p className="text-xs text-gray-700">Desconocidos</p>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { data, isLoading, error, refetch } = useSessionsHealth();

  const sessions = data?.data?.tenants || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sesiones</h1>
        <p className="text-sm text-gray-500">Estado de conexiones WhatsApp de cada tenant</p>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader title="Resumen de Estado" subtitle="Cuentas por estado de conexión" />
        <StatusSummary sessions={sessions} />
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader title="Detalle de Sesiones" subtitle={`${sessions.length} tenants`} />
        {isLoading ? (
          <PageLoading text="Cargando sesiones..." />
        ) : error ? (
          <ErrorState message="Error al cargar sesiones" onRetry={() => refetch()} />
        ) : (
          <SessionsList sessions={sessions} />
        )}
      </Card>
    </div>
  );
}