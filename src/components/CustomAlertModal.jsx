import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const CustomAlertModal = ({ 
  isOpen, 
  title, 
  message, 
  type = 'info', // 'success' | 'warning' | 'error' | 'info'
  onClose 
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="alert-icon success" size={40} />;
      case 'warning':
        return <AlertTriangle className="alert-icon warning" size={40} />;
      case 'error':
        return <XCircle className="alert-icon error" size={40} />;
      default:
        return <Info className="alert-icon info" size={40} />;
    }
  };

  return (
    <div className="custom-alert-overlay" onClick={onClose}>
      <div className={`custom-alert-card type-${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="alert-close-btn" onClick={onClose} title="閉じる">
          <X size={18} />
        </button>

        <div className="alert-header">
          {renderIcon()}
          {title && <h3 className="alert-title">{title}</h3>}
        </div>

        <div className="alert-body">
          <p className="alert-message">{message}</p>
        </div>

        <div className="alert-footer">
          <button className={`btn-alert-confirm type-${type}`} onClick={onClose}>
            確認
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlertModal;
