import React, { useState, useEffect } from 'react';
import EntryGuard from './components/EntryGuard';
import StampCard from './components/StampCard';
import QRScanner from './components/QRScanner';
import RewardScreen from './components/RewardScreen';
import { STAMP_SPOTS } from './utils/geoUtils';

const TOTAL_STAMPS = Object.keys(STAMP_SPOTS).length;

function App() {
  const [agreed, setAgreed] = useState(false);
  const [stamps, setStamps] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isExchanged, setIsExchanged] = useState(false);

  useEffect(() => {
    // Load state from localStorage on mount
    const savedStamps = JSON.parse(localStorage.getItem('collected_stamps') || '[]');
    setStamps(savedStamps);
    
    if (localStorage.getItem('is_exchanged') === 'true') {
      setIsExchanged(true);
    }
  }, []);

  const handleScanSuccess = (qrId) => {
    setIsScanning(false);
    if (!stamps.includes(qrId)) {
      const newStamps = [...stamps, qrId];
      setStamps(newStamps);
      localStorage.setItem('collected_stamps', JSON.stringify(newStamps));
    } else {
      alert("このスポットは既にチェックイン済みです！");
    }
  };

  const handleExchange = () => {
    localStorage.setItem('is_exchanged', 'true');
    setIsExchanged(true);
  };

  if (!agreed) {
    return <EntryGuard onAgreed={() => setAgreed(true)} />;
  }

  // If all stamps collected, we show StampCard + Reward options
  // The user wanted:
  // 5. 特典引き換え（コンプリート時のみ）: スライダー操作 ＋ 動的時計表示。
  // But wait! If `isExchanged` is true, ALWAYS show exchanged screen (with clock).
  // Or show StampCard AND RewardScreen. 
  // We'll show StampCard and append RewardScreen below it if complete.

  return (
    <div className="app-container">
      {!isExchanged && isScanning ? (
        <QRScanner 
          onScanSuccess={handleScanSuccess} 
          onCancel={() => setIsScanning(false)} 
        />
      ) : (
        <>
          {isExchanged ? (
             <RewardScreen isExchanged={isExchanged} onExchange={handleExchange} />
          ) : (
            <>
              <StampCard 
                stamps={stamps} 
                totalStamps={TOTAL_STAMPS} 
                isExchanged={isExchanged}
                onOpenCamera={() => setIsScanning(true)} 
              />
              
              {stamps.length >= TOTAL_STAMPS && (
                <div className="reward-section-wrapper">
                  <RewardScreen isExchanged={isExchanged} onExchange={handleExchange} />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
