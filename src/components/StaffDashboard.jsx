import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, RefreshCcw, CheckCircle2, ChevronRight, Save, ScanLine, Trash2 } from 'lucide-react';
import { STAMP_SPOTS } from '../utils/geoUtils';
import { encodeSyncData, SYNC_PREFIX } from '../utils/syncUtils';

const StaffDashboard = ({ initialScannedData, onClose, onScanUser, isStaffMode = false, onExitStaffMode }) => {
  const [scannedData, setScannedData] = useState(initialScannedData);
  const [isShowingApplyQR, setIsShowingApplyQR] = useState(false);
  const [applyQRData, setApplyQRData] = useState('');

  // Sync state if initialScannedData changes (e.g. when a new user is scanned while dashboard is open)
  React.useEffect(() => {
    if (initialScannedData) {
      setScannedData(initialScannedData);
    }
  }, [initialScannedData]);

  // Handle data scanned from User
  const handleUserScanned = (userData) => {
    setScannedData(userData);
  };

  // Exposed to parent via ref or prop-callback pattern, but here we use state passed from App
  // For simplicity in this implementation, App will call a handler or we use a separate state in App
  
  const toggleStamp = (id) => {
    if (!scannedData) return;
    const newStamps = scannedData.stamps.includes(id)
      ? scannedData.stamps.filter(s => s !== id)
      : [...scannedData.stamps, id];
    
    setScannedData({ ...scannedData, stamps: newStamps });
  };

  const toggleExchange = () => {
    if (!scannedData) return;
    
    // Ensure all stamps are collected before marking as exchanged
    const isComplete = scannedData.stamps.length >= Object.keys(STAMP_SPOTS).length;
    
    if (!scannedData.isExchanged && !isComplete) {
      alert("すべてのスタンプが揃っていないため、交換済みに変更することはできません。");
      return;
    }

    setScannedData({ ...scannedData, isExchanged: !scannedData.isExchanged });
  };

  const resetUser = () => {
    if (window.confirm('このユーザーの全ての進捗をリセットしますか？')) {
      setScannedData({
        stamps: [],
        isExchanged: false,
        isDismissed: false,
        nonce: scannedData.nonce // Keep the session nonce
      });
    }
  };

  const generateApplyQR = () => {
    const payload = encodeSyncData(scannedData, SYNC_PREFIX.STAFF_DATA);
    setApplyQRData(payload);
    setIsShowingApplyQR(true);
  };

  const keyCheck = import.meta.env.VITE_STORAGE_SECRET ? 
    import.meta.env.VITE_STORAGE_SECRET.length + import.meta.env.VITE_STORAGE_SECRET.substring(0, 1) : 'None';

  return (
    <div className={isStaffMode ? "staff-full-view" : "staff-modal-overlay"}>
      <div className="staff-dashboard">
        <header className="staff-header">
          <div className="staff-title">
            <ScanLine size={20} />
            <h2>管理者パネル {isStaffMode && <span className="mode-badge">STAFF MODE</span>}</h2>
            <span className="key-indicator" title="Encryption Key ID">🔑 {keyCheck}</span>
          </div>
          {isStaffMode ? (
            <button className="btn-exit-staff" onClick={onExitStaffMode}>モード終了</button>
          ) : (
            <button className="staff-close" onClick={onClose}><X size={24} /></button>
          )}
        </header>

        {!scannedData ? (
          <div className="staff-empty-state">
            <div className="empty-icon-box">
              <ScanLine size={48} />
            </div>
            <h3>ユーザーをスキャン</h3>
            <p>ユーザーの「スタッフ用同期QR」をスキャンして操作を開始してください。</p>
            <button className="btn-primary btn-large-staff" onClick={onScanUser}>
              スキャンを開始
            </button>
          </div>
        ) : isShowingApplyQR ? (
          <div className="staff-apply-qr">
            <h3>変更を適用</h3>
            <p>ユーザーの端末でこのQRをスキャンしてもらってください。</p>
            
            <div className="qr-container-large">
              <QRCodeSVG value={applyQRData} size={240} level="H" includeMargin />
            </div>

            <div className="apply-actions">
              <button className="btn-primary" onClick={() => {
                if (isStaffMode) {
                  setScannedData(null);
                  setIsShowingApplyQR(false);
                } else {
                  onClose();
                }
              }}>
                完了
              </button>
            </div>
          </div>
        ) : (
          <div className="staff-editor">
            <div className="user-status-card">
              <div className="status-item">
                <span className="label">取得済みスタンプ:</span>
                <span className="value">{scannedData.stamps.length} / {Object.keys(STAMP_SPOTS).length}</span>
              </div>
              <div className="status-item">
                <span className="label">景品交換状況:</span>
                <span className={`value status-pill ${scannedData.isExchanged ? 'exchanged' : 'pending'}`}>
                  {scannedData.isExchanged ? '交換済み' : '未交換'}
                </span>
              </div>
            </div>

            <div className="stamp-toggle-grid">
              {Object.entries(STAMP_SPOTS).map(([id, spot]) => {
                const isActive = scannedData.stamps.includes(id);
                return (
                  <button 
                    key={id} 
                    className={`stamp-toggle-item ${isActive ? 'active' : ''}`}
                    onClick={() => toggleStamp(id)}
                  >
                    <div className="toggle-number">{id}</div>
                    <div className="toggle-name">{spot.name}</div>
                    {isActive && <CheckCircle2 className="toggle-check" size={16} />}
                  </button>
                );
              })}
            </div>

            <div className="staff-actions-grid">
              <button 
                className={`btn-staff-action toggle-exchange ${(!scannedData.isExchanged && scannedData.stamps.length < Object.keys(STAMP_SPOTS).length) ? 'disabled' : ''}`} 
                onClick={toggleExchange}
              >
                <RefreshCcw size={18} />
                {scannedData.isExchanged ? '未交換に戻す' : '交換済みにする'}
              </button>
              <button className="btn-staff-action danger" onClick={resetUser}>
                <Trash2 size={18} />
                全リセット
              </button>
            </div>

            <div className="staff-footer-actions">
              <button className="btn-primary" onClick={generateApplyQR}>
                <Save size={20} /> 変更を保存してQR表示
              </button>
              <button className="btn-text-only" onClick={() => setScannedData(null)}>
                キャンセルして別のユーザーをスキャン
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
