'use client';

// Debug page to check auth state

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/apiClient';

export default function DebugPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tenant, setTenant] = useState<unknown>(null);
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    console.log('[Debug] Checking...');
    const t = apiClient.getToken();
    const ta = apiClient.getTenant();
    
    console.log('[Debug] Token:', t ? `present (${t.length})` : 'null');
    console.log('[Debug] Tenant:', ta);
    
    setToken(t);
    setTenant(ta);
    setStatus(t ? 'authenticated' : 'not authenticated');
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Auth State</h1>
      <div className="space-y-2">
        <p>Status: <strong>{status}</strong></p>
        <p>Token: {token ? `Present (${token.substring(0, 20)}...)` : 'NULL'}</p>
        <p>Tenant: {tenant ? JSON.stringify(tenant) : 'NULL'}</p>
      </div>
      
      <button 
        onClick={() => apiClient.setToken('test-token-123')}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Set Test Token
      </button>
    </div>
  );
}