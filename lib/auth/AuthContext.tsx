'use client';

// ============================================
// Auth Context - JWT management with sessionStorage
// Uses sessionStorage (not localStorage) for SSR compatibility
// sessionStorage persists per tab, clears when tab closes
// ============================================

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { registerTenant, loginTenant } from '../api/endpoints';
import type { AuthResponse } from '../types';
import { apiClient } from '../api/apiClient';

const SESSION_TOKEN_KEY = 'auth_token';
const SESSION_TENANT_KEY = 'auth_tenant';

interface Tenant {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  tenant: Tenant | null;
  login: (email: string) => Promise<void>;
  register: (tenantName: string, email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Handle auth success - separate function
const handleAuthSuccess = (
  response: AuthResponse,
  setAuthenticated: (v: boolean) => void,
  setTenant: (v: Tenant | null) => void,
  setLoading: (v: boolean) => void
) => {
  console.log('[Auth] Setting token, length:', response.accessToken.length);
  
  // Save to sessionStorage (persists across navigation, clears on tab close)
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, response.accessToken);
    sessionStorage.setItem(SESSION_TENANT_KEY, JSON.stringify(response.tenant));
    console.log('[Auth] Saved to sessionStorage');
  } catch (e) {
    console.error('[Auth] Failed to save to sessionStorage:', e);
  }
  
  // Also set in-memory for current request
  apiClient.setToken(response.accessToken);
  apiClient.setTenant(response.tenant);
  
  // Verify token was stored
  const storedToken = apiClient.getToken();
  console.log('[Auth] Token stored, verified:', storedToken ? 'YES' : 'NO');
  
  setAuthenticated(true);
  setTenant(response.tenant);
  setLoading(false);
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  
  // Initialize with false, then check on client mount
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check token on client-side mount - reads from sessionStorage for SSR compatibility
  useEffect(() => {
    console.log('[Auth] Client mount - checking token');
    
    // First check in-memory (fast path for client-side navigation)
    let token = apiClient.getToken();
    let savedTenant = apiClient.getTenant();
    
    // If not in memory, try sessionStorage (for SSR/page refresh)
    if (!token) {
      console.log('[Auth] Token not in memory, checking sessionStorage...');
      try {
        const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
        const storedTenantStr = sessionStorage.getItem(SESSION_TENANT_KEY);
        
        if (storedToken && storedTenantStr) {
          token = storedToken;
          const parsedTenant = JSON.parse(storedTenantStr) as Tenant;
          
          // Restore to in-memory for API calls
          apiClient.setToken(token);
          if (parsedTenant) {
            apiClient.setTenant(parsedTenant);
            savedTenant = parsedTenant;
          }
          console.log('[Auth] Restored token from sessionStorage');
        }
      } catch (e) {
        console.error('[Auth] Failed to read sessionStorage:', e);
      }
    }
    
    console.log('[Auth] Client mount - token found:', !!token, 'tenant:', !!savedTenant);
    
    if (token && savedTenant) {
      setIsAuthenticated(true);
      setTenant(savedTenant);
    }
    setIsLoading(false);
    console.log('[Auth] Auth check complete - isLoading:', false, 'isAuthenticated:', !!token);
  }, []);

  const login = useCallback(async (email: string) => {
    console.log('[Auth] Login attempt:', email);
    setIsLoading(true);
    try {
      const response = await loginTenant({ email });
      console.log('[Auth] Login success, tenant:', response.tenant.name);
      handleAuthSuccess(response, setIsAuthenticated, setTenant, setIsLoading);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('[Auth] Login error:', error);
      setIsLoading(false);
      // Log detailed error info
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('[Auth] Response status:', axiosError.response?.status);
        console.error('[Auth] Response data:', axiosError.response?.data);
      } else if (error && typeof error === 'object' && 'message' in error) {
        console.error('[Auth] Error message:', (error as { message: string }).message);
      }
      throw error;
    }
  }, [router]);

  const register = useCallback(async (tenantName: string, email: string) => {
    console.log('[Auth] Register attempt:', { tenantName, email });
    setIsLoading(true);
    try {
      const response = await registerTenant({ tenantName, email });
      console.log('[Auth] Register success, tenant:', response.tenant.name);
      handleAuthSuccess(response, setIsAuthenticated, setTenant, setIsLoading);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('[Auth] Register error:', error);
      setIsLoading(false);
      // Log detailed error info
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('[Auth] Response status:', axiosError.response?.status);
        console.error('[Auth] Response data:', axiosError.response?.data);
      } else if (error && typeof error === 'object' && 'message' in error) {
        console.error('[Auth] Error message:', (error as { message: string }).message);
      }
      throw error;
    }
  }, [router]);

  const logout = useCallback(() => {
    // Clear both in-memory and sessionStorage
    apiClient.clearToken();
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_TENANT_KEY);
    } catch (e) {
      console.error('[Auth] Failed to clear sessionStorage:', e);
    }
    setIsAuthenticated(false);
    setTenant(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        tenant,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}