import { useState, useEffect, useCallback } from 'react';

interface NetworkError {
  type: 'CONNECTION' | 'TIMEOUT' | 'SERVER' | 'AUTH' | 'UNKNOWN';
  message: string;
  timestamp: number;
  retryable: boolean;
}

export const useNetworkError = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastError, setLastError] = useState<NetworkError | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNetworkError = useCallback((error: any): NetworkError => {
    let networkError: NetworkError = {
      type: 'UNKNOWN',
      message: 'Un error inesperado ha ocurrido',
      timestamp: Date.now(),
      retryable: true
    };

    if (!navigator.onLine) {
      networkError = {
        type: 'CONNECTION',
        message: 'Sin conexión a internet. Por favor, verifica tu conexión.',
        timestamp: Date.now(),
        retryable: true
      };
    } else if (error.name === 'AbortError') {
      networkError = {
        type: 'TIMEOUT',
        message: 'La solicitud tomó demasiado tiempo. Por favor, inténtalo de nuevo.',
        timestamp: Date.now(),
        retryable: true
      };
    } else if (error.response?.status === 401) {
      networkError = {
        type: 'AUTH',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        timestamp: Date.now(),
        retryable: false
      };
    } else if (error.response?.status >= 500) {
      networkError = {
        type: 'SERVER',
        message: 'Error en el servidor. Por favor, inténtalo más tarde.',
        timestamp: Date.now(),
        retryable: true
      };
    }

    setLastError(networkError);
    return networkError;
  }, []);

  return {
    isOnline,
    lastError,
    handleNetworkError,
    clearError: () => setLastError(null)
  };
}; 