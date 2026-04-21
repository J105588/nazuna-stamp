import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { calculateDistance, STAMP_SPOTS, MAX_DISTANCE_METERS } from '../utils/geoUtils';
import { MapPin, Target, XCircle } from 'lucide-react';

const QRScanner = ({ onScanSuccess, onCancel }) => {
  const [status, setStatus] = useState("カメラを起動しています...");
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode;
    let mounted = true;

    const startScanner = async () => {
      try {
        // StrictMode対策としてDOMの中身を一度リセット
        const el = document.getElementById("qr-reader");
        if (el) el.innerHTML = "";

        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (html5QrCode.isScanning) {
              html5QrCode.stop()
                .then(() => processCheckIn(decodedText))
                .catch(e => console.error("Error stopping scanner", e));
            }
          },
          () => {} // ignore constant parse errors
        );

        if (!mounted) {
          await html5QrCode.stop();
          html5QrCode.clear();
        } else {
          setStatus("枠内にQRコードを写してください");
        }
      } catch (err) {
        if (mounted) {
          console.error(err);
          setStatus("カメラへのアクセスが必要です。許可してください。");
        }
      }
    };

    // Strict Modeの即時マウント・アンマウントによる重複起動を防ぐため遅延起動
    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(e => console.error(e));
      }
    };
  }, []);

  const processCheckIn = (qrId) => {
    setIsProcessing(true);
    setDistanceInfo(null);
    setStatus("現在地を確認しています...");

    if (!navigator.geolocation) {
      alert("お使いの端末はGPSに対応していません。");
      setIsProcessing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const target = STAMP_SPOTS[qrId];
        
        if (!target) {
          setStatus("無効なQRコードです。");
          setIsProcessing(false);
          return;
        }

        const distance = calculateDistance(latitude, longitude, target.lat, target.lon);
        
        if (distance <= MAX_DISTANCE_METERS) {
          setStatus(`${target.name}にチェックイン成功！`);
          setTimeout(() => {
            onScanSuccess(qrId);
          }, 1500);
        } else {
          setDistanceInfo(Math.round(distance));
          setStatus("目的地から離れています");
        }
        setIsProcessing(false);
      },
      (err) => {
        let errMsg = "位置情報の取得に失敗しました。";
        if (err.code === 1) errMsg = "位置情報の利用が拒否されました。設定を確認してください。";
        setStatus(errMsg);
        setIsProcessing(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <h2 className={distanceInfo ? "status-warning" : ""}>{status}</h2>
        
        {!isProcessing && !distanceInfo && status !== "無効なQRコードです。" && status !== "カメラへのアクセスが必要です。許可してください。" && status !== "位置情報の取得に失敗しました。" && status !== "位置情報の利用が拒否されました。設定を確認してください。" && (
          <div id="qr-reader" className="qr-reader-box-custom"></div>
        )}

        {isProcessing && (
          <div className="processing-indicator">
            <Target className="spin-icon" size={48} />
          </div>
        )}

        {distanceInfo && (
          <div className="distance-warning">
            <MapPin size={32} />
            <p><strong>目的地まであと約 {distanceInfo}m です</strong></p>
            <p className="sub-text">もう少し近づいてから、もう一度お試しください。</p>
            <button className="btn-secondary" onClick={onCancel}>戻る</button>
          </div>
        )}
        
        <button className="btn-cancel" onClick={() => {
          if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().then(onCancel).catch(onCancel);
          } else {
            onCancel();
          }
        }}>
          <XCircle size={20} /> とじる
        </button>
      </div>
    </div>
  );
};

export default QRScanner;
