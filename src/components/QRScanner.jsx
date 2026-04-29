import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { calculateDistance, STAMP_SPOTS, MAX_DISTANCE_METERS } from '../utils/geoUtils';
import { MapPin, XCircle, CheckCircle2, Loader2 } from 'lucide-react';

const QRScanner = ({ onScanSuccess, onCancel, isStaffDashboardOpen }) => {
  const [status, setStatus] = useState("カメラを起動しています...");
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode;
    let mounted = true;

    const startScanner = async () => {
      try {
        const el = document.getElementById("qr-reader");
        if (el) el.innerHTML = "";

        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        // レスポンシブな枠の設定（より広く調整）
        const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * 0.85); // 70%から85%に拡大
          return {
            width: Math.max(qrboxSize, 250),
            height: Math.max(qrboxSize, 250)
          };
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: qrboxFunction
          },
          (decodedText) => {
            if (mounted && !isCapturing && !isSuccess) {
              setCapturing(decodedText);
            }
          },
          () => { }
        );

        if (!mounted) {
          if (html5QrCode.isScanning) {
            await html5QrCode.stop();
          }
        } else {
          setStatus("枠内にQRコードを写してください");
        }
      } catch (err) {
        if (mounted) {
          console.error(err);
          setStatus("カメラの起動に失敗しました。");
        }
      }
    };

    const setCapturing = async (text) => {
      const trimmedText = text.trim();
      const isUserSync = trimmedText.startsWith('nzs1:');
      const isStaffResult = trimmedText.startsWith('nzs2:');

      // If it's a User Sync QR but dashboard is not open, ignore it completely
      if (isUserSync && !isStaffDashboardOpen) {
        return;
      }

      setStatus("検証中...");
      
      // Stop the camera BEFORE setting isCapturing=true to ensure the DOM element exists during stop()
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.error("Camera stop error during capture:", err);
        }
      }
      
      if (mounted) {
        setIsCapturing(true);
        processCheckIn(trimmedText);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        if (scanner.isScanning) {
          scanner.stop()
            .then(() => {
              try { scanner.clear(); } catch(e) {}
            })
            .catch(e => {
              console.error("Scanner cleanup stop error:", e);
              try { scanner.clear(); } catch(err) {}
            });
        } else {
          try { scanner.clear(); } catch(e) {}
        }
      }
    };
  }, []);

  const processCheckIn = (decodedText) => {
    setIsProcessing(true);
    setDistanceInfo(null);

    // Handle Synchronization Payloads (Bypass GPS)
    const isUserSync = decodedText.startsWith('nzs1:');
    const isStaffResult = decodedText.startsWith('nzs2:');

    if (isStaffResult || (isUserSync && isStaffDashboardOpen)) {
      setIsSuccess(true);
      setStatus("同期データを検出しました");
      setTimeout(() => onScanSuccess(decodedText), 800);
      return;
    }

    // Normal Stamp Spot Logic
    const qrId = decodedText;
    if (!navigator.geolocation) {
      alert("GPSに対応していません。");
      resetScannerStates();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const target = STAMP_SPOTS[qrId];

        if (!target) {
          setStatus(`無効なチェックポイントです`);
          setIsProcessing(false);
          setIsCapturing(false);
          return;
        }

        const distance = calculateDistance(latitude, longitude, target.lat, target.lon);
        if (distance <= MAX_DISTANCE_METERS) {
          setIsSuccess(true);
          setStatus("チェックイン完了！");
          setTimeout(() => onScanSuccess(qrId), 1500);
        } else {
          setDistanceInfo({
            distance: Math.round(distance),
            qrId: qrId
          });
          setStatus("掲示位置から離れています");
        }
        setIsProcessing(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setStatus("位置情報の取得に失敗しました。");
        resetScannerStates();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const resetScannerStates = () => {
    setIsProcessing(false);
    setIsCapturing(false);
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <h2 className={distanceInfo ? "status-warning" : (isSuccess ? "status-success" : "")}>
          {status}
        </h2>

        {/* スキャン中のみ表示（枠あり） */}
        {!isCapturing && !isProcessing && !isSuccess && !distanceInfo && (
          <div id="qr-reader" className="qr-reader-box-custom"></div>
        )}

        {/* 検証中（読み取り成功〜GPS判定完了まで） */}
        {(isCapturing || isProcessing) && !isSuccess && !distanceInfo && (
          <div className="validation-indicator">
            <Loader2 className="spin-icon-slow" size={64} />
            <p className="validation-text">位置情報を検証しています...</p>
          </div>
        )}

        {/* 完了後：チェックマークを表示 */}
        {isSuccess && (
          <div className="success-indicator">
            <CheckCircle2 className="icon-success-large" size={80} />
          </div>
        )}

        {distanceInfo && (
          <div className="distance-warning">
            <MapPin size={32} />
            <p><strong>あと約 {distanceInfo.distance}m です</strong></p>
            <p className="sub-text">もう少し近づいてから、もう一度お試しください。</p>
            <div className="retry-actions">
              <button className="btn-primary" onClick={() => processCheckIn(distanceInfo.qrId)}>
                再判定する
              </button>
              <button className="btn-secondary" onClick={onCancel}>やめる</button>
            </div>
          </div>
        )}

        <div className="scanner-footer">
          {!isSuccess && !isProcessing && !isCapturing && (
            <button className="btn-cancel" onClick={onCancel}>
              <XCircle size={20} /> とじる
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
