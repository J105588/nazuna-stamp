import React from 'react';
import { MapPin, X, ArrowRightLeft } from 'lucide-react';

const CustomConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  secName,
  spotName,
  confirmText = "獲得してエリア移動", 
  cancelText = "キャンセル", 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="custom-alert-overlay" onClick={onCancel}>
      <div className="custom-alert-card confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="alert-close-btn" onClick={onCancel} title="閉じる">
          <X size={18} />
        </button>

        <div className="alert-header">
          <div className="confirm-icon-badge">
            <ArrowRightLeft size={32} />
          </div>
          <h3 className="alert-title">{title || "エリア移動の確認"}</h3>
        </div>

        <div className="alert-body">
          <div className="confirm-target-box">
            {secName && (
              <div className="target-sec-tag">
                <MapPin size={14} />
                <span>{secName}</span>
              </div>
            )}
            {spotName && <h4 className="target-spot-name">{spotName}</h4>}
          </div>
          <p className="alert-message">{message}</p>
        </div>

        <div className="confirm-modal-actions">
          <button className="btn-confirm-action primary" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="btn-confirm-action secondary" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomConfirmModal;
