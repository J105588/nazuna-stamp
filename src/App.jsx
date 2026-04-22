import React, { useState, useEffect } from 'react';
import EntryGuard from './components/EntryGuard';
import StampCard from './components/StampCard';
import QRScanner from './components/QRScanner';
import RewardScreen from './components/RewardScreen';
import { STAMP_SPOTS } from './utils/geoUtils';
import { storage } from './utils/storage';
import { X } from 'lucide-react';

const TOTAL_STAMPS = Object.keys(STAMP_SPOTS).length;
const DEBUG_PASSCODE = import.meta.env.VITE_DEBUG_PASSCODE;

function App() {
  const [agreed, setAgreed] = useState(false);
  const [stamps, setStamps] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isExchanged, setIsExchanged] = useState(false);
  const [scannerClosedAt, setScannerClosedAt] = useState(0);
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");

  useEffect(() => {
    // Load state from encrypted storage on mount
    const savedStamps = storage.load('collected_stamps') || [];
    setStamps(savedStamps);
    
    if (storage.load('is_exchanged') === true) {
      setIsExchanged(true);
    }
  }, []);

  const handleScanSuccess = (qrId) => {
    setIsScanning(false);
    setScannerClosedAt(Date.now());
    if (!stamps.includes(qrId)) {
      const newStamps = [...stamps, qrId];
      setStamps(newStamps);
      storage.save('collected_stamps', newStamps);
    } else {
      alert("このスポットは既にチェックイン済みです！");
    }
  };

  const handleCancelScan = () => {
    setIsScanning(false);
    setScannerClosedAt(Date.now());
  };

  const handleExchange = () => {
    storage.save('is_exchanged', true);
    setIsExchanged(true);
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (passcodeInput === DEBUG_PASSCODE) {
      const allSpotIds = Object.keys(STAMP_SPOTS);
      setStamps(allSpotIds);
      storage.save('collected_stamps', allSpotIds);
      setShowPasscode(false);
      setPasscodeInput("");
    } else {
      alert("パスコードが違います");
      setPasscodeInput("");
    }
  };

  if (!agreed) {
    return <EntryGuard onAgreed={() => setAgreed(true)} />;
  }

  const isComplete = stamps.length >= TOTAL_STAMPS;

  return (
    <div className="app-container" onClick={() => {
      // Global click listener to potentially reset backdoor if needed, 
      // but we handle local reset in StampCard for specific logic
    }}>
      {isScanning ? (
        <QRScanner 
          onScanSuccess={handleScanSuccess} 
          onCancel={handleCancelScan} 
        />
      ) : (
        <>
          <StampCard 
            stamps={stamps} 
            totalStamps={TOTAL_STAMPS} 
            isExchanged={isExchanged}
            onOpenCamera={() => setIsScanning(true)} 
            scannerClosedAt={scannerClosedAt}
            onBackdoorAction={() => setShowPasscode(true)}
          />
          
          {isComplete && (
            <div className="reward-section-wrapper">
              <RewardScreen isExchanged={isExchanged} onExchange={handleExchange} />
            </div>
          )}
        </>
      )}

      {showPasscode && (
        <div className="debug-passcode-overlay" onClick={() => setShowPasscode(false)}>
          <div className="passcode-card" onClick={e => e.stopPropagation()}>
            <button className="passcode-close" onClick={() => setShowPasscode(false)}>
              <X size={20} />
            </button>
            <h3>管理者認証</h3>
            <p>パスコードを入力してください</p>
            <form onSubmit={handlePasscodeSubmit}>
              <input 
                type="password" 
                inputMode="numeric"
                maxLength={4}
                value={passcodeInput}
                onChange={e => setPasscodeInput(e.target.value)}
                autoFocus
                placeholder="****"
              />
              <button type="submit" className="btn-primary">OK</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
