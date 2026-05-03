'use client';

// ============================================
// Customers Page - Customer list
// ============================================

import { useState } from 'react';
import { Card, CardHeader, Badge } from '@/components/ui';
import { PageLoading, ErrorState, EmptyState } from '@/components/ui';
import { useCustomers } from '@/lib/hooks';
import { useAuth } from '@/lib/auth/AuthContext';
import { CustomerDTO } from '@/lib/types';

function CustomerRow({ customer }: { customer: CustomerDTO }) {
  return (
    <div className="p-4 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{customer.name}</p>
          <Badge variant={customer.isActive ? 'success' : 'default'}>
            {customer.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          📱 {customer.phone}
          {customer.email && ` • 📧 ${customer.email}`}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Desde: {new Date(customer.createdAt).toLocaleDateString('es-UY')}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400 font-mono">#{customer.id.slice(0, 8)}</p>
      </div>
    </div>
  );
}

function CustomersList({ customers }: { customers: CustomerDTO[] }) {
  if (!customers || customers.length === 0) {
    return <EmptyState title="Sin clientes" message="No hay clientes registrados" />;
  }

  return (
    <div className="divide-y divide-gray-100">
      {customers.map((customer) => (
        <CustomerRow key={customer.id} customer={customer} />
      ))}
    </div>
  );
}

export default function CustomersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [includeInactive, setIncludeInactive] = useState(false);

  // Wait for auth before making API calls
  const { data, isLoading, error, refetch } = useCustomers(includeInactive, !authLoading && isAuthenticated);

  // Show loading while checking auth
  if (authLoading) {
    return <PageLoading />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirigiendo al login...</p>
      </div>
    );
  }

  const customers = data?.data || [];
  const meta = data?.meta;
  const total = meta?.total || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">Gestión de clientes registrados</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Incluir inactivos
        </label>
      </div>

      {/* Customers List */}
      <Card>
        <CardHeader title="Lista de Clientes" subtitle={`${total} clientes`} />
        {isLoading ? (
          <PageLoading text="Cargando clientes..." />
        ) : error ? (
          <ErrorState message="Error al cargar clientes" onRetry={() => refetch()} />
        ) : (
          <CustomersList customers={customers} />
        )}
      </Card>
    </div>
  );
}