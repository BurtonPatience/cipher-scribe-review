import { useState, useCallback } from 'react';

export interface AppError {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useErrorHandler() {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((
    type: AppError['type'],
    title: string,
    message: string,
    action?: AppError['action']
  ) => {
    const error: AppError = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date(),
      action
    };

    setErrors(prev => [...prev, error]);

    // Auto-remove success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        removeError(error.id);
      }, 5000);
    }

    // Auto-remove info messages after 10 seconds
    if (type === 'info') {
      setTimeout(() => {
        removeError(error.id);
      }, 10000);
    }
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Convenience methods for common error types
  const showWalletError = useCallback((message: string) => {
    addError('error', 'Wallet Error', message, {
      label: 'Retry Connection',
      onClick: () => window.location.reload()
    });
  }, [addError]);

  const showNetworkError = useCallback((message: string) => {
    addError('error', 'Network Error', message, {
      label: 'Switch Network',
      onClick: () => {
        // This would trigger network switching logic
        console.log('Network switch requested');
      }
    });
  }, [addError]);

  const showEncryptionError = useCallback((message: string) => {
    addError('error', 'Encryption Error', message, {
      label: 'Try Again',
      onClick: () => {
        // This would retry the encryption operation
        console.log('Encryption retry requested');
      }
    });
  }, [addError]);

  const showSuccess = useCallback((title: string, message: string) => {
    addError('success', title, message);
  }, [addError]);

  const showWarning = useCallback((title: string, message: string, action?: AppError['action']) => {
    addError('warning', title, message, action);
  }, [addError]);

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    showWalletError,
    showNetworkError,
    showEncryptionError,
    showSuccess,
    showWarning
  };
}
