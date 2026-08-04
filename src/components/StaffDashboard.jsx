import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  RefreshCcw, 
  CheckCircle2, 
  Save, 
  ScanLine, 
  Trash2, 
  Camera 
} from 'lucide-react';
import { encodeSyncData, SYNC_PREFIX } from '../utils/syncUtils';

const StaffDashboard = ({ 
  initialScannedData, 
  onClose, 
  onScanUser, 
  isStaffMode = false, 
  onExitStaffMode,
  isScanning = false,
  checkpoints = [],
  sections = []
}) => {
  const [scannedData, setScannedData] = useState(initialScannedData);
  const [isShowingApplyQR, setIsShowingApplyQR] = useState(false);
  const [applyQRData, setApplyQRData] = useState('');

  useEffect(() => {
    if (initialScannedData) {
      setScannedData(initialScannedData);
    }
  }, [initialScannedData]);

  const toggleStamp = (id) => {
    if (!scannedData) return;
    const newStamps = scannedData.stamps.includes(id)
      ? scannedData.stamps.filter(s => s !== id)
      : [...scannedData.stamps, id];
    
    setScannedData({ ...scannedData, stamps: newStamps });
  };

  const toggleExchange = () => {
    if (!scannedData) return;
    
    const isAnySectionComplete = sections.length > 0 && sections.some(sec => {
      const secCps = checkpoints.filter(cp => cp.sectionId === sec.id);
      return secCps.length > 0 && secCps.every(cp => scannedData.stamps.includes(cp.qrId || cp.id));
    });
    const isComplete = isAnySectionComplete || (checkpoints.length > 0 && scannedData.stamps.length >= checkpoints.length);
    
    if (!scannedData.isExchanged && !isComplete) {
      alert("いずれかのエリアのスタンプがコンプリートされていないため、交換済みに変更することはできません。");
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
        nonce: scannedData.nonce
      });
    }
  };

  const generateApplyQR = () => {
    const payload = encodeSyncData(scannedData, SYNC_PREFIX.STAFF_DATA);
    setApplyQRData(payload);
    setIsShowingApplyQR(true);
  };

  return (
    <div className={isStaffMode ? "staff-full-view" : "staff-modal-overlay"}>
      <div className="staff-dashboard">
        <header className="staff-header">
          <div className="staff-title">
            <ScanLine size={20} />
            <h2>現場スタッフパネル {isStaffMode && <span className="mode-badge">STAFF MODE</span>}</h2>
          </div>
          
          <div className="staff-header-actions">
            <button 
              className={`btn-camera-toggle ${isScanning ? 'active' : ''}`}
              onClick={onScanUser}
              title={isScanning ? "カメラをオフにする" : "カメラをオンにする"}
            >
              <Camera size={20} />
            </button>
            
            {isStaffMode ? (
              <button className="btn-exit-staff" onClick={onExitStaffMode}>モード終了</button>
            ) : (
              <button className="staff-close" onClick={onClose}><X size={24} /></button>
            )}
          </div>
        </header>

        {!scannedData ? (
          <div className="staff-empty-state">
            <div className="empty-icon-box">
              <ScanLine size={48} />
            </div>
            <h3>ユーザーをスキャン</h3>
            <div className="staff-instructions">
              <h4>【スタッフモードの使い方】</h4>
              <ol style={{ textAlign: 'left', fontSize: '0.85rem', lineHeight: '1.5', margin: '12px 0 24px', paddingLeft: '20px', color: '#4b5563' }}>
                <li>参加者の画面の一番下にある「©2026 なずな祭実行委員会」という文字を素早く5回連続でタップして、QRコードを表示してもらいます。</li>
                <li>「スキャンを開始」ボタンを押し、参加者のQRを読み取ります。</li>
                <li>参加者のスタンプ取得状況や景品交換状況が表示・編集できるようになります。</li>
                <li>内容を変更した後、「変更を適用してQR生成」を押します。</li>
                <li>表示されたQRを、今度は参加者の端末から読み取ってもらうと変更が反映されます。</li>
              </ol>
            </div>
            <button className="btn-primary btn-large-staff" onClick={onScanUser}>
              スキャンを開始
            </button>
          </div>
        ) : isShowingApplyQR ? (
          <div className="staff-apply-qr">
            <h3>変更を適用</h3>
            <p>ユーザーの端末でこのQRをスキャンしてもらってください。</p>
            
            <div className="qr-container-large">
              <QRCodeSVG value={applyQRData} size={240} level="L" includeMargin />
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
                <span className="value">{scannedData.stamps.length} / {checkpoints.length}</span>
              </div>
              <div className="status-item">
                <span className="label">景品交換状況:</span>
                <span className={`value status-pill ${scannedData.isExchanged ? 'exchanged' : 'pending'}`}>
                  {scannedData.isExchanged ? '交換済み' : '未交換'}
                </span>
              </div>
            </div>

            <div className="stamp-toggle-grid">
              {checkpoints.map((cp, index) => {
                const id = cp.qrId || cp.id;
                const isActive = scannedData.stamps.includes(id);
                const spotName = cp.name || `スポット ${index + 1}`;
                return (
                  <button 
                    key={id} 
                    className={`stamp-toggle-item ${isActive ? 'active' : ''}`}
                    onClick={() => toggleStamp(id)}
                  >
                    <div className="toggle-number">{index + 1}</div>
                    <div className="toggle-name">{spotName}</div>
                    {isActive && <CheckCircle2 className="toggle-check" size={16} />}
                  </button>
                );
              })}
            </div>

            <div className="staff-actions-grid">
              <button 
                className={`btn-staff-action toggle-exchange ${(!scannedData.isExchanged && scannedData.stamps.length < checkpoints.length) ? 'disabled' : ''}`} 
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
