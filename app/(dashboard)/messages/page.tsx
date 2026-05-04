'use client';

// ============================================
// Messages Page - WhatsApp conversation history
// ============================================

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, PageLoading } from '@/components/ui';
import { ErrorState, EmptyState } from '@/components/ui';
import { useMessages, useTenant, useUpdateTenant } from '@/lib/hooks';
import { useAuth } from '@/lib/auth/AuthContext';
import { MessageDTO, ViewMode, SortMode } from '@/lib/types';

// localStorage keys
const STORAGE_KEYS = {
  viewMode: 'messages-view-mode',
  sortMode: 'messages-sort-mode',
} as const;

// Default values
const DEFAULT_VIEW_MODE: ViewMode = 'grouped';
const DEFAULT_SORT_MODE: SortMode = 'newest-first';

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

// Flat view message component - shows all messages in chronological list
function FlatMessageItem({ message }: { message: MessageDTO }) {
  const isFromMe = message.from === message.to; // Simplified: if from equals to, it's outgoing
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
          {message.from} → {message.to} • {isToday(message.timestamp) 
            ? new Date(message.timestamp).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
            : new Date(message.timestamp).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' }) + ' ' + new Date(message.timestamp).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
          }
        </div>
      </div>
    </div>
  );
}

// Toggle button component
function ToggleGroup({ options, value, onChange }: { 
  options: { value: string; label: string }[]; 
  value: string; 
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } ${index > 0 ? 'border-l border-gray-200' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, error, refetch } = useMessages({ page: 1, limit: 100 }, !authLoading && isAuthenticated);
  
  // Tenant (conversation engine toggle)
  const { data: tenantData } = useTenant(!authLoading && isAuthenticated);
  const updateTenant = useUpdateTenant();
  const conversationEnabled = tenantData?.data?.conversationEnabled ?? true;

  // State for view mode and sort mode
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT_MODE);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedViewMode = localStorage.getItem(STORAGE_KEYS.viewMode) as ViewMode | null;
      const savedSortMode = localStorage.getItem(STORAGE_KEYS.sortMode) as SortMode | null;
      
      if (savedViewMode && (savedViewMode === 'grouped' || savedViewMode === 'flat')) {
        setViewMode(savedViewMode);
      }
      if (savedSortMode && (savedSortMode === 'newest-first' || savedSortMode === 'oldest-first' || savedSortMode === 'by-contact')) {
        setSortMode(savedSortMode);
      }
    } catch {
      // localStorage unavailable - use defaults
    }
  }, []);

  // Save preferences to localStorage when they change
  const handleViewModeChange = (newMode: string) => {
    const mode = newMode as ViewMode;
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_KEYS.viewMode, mode);
    } catch {
      // localStorage unavailable - ignore
    }
  };

  const handleSortModeChange = (newMode: string) => {
    const mode = newMode as SortMode;
    setSortMode(mode);
    try {
      localStorage.setItem(STORAGE_KEYS.sortMode, mode);
    } catch {
      // localStorage unavailable - ignore
    }
  };

  // Handle conversation engine toggle
  const handleToggleConversation = async (enabled: boolean) => {
    try {
      await updateTenant.mutateAsync({ conversationEnabled: enabled });
    } catch (err) {
      console.error('Failed to toggle conversation engine:', err);
    }
  };

  if (authLoading) return <PageLoading />;
  if (!isAuthenticated) return <div className="p-4">Redirigiendo al login...</div>;

  const allMessages = data?.data?.messages || [];
  
  // Sort messages based on sortMode
  const sortedMessages = useMemo(() => {
    if (allMessages.length === 0) return [];
    
    const messagesCopy = [...allMessages];
    
    switch (sortMode) {
      case 'newest-first':
        return messagesCopy.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      case 'oldest-first':
        return messagesCopy.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      case 'by-contact':
        return messagesCopy.sort((a, b) => {
          const contactA = a.from || a.to || '';
          const contactB = b.from || b.to || '';
          return contactA.localeCompare(contactB);
        });
      default:
        return messagesCopy;
    }
  }, [allMessages, sortMode]);

  // Group messages by phone (for grouped view)
  const grouped = useMemo(() => {
    if (sortedMessages.length === 0) return {};
    
    return sortedMessages.reduce((acc: Record<string, MessageDTO[]>, msg) => {
      const key = msg.from || msg.to;
      if (!acc[key]) acc[key] = [];
      acc[key].push(msg);
      // Sort by timestamp within each group
      acc[key].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return acc;
    }, {});
  }, [sortedMessages]);

  const conversations = Object.entries(grouped);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500">Historial de conversaciones de WhatsApp</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Conversation Engine Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Bot:</span>
          <button
            onClick={() => handleToggleConversation(!conversationEnabled)}
            disabled={updateTenant.isPending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              conversationEnabled ? 'bg-green-600' : 'bg-gray-300'
            } ${updateTenant.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                conversationEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-xs font-medium ${conversationEnabled ? 'text-green-700' : 'text-gray-500'}`}>
            {conversationEnabled ? 'Activo' : 'Desactivado'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ver:</span>
          <ToggleGroup
            options={[
              { value: 'grouped', label: 'Agrupado' },
              { value: 'flat', label: 'Todos' },
            ]}
            value={viewMode}
            onChange={handleViewModeChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ordenar:</span>
          <ToggleGroup
            options={[
              { value: 'newest-first', label: 'Más recientes' },
              { value: 'oldest-first', label: 'Más antiguos' },
              { value: 'by-contact', label: 'Por contacto' },
            ]}
            value={sortMode}
            onChange={handleSortModeChange}
          />
        </div>
      </div>

      <Card>
        <CardHeader 
          title={viewMode === 'grouped' ? 'Conversaciones' : 'Todos los mensajes'} 
          subtitle={viewMode === 'grouped' 
            ? `${conversations.length} conversaciones` 
            : `${sortedMessages.length} mensajes`
          } 
        />
        {isLoading ? (
          <PageLoading text="Cargando mensajes..." />
        ) : error ? (
          <ErrorState message="Error al cargar mensajes" onRetry={() => refetch()} />
        ) : viewMode === 'grouped' ? (
          conversations.length === 0 ? (
            <EmptyState title="Sin mensajes" message="No hay mensajes registrados" />
          ) : (
            <div>
              {conversations.map(([phone, msgs]) => (
                <MessageGroup key={phone} phone={phone} messages={msgs} />
              ))}
            </div>
          )
        ) : (
          // Flat view - all messages in chronological list
          sortedMessages.length === 0 ? (
            <EmptyState title="Sin mensajes" message="No hay mensajes registrados" />
          ) : (
            <div className="p-4">
              {sortedMessages.map((message, index) => (
                <FlatMessageItem key={`${message.timestamp}-${index}`} message={message} />
              ))}
            </div>
          )
        )}
      </Card>
    </div>
  );
}