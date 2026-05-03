'use client';

// ============================================
// Login Page
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    try {
      await login(email);
    } catch (err: unknown) {
      console.log('[Login] Caught error:', err);
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { 
          response?: { 
            status?: number; 
            data?: { message?: string } 
          } 
        };
        const status = axiosError.response?.status;
        const message = axiosError.response?.data?.message;
        
        console.log('[Login] HTTP status:', status);
        console.log('[Login] Response message:', message);
        
        if (status === 404) {
          setError('Email no encontrado. ¿Necesitas registrarte?');
        } else if (status === 401) {
          setError('Credenciales inválidas');
        } else if (status === 500) {
          setError('Error del servidor. Intenta más tarde.');
        } else if (message) {
          setError(message);
        } else {
          setError(`Error (${status}). Intenta de nuevo.`);
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        const msg = (err as { message: string }).message;
        console.log('[Login] Error message:', msg);
        if (msg.includes('Network Error') || msg.includes('ECONNREFUSED')) {
          setError('No se puede conectar al servidor. Verifica que el backend esté corriendo.');
        } else {
          setError(msg);
        }
      } else {
        setError('Error de conexión. Intenta de nuevo.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Restaurant Bot
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}