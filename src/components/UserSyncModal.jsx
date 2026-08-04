import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Camera, QrCode, ArrowRightLeft } from 'lucide-react';
import { encodeSyncData, SYNC_PREFIX } from '../utils/syncUtils';

const UserSyncModal = ({ onClose, userData, onScan }) => {
  const syncPayload = encodeSyncData(userData, SYNC_PREFIX.USER_DATA);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content sync-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="sync-modal-header">
          <div className="sync-icon-badge">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h3>スタッフ用データ同期</h3>
            <span className="sync-sub-badge">データ復旧・サポート専用</span>
          </div>
        </div>

        <div className="sync-body">
          <div className="sync-step-box">
            <div className="step-tag">STEP 1</div>
            <p>以下のQRコードを<strong>スタッフの端末でスキャン</strong>してもらってください。</p>
          </div>

          <div className="qr-container-sync-card">
            <QRCodeSVG value={syncPayload} size={210} level="M" includeMargin />
            <div className="qr-card-footer">
              <QrCode size={14} />
              <span>進捗データ提示用QRコード</span>
            </div>
          </div>

          <div className="sync-step-box step-2">
            <div className="step-tag green">STEP 2</div>
            <p>スタッフ側の変更完了後、下のボタンを押して<strong>スタッフの確認用QR</strong>をスキャンしてください。</p>
          </div>
        </div>

        <div className="sync-modal-actions">
          <button
            className="btn-primary btn-scan-sync"
            onClick={() => {
              onClose();
              onScan();
            }}
          >
            <Camera size={20} />
            <span>スタッフのQRコードを読み取る</span>
          </button>
          <button className="btn-secondary-subtle" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSyncModal;
