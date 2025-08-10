
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, CloseIcon } from './Icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300); // Wait for exit animation
    }, 2700);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <CheckCircleIcon className="h-6 w-6" />,
    error: <XCircleIcon className="h-6 w-6" />,
    info: <InformationCircleIcon className="h-6 w-6" />,
  };

  const colors = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    info: 'bg-blue-500 border-blue-600',
  };

  return (
    <div
      className={`
        flex items-center p-4 mb-4 text-white rounded-lg shadow-lg border-l-4
        ${colors[type]}
        transition-all duration-300 transform 
        ${exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="ml-3 text-sm font-medium">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-full inline-flex items-center justify-center h-8 w-8 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        onClick={handleClose}
        aria-label="Cerrar"
      >
        <span className="sr-only">Cerrar</span>
        <CloseIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;