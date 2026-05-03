'use client';

// ============================================
// Messages Page - WhatsApp conversation history
// ============================================

import { useState } from 'react';
import { Card, CardHeader, PageLoading } from '@/components/ui';
import { ErrorState, EmptyState } from '@/components/ui';
import { useMessages } from '@/lib/hooks';
import { useAuth } from '@/lib/auth/AuthContext';
import { MessageDTO } from '@/lib/types';

function MessageBubble({ message, isFromMe }: { message: MessageDTO; isFromMe: boolean }) {
  const isToday = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${
        isFromMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <p className="text-sm">{message.message}</p>
        <div className={`text-xs mt-1 ${isFromMe ? 'text-blue-100' : 'text-gray-500'}`}>
          {message.from} • {isToday(message.timestamp) 
            ? new Date(message.timestamp).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
            : new Date(message.timestamp).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' }) + ' ' + new Date(message.timestamp).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
          }
        </div>
      </div>
    </div>
  );
}

function MessageGroup({ phone, messages }: { phone: string; messages: MessageDTO[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? messages : messages.slice(-3);
  const myPhone = messages[0]?.to || '';

  return (
    <div className="border-b border-gray-100">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left hover:bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-900">{phone}</p>
            <p className="text-sm text-gray-500 truncate">{messages[messages.length - 1]?.message}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{messages.length} mensajes</p>
            <p className="text-xs text-gray-400">{new Date(messages[messages.length - 1]?.timestamp).toLocaleDateString('es-UY')}</p>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          {displayed.map((m, i) => (
            <MessageBubble key={i} message={m} isFromMe={m.from === myPhone} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, error, refetch } = useMessages({ page: 1, limit: 100 }, !authLoading && isAuthenticated);

  if (authLoading) return <PageLoading />;
  if (!isAuthenticated) return <div className="p-4">Redirigiendo al login...</div>;

  const messages = data?.data?.messages || [];
  
  // Group by phone number
  const grouped = messages.reduce((acc: Record<string, MessageDTO[]>, msg) => {
    const key = msg.from || msg.to;
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    // Sort by timestamp within each group
    acc[key].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return acc;
  }, {});

  const conversations = Object.entries(grouped);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500">Historial de conversaciones de WhatsApp</p>
      </div>

      <Card>
        <CardHeader title="Conversaciones" subtitle={`${conversations.length} conversaciones`} />
        {isLoading ? (
          <PageLoading text="Cargando mensajes..." />
        ) : error ? (
          <ErrorState message="Error al cargar mensajes" onRetry={() => refetch()} />
        ) : conversations.length === 0 ? (
          <EmptyState title="Sin mensajes" message="No hay mensajes registrados" />
        ) : (
          <div>
            {conversations.map(([phone, msgs]) => (
              <MessageGroup key={phone} phone={phone} messages={msgs} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}