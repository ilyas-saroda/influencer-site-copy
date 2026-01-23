import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      action: options.action || null,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration (unless persistent)
    if (!newToast.persistent) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toast,
    removeToast,
    clearAllToasts,
    toasts,
    // Convenience methods
    success: (message, options = {}) => toast(message, { ...options, type: 'success' }),
    error: (message, options = {}) => toast(message, { ...options, type: 'error' }),
    warning: (message, options = {}) => toast(message, { ...options, type: 'warning' }),
    info: (message, options = {}) => toast(message, { ...options, type: 'info' })
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getToastStyles = () => {
    const baseStyles = "pointer-events-auto max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 transition-all duration-300 transform";
    const animationStyles = isVisible && !isExiting 
      ? "translate-x-0 opacity-100 scale-100" 
      : isExiting 
      ? "translate-x-full opacity-0 scale-95" 
      : "translate-x-full opacity-0 scale-95";
    
    return `${baseStyles} ${animationStyles}`;
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {toast.message}
          </p>
          {toast.action && (
            <div className="mt-2">
              <button
                onClick={toast.action.handler}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleRemove}
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Convenience functions for common toast types
export const toast = {
  success: (message, options) => ({ message, type: 'success', ...options }),
  error: (message, options) => ({ message, type: 'error', ...options }),
  warning: (message, options) => ({ message, type: 'warning', ...options }),
  info: (message, options) => ({ message, type: 'info', ...options }),
};

export default ToastProvider;
