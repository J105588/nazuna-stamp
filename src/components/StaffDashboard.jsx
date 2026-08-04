import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  RefreshCcw, 
  CheckCircle2, 
  Save, 
  ScanLine, 
  Trash2, 
  Camera,
  QrCode,
  Sparkles
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
    <div className={isStaffMode ? "staff-full-page" : "staff-modal-overlay"}>
      <div className="staff-dashboard">
        <header className="staff-header-compact">
          <div className="staff-title-compact">
            <ScanLine size={18} className="staff-icon" />
            <span>現場スタッフパネル</span>
            {isStaffMode && <span className="mode-badge-compact">STAFF MODE</span>}
          </div>
          
          <div className="staff-header-actions">
            <button 
              className={`btn-camera-toggle-compact ${isScanning ? 'active' : ''}`}
              onClick={onScanUser}
              title={isScanning ? "カメラをオフにする" : "カメラをオンにする"}
            >
              <Camera size={16} />
              <span>{isScanning ? "カメラON" : "カメラ起動"}</span>
            </button>
            
            {isStaffMode ? (
              <button className="btn-exit-staff-compact" onClick={onExitStaffMode}>モード終了</button>
            ) : (
              <button className="staff-close-btn" onClick={onClose}><X size={20} /></button>
            )}
          </div>
        </header>

        {!scannedData ? (
          <div className="staff-empty-state">
            <div className="empty-icon-box">
              <ScanLine size={40} />
            </div>
            <h3>参加者のQRコードをスキャン</h3>
            
            <div className="staff-instructions-container">
              <h4>【操作手順ステップ】</h4>
              <div className="staff-steps-grid">
                <div className="step-card">
                  <span className="step-num">1</span>
                  <p>参加者の画面最下部「©2026 なずな祭実行委員会」を5回連続タップしてもらい、QRを表示してもらいます。</p>
                </div>
                <div className="step-card">
                  <span className="step-num">2</span>
                  <p>下の「スキャンを開始」ボタンを押し、参加者のQRコードを読み取ります。</p>
                </div>
                <div className="step-card">
                  <span className="step-num">3</span>
                  <p>スタンプ取得状況のON/OFF切り替えや景品交換状態を必要に応じて編集します。</p>
                </div>
                <div className="step-card">
                  <span className="step-num">4</span>
                  <p>「変更を保存してQR表示」を押し、表示されたQRを参加者のスマホでスキャンしてもらえば完了です。</p>
                </div>
              </div>
            </div>

            <button className="btn-primary btn-large-staff" onClick={onScanUser}>
              <Camera size={20} />
              スキャンを開始する
            </button>
          </div>
        ) : isShowingApplyQR ? (
          <div className="staff-apply-qr">
            <h3>変更を適用（確認用QRコード）</h3>
            <p>参加者のスマホカメラで、以下のQRコードをスキャンしてもらってください。</p>
            
            <div className="qr-container-sync-card">
              <QRCodeSVG value={applyQRData} size={230} level="M" includeMargin />
              <div className="qr-card-footer">
                <QrCode size={14} />
                <span>データ適用用確認QR</span>
              </div>
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
                適用完了（次の操作へ）
              </button>
            </div>
          </div>
        ) : (
          <div className="staff-editor">
            <div className="user-status-card">
              <div className="status-item">
                <span className="label">取得済みスタンプ:</span>
                <span className="value">{scannedData.stamps.length} / {checkpoints.length} 個</span>
              </div>
              <div className="status-item">
                <span className="label">景品交換状況:</span>
                <span className={`value status-pill ${scannedData.isExchanged ? 'exchanged' : 'pending'}`}>
                  {scannedData.isExchanged ? '交換済み' : '未交換'}
                </span>
              </div>
            </div>

            <div className="stamp-toggle-section">
              <div className="section-subtitle">
                <Sparkles size={16} />
                <span>スタンプ個別の取得切り替え (タップで変更)</span>
              </div>
              <div className="stamp-toggle-grid">
                {checkpoints.map((cp, index) => {
                  const id = cp.qrId || cp.id;
                  const isActive = scannedData.stamps.includes(id);
                  const spotName = cp.name || `スポット ${index + 1}`;
                  const sec = sections.find(s => s.id === cp.sectionId);
                  return (
                    <button 
                      key={id} 
                      className={`stamp-toggle-item ${isActive ? 'active' : ''}`}
                      onClick={() => toggleStamp(id)}
                      title={spotName}
                    >
                      <div className="toggle-header-row">
                        <span className="toggle-number">#{index + 1}</span>
                        {sec && <span className="toggle-sec-name">{sec.name}</span>}
                        {isActive && <CheckCircle2 className="toggle-check" size={16} />}
                      </div>
                      <div className="toggle-name">{spotName}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="staff-actions-grid">
              <button 
                className={`btn-staff-action toggle-exchange ${(!scannedData.isExchanged && scannedData.stamps.length < checkpoints.length) ? 'disabled' : ''}`} 
                onClick={toggleExchange}
              >
                <RefreshCcw size={18} />
                {scannedData.isExchanged ? '未交換に戻す' : '景品交換済みにする'}
              </button>
              <button className="btn-staff-action danger" onClick={resetUser}>
                <Trash2 size={18} />
                進捗全リセット
              </button>
            </div>

            <div className="staff-footer-actions">
              <button className="btn-primary" onClick={generateApplyQR}>
                <Save size={20} /> 変更を保存して適用QRを表示
              </button>
              <button className="btn-text-only" onClick={() => setScannedData(null)}>
                キャンセルして別のユーザーを読み取る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
