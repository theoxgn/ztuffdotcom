import React, { useEffect } from 'react';
import { Toast as BootstrapToast } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faExclamationTriangle, 
  faInfo, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';

const Toast = ({ show, message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return faCheck;
      case 'error':
      case 'danger': return faTimes;
      case 'warning': return faExclamationTriangle;
      case 'info': return faInfo;
      default: return faInfo;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'error':
      case 'danger': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#17a2b8';
    }
  };

  const getTitle = (type) => {
    switch (type) {
      case 'success': return 'Berhasil';
      case 'error':
      case 'danger': return 'Error';
      case 'warning': return 'Peringatan';
      case 'info': return 'Informasi';
      default: return 'Informasi';
    }
  };

  if (!show) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1060,
        minWidth: '300px'
      }}
    >
      <BootstrapToast
        onClose={onClose}
        style={{
          backgroundColor: getBackgroundColor(type),
          color: 'white'
        }}
      >
        <BootstrapToast.Header closeButton={true}>
          <FontAwesomeIcon icon={getIcon(type)} className="me-2" />
          <strong className="me-auto">{getTitle(type)}</strong>
        </BootstrapToast.Header>
        <BootstrapToast.Body>{message}</BootstrapToast.Body>
      </BootstrapToast>
    </div>
  );
};

export default Toast;