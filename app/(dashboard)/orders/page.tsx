'use client';

// ============================================
// Orders Page - Orders list + Stats summary
// ============================================

import { useState } from 'react';
import { Card, CardHeader, Pagination, Badge, getOrderStatusVariant } from '@/components/ui';
import { PageLoading, ErrorState, EmptyState } from '@/components/ui';
import { useOrders, useOrderStats, StatsPeriod, useUpdateOrderStatus, useCreateOrder } from '@/lib/hooks';
import { useAuth } from '@/lib/auth/AuthContext';
import { OrderDTO, OrderStatus, CreateOrderRequest, CreateOrderItem } from '@/lib/types';

// Get status label in Spanish
const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<string, string> = {
    [OrderStatus.PENDING]: 'Pendiente',
    [OrderStatus.CONFIRMED]: 'Confirmado',
    [OrderStatus.IN_PREPARATION]: 'En preparación',
    [OrderStatus.READY]: 'Listo',
    [OrderStatus.DELIVERED]: 'Entregado',
    [OrderStatus.CANCELLED]: 'Cancelado',
    [OrderStatus.PAYMENT_PENDING]: 'Pago pendiente',
    [OrderStatus.PAYMENT_CONFIRMED]: 'Pago confirmado',
  };
  return labels[status] || status;
};

// All status options for the dropdown
const allStatuses = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAYMENT_CONFIRMED,
];

function OrderItem({ order, onUpdateStatus }: { order: OrderDTO; onUpdateStatus: (id: string, status: OrderStatus) => void }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    await onUpdateStatus(order.id, newStatus);
    setIsUpdating(false);
  };

  return (
    <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
            <Badge variant={getOrderStatusVariant(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">Cliente: {order.customer?.name || order.customerId}</p>
          <p className="text-xs text-gray-400 mt-1">
            {order.items?.map(i => i.itemName).join(', ') || 'Sin items'} • {new Date(order.createdAt).toLocaleString('es-UY')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            ${order.totalAmount.toLocaleString('es-UY')}
          </p>
          {order.notes && (
            <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{order.notes}</p>
          )}
        </div>
      </div>
      {/* Status Update Dropdown */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
          disabled={isUpdating}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {allStatuses.map((status) => (
            <option key={status} value={status}>
              Cambiar a: {getStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function OrdersList({ orders, onUpdateStatus }: { orders: OrderDTO[]; onUpdateStatus: (id: string, status: OrderStatus) => void }) {
  if (!orders || orders.length === 0) {
    return <EmptyState title="Sin pedidos" message="No hay pedidos registrados" />;
  }

  return (
    <div className="divide-y divide-gray-100">
      {orders.map((order) => (
        <OrderItem key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
      ))}
    </div>
  );
}

function StatsSummary({ period }: { period: StatsPeriod }) {
  const { data, isLoading } = useOrderStats(period);

  if (isLoading || !data?.data) {
    return <div className="h-20 flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  const stats = data.data;
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-2xl font-bold text-blue-600">{stats.orderCount}</p>
        <p className="text-xs text-gray-500">Pedidos</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-green-600">${stats.revenue?.toLocaleString('es-UY') ?? '0'}</p>
        <p className="text-xs text-gray-500">Ingresos</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-purple-600">${stats.avgTicket?.toLocaleString('es-UY') ?? '0'}</p>
        <p className="text-xs text-gray-500">Promedio</p>
      </div>
    </div>
  );
}

// Create Order Modal
function CreateOrderModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrderRequest) => void;
  isSubmitting: boolean;
}) {
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreateOrderItem[]>([
    { itemName: '', quantity: 1, unitPrice: 0 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { itemName: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CreateOrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ customerId, notes: notes || undefined, items });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Pedido</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID del Cliente
            </label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese el ID del cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Agregar item
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2 items-start">
                <input
                  type="text"
                  value={item.itemName}
                  onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                  required
                  placeholder="Nombre del producto"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  required
                  min={1}
                  className="w-20 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  required
                  min={0}
                  step={0.01}
                  placeholder="Precio"
                  className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState<StatsPeriod>('day');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const limit = 20;

  // Mutations
  const updateStatusMutation = useUpdateOrderStatus();
  const createOrderMutation = useCreateOrder();

  // Wait for auth before making API calls
  const { data, isLoading, error, refetch } = useOrders({ page, limit }, !authLoading && isAuthenticated);

  // Show loading while checking auth
  if (authLoading) {
    return <PageLoading />;
  }

  // Redirect if not authenticated (after loading is done)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirigiendo al login...</p>
      </div>
    );
  }

  const orders = data?.data || [];
  const meta = data?.meta;
  const total = meta?.total || 0;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, data: { status } });
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Error al actualizar el estado del pedido');
    }
  };

  const handleCreateOrder = async (data: CreateOrderRequest) => {
    try {
      await createOrderMutation.mutateAsync(data);
      setShowCreateModal(false);
      alert('Pedido creado exitosamente');
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Error al crear el pedido');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500">Gestión de pedidos y órdenes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Pedido
        </button>
      </div>

      {/* Stats Summary */}
      <Card>
        <CardHeader title="Resumen" subtitle="Estadísticas del período" />
        <div className="mb-4 flex gap-2">
          {(['day', 'week', 'month'] as StatsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
        <StatsSummary period={period} />
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader title="Lista de Pedidos" subtitle={`${total} total`} />
        {isLoading ? (
          <PageLoading text="Cargando pedidos..." />
        ) : error ? (
          <ErrorState message="Error al cargar pedidos" onRetry={() => refetch()} />
        ) : (
          <>
            <OrdersList orders={orders} onUpdateStatus={handleUpdateStatus} />
            {meta && total > limit && (
              <Pagination
                page={page}
                total={total}
                limit={limit}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </Card>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateOrder}
        isSubmitting={createOrderMutation.isPending}
      />
    </div>
  );
}