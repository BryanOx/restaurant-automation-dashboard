// ============================================
// Badge Component - Status indicators
// ============================================

import React from 'react';
import { OrderStatus, SessionStatus } from '../../lib/types';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// Helper to get badge variant from status
export function getOrderStatusVariant(status: OrderStatus): BadgeProps['variant'] {
  switch (status) {
    case OrderStatus.PENDING:
      return 'warning';
    case OrderStatus.CONFIRMED:
      return 'info';
    case OrderStatus.IN_PREPARATION:
      return 'info';
    case OrderStatus.READY:
      return 'info';
    case OrderStatus.DELIVERED:
      return 'success';
    case OrderStatus.CANCELLED:
      return 'error';
    case OrderStatus.PAYMENT_PENDING:
      return 'warning';
    case OrderStatus.PAYMENT_CONFIRMED:
      return 'success';
    default:
      return 'default';
  }
}

export function getSessionStatusVariant(status: SessionStatus): BadgeProps['variant'] {
  switch (status) {
    case SessionStatus.READY:
      return 'success';
    case SessionStatus.FAILED:
      return 'error';
    case SessionStatus.DISCONNECTED:
      return 'warning';
    case SessionStatus.UNKNOWN:
      return 'default';
    default:
      return 'default';
  }
}