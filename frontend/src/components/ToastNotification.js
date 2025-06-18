import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faExclamationTriangle, 
  faInfo, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';

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

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, [removeToast]);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'danger', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return faCheck;
      case 'danger': return faTimes;
      case 'warning': return faExclamationTriangle;
      case 'info': return faInfo;
      default: return faInfo;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'danger': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#17a2b8';
    }
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info, addToast, removeToast }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            style={{
              backgroundColor: getBackgroundColor(toast.type),
              color: 'white'
            }}
            className="mb-2"
          >
            <Toast.Header closeButton={true}>
              <FontAwesomeIcon icon={getIcon(toast.type)} className="me-2" />
              <strong className="me-auto">
                {toast.type === 'success' && 'Berhasil'}
                {toast.type === 'danger' && 'Error'}
                {toast.type === 'warning' && 'Peringatan'}
                {toast.type === 'info' && 'Informasi'}
              </strong>
            </Toast.Header>
            <Toast.Body>{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

// No default export needed - only named exports are used