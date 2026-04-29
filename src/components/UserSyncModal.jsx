import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, ShieldCheck, Camera } from 'lucide-react';
import { encodeSyncData, SYNC_PREFIX } from '../utils/syncUtils';

const UserSyncModal = ({ onClose, userData, onScan }) => {
  const syncPayload = encodeSyncData(userData, SYNC_PREFIX.USER_DATA);

  return (
    <div className="modal-overlay">
      <div className="modal-content sync-modal">
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        
        <div className="sync-header">
          <ShieldCheck className="sync-icon" size={32} />
          <h3>スタッフ用同期</h3>
        </div>

        <p className="sync-description">
          不具合がある場合やスタッフが直接操作する必要がある場合、このQRコードをスタッフに提示してください。
        </p>

        <div className="qr-container-sync">
          <QRCodeSVG value={syncPayload} size={220} level="L" includeMargin />
        </div>

        <div className="sync-footer">
          <p className="sync-warning">※スタッフが操作を完了した後、以下のボタンで確認QRを読み取ってください。</p>
          <div className="sync-actions">
            <button className="btn-primary btn-scan-inline" onClick={() => {
              onClose();
              onScan();
            }}>
              <Camera size={18} />
              スタッフのQRをスキャン
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSyncModal;
