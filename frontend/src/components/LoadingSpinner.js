import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  variant = 'primary',
  centered = true 
}) => {
  const spinnerSize = size === 'sm' ? 'sm' : undefined;
  
  const content = (
    <div className={`d-flex align-items-center ${className}`}>
      <Spinner 
        animation="border" 
        variant={variant}
        size={spinnerSize}
        role="status"
        className="me-2"
      />
      <span>{text}</span>
    </div>
  );

  if (centered) {
    return (
      <div className="d-flex justify-content-center align-items-center my-5">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;