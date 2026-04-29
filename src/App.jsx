import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import EntryGuard from './components/EntryGuard';
import StampCard from './components/StampCard';
import QRScanner from './components/QRScanner';
import RewardScreen from './components/RewardScreen';
import MapModal from './components/MapModal';
import { STAMP_SPOTS } from './utils/geoUtils';
import { storage } from './utils/storage';
import { X, Map as MapIcon, Settings } from 'lucide-react';
import StaffDashboard from './components/StaffDashboard';
import UserSyncModal from './components/UserSyncModal';
import { decodeSyncData, SYNC_PREFIX } from './utils/syncUtils';

const TOTAL_STAMPS = Object.keys(STAMP_SPOTS).length;
const DEBUG_PASSCODE_HASH = import.meta.env.VITE_DEBUG_PASSCODE_HASH;

import TermsModal from './components/TermsModal';

function App() {
  const [agreed, setAgreed] = useState(false);
  const [stamps, setStamps] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isExchanged, setIsExchanged] = useState(false);
  const [scannerClosedAt, setScannerClosedAt] = useState(0);
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isStaffDashboardOpen, setIsStaffDashboardOpen] = useState(false);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [isUserSyncModalOpen, setIsUserSyncModalOpen] = useState(false);
  const [syncTapCount, setSyncTapCount] = useState(0);
  const [currentSyncNonce, setCurrentSyncNonce] = useState(null);
  const [scannedUserData, setScannedUserData] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Load state from consolidated storage
    const savedData = storage.load('stamp_rally_data');
    
    if (savedData) {
      // Filter out any IDs that no longer exist in STAMP_SPOTS (handles security ID changes/removals)
      const validSpotIds = Object.keys(STAMP_SPOTS);
      const filteredStamps = (savedData.stamps || []).filter(id => validSpotIds.includes(id));

      setStamps(filteredStamps);
      setIsExchanged(savedData.isExchanged || false);
      setIsDismissed(savedData.isDismissed || false);
      setIsStaffMode(savedData.isStaffMode || false);
      
      // If some stamps were filtered out, save the cleaned state back
      if (filteredStamps.length !== (savedData.stamps || []).length) {
        storage.save('stamp_rally_data', {
          ...savedData,
          stamps: filteredStamps
        });
      }
    } else {
      // Migration logic for older versions (separate keys)
      const oldStamps = storage.load('collected_stamps');
      const oldExchanged = storage.load('is_exchanged');
      const oldDismissed = storage.load('reward_overlay_dismissed');
      
      if (oldStamps !== null || oldExchanged !== null || oldDismissed !== null) {
        const migratedStamps = oldStamps || [];
        const migratedExchanged = oldExchanged === true;
        const migratedDismissed = oldDismissed === true;
        
        // Filter out any invalid IDs during migration too
        const validSpotIds = Object.keys(STAMP_SPOTS);
        const filteredMigratedStamps = migratedStamps.filter(id => validSpotIds.includes(id));

        setStamps(filteredMigratedStamps);
        setIsExchanged(migratedExchanged);
        setIsDismissed(migratedDismissed);
        
        // Save to the new consolidated format
        storage.save('stamp_rally_data', {
          stamps: filteredMigratedStamps,
          isExchanged: migratedExchanged,
          isDismissed: migratedDismissed
        });
        
        // Clean up old keys
        storage.remove('collected_stamps');
        storage.remove('is_exchanged');
        storage.remove('reward_overlay_dismissed');
      }
    }
  }, []);

  const saveState = (updatedStamps, updatedExchanged, updatedDismissed, staffMode = isStaffMode) => {
    storage.save('stamp_rally_data', {
      stamps: updatedStamps,
      isExchanged: updatedExchanged,
      isDismissed: updatedDismissed,
      isStaffMode: staffMode
    });
  };

  const handleScanSuccess = (decodedText) => {
    setIsScanning(false);
    setScannerClosedAt(Date.now());

    const lowerDecodedText = decodedText.toLowerCase();

    // Handle Staff Sync Request (Staff scans User)
    // Only trigger if Staff Dashboard is already open or in staff mode to avoid accidental triggers by normal users
    if (lowerDecodedText.startsWith(SYNC_PREFIX.USER_DATA)) {
      if (!isStaffDashboardOpen && !isStaffMode) {
        console.log("Sync request ignored: Staff dashboard not open.");
        return;
      }
      const userData = decodeSyncData(decodedText, SYNC_PREFIX.USER_DATA);
      if (userData) {
        setScannedUserData(userData);
      } else {
        alert("ユーザーデータの読み取りに失敗しました。QRコードを再表示してください。");
      }
      return;
    }

    // Handle Sync Response (User scans Staff)
    if (lowerDecodedText.startsWith(SYNC_PREFIX.STAFF_DATA)) {
      const updatedData = decodeSyncData(decodedText, SYNC_PREFIX.STAFF_DATA);
      if (updatedData) {
        // Security check: Compare nonce
        if (updatedData.nonce !== currentSyncNonce) {
          alert("この同期用QRコードはあなたの端末用ではありません。別のユーザーのデータである可能性があります。");
          return;
        }

        const validSpotIds = Object.keys(STAMP_SPOTS);
        const filteredSyncedStamps = (updatedData.stamps || []).filter(id => validSpotIds.includes(id));

        setStamps(filteredSyncedStamps);
        setIsExchanged(updatedData.isExchanged || false);
        setIsDismissed(updatedData.isDismissed || false);
        saveState(filteredSyncedStamps, updatedData.isExchanged, updatedData.isDismissed);
        setCurrentSyncNonce(null); // Clear used nonce
        alert("同期が完了しました！");
      } else {
        alert("同期データの復号に失敗しました。");
      }
      return;
    }

    // Normal Stamp Scan
    const qrId = decodedText;
    if (!stamps.includes(qrId)) {
      const newStamps = [...stamps, qrId];
      setStamps(newStamps);
      saveState(newStamps, isExchanged, isDismissed);
    } else {
      alert("このスポットは既にチェックイン済みです！");
    }
  };

  const handleCancelScan = () => {
    setIsScanning(false);
    setScannerClosedAt(Date.now());
  };

  const handleExchange = () => {
    setIsExchanged(true);
    saveState(stamps, true, isDismissed);
  };

  const toggleMap = () => {
    setIsMapOpen(!isMapOpen);
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    const hashedInput = CryptoJS.SHA256(passcodeInput).toString();
    if (hashedInput === DEBUG_PASSCODE_HASH) {
      setIsStaffMode(true);
      saveState(stamps, isExchanged, isDismissed, true);
      setShowPasscode(false);
      setPasscodeInput("");
    } else {
      alert("パスコードが違います");
      setPasscodeInput("");
    }
  };

  useEffect(() => {
    if (showPasscode || isMapOpen || isTermsModalOpen || isScanning || isUserSyncModalOpen || isStaffDashboardOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showPasscode, isMapOpen, isTermsModalOpen, isScanning, isUserSyncModalOpen, isStaffDashboardOpen]);

  if (!agreed) {
    return <EntryGuard onAgreed={() => setAgreed(true)} />;
  }

  const isComplete = stamps.length >= TOTAL_STAMPS;

  if (isStaffMode) {
    return (
      <div className="app-container">
        {isScanning ? (
          <QRScanner 
            onScanSuccess={handleScanSuccess} 
            onCancel={handleCancelScan}
            isStaffDashboardOpen={true}
          />
        ) : (
          <StaffDashboard 
            initialScannedData={scannedUserData}
            onClose={() => {
              setScannedUserData(null);
            }}
            onScanUser={() => {
              setIsScanning(true);
            }}
            isStaffMode={true}
            onExitStaffMode={() => {
              setIsStaffMode(false);
              saveState(stamps, isExchanged, isDismissed, false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {isScanning ? (
        <QRScanner 
          onScanSuccess={handleScanSuccess} 
          onCancel={handleCancelScan}
          isStaffDashboardOpen={isStaffDashboardOpen}
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
              <RewardScreen 
                isExchanged={isExchanged} 
                isDismissed={isDismissed}
                onExchange={handleExchange} 
                onDismiss={() => {
                  setIsDismissed(true);
                  saveState(stamps, isExchanged, true);
                }}
              />
            </div>
          )}

          <footer className="app-footer">
            <p 
              className="copyright" 
              onClick={() => {
                const newCount = syncTapCount + 1;
                if (newCount >= 5) {
                  // Generate a simple random nonce for this session
                  const nonce = Math.random().toString(36).substring(2, 10);
                  setCurrentSyncNonce(nonce);
                  setIsUserSyncModalOpen(true);
                  setSyncTapCount(0);
                } else {
                  setSyncTapCount(newCount);
                  // Auto reset after 3 seconds of inactivity
                  setTimeout(() => setSyncTapCount(0), 3000);
                }
              }}
            >
              ©2026 なずな祭実行委員会
            </p>
            <button className="btn-terms-minimal" onClick={() => setIsTermsModalOpen(true)}>
              利用規約
            </button>
          </footer>

          {/* Floating Map Button */}
          <button className="fab-map" onClick={toggleMap} aria-label="地図を表示">
            <MapIcon size={24} />
          </button>
        </>
      )}

      {isMapOpen && <MapModal onClose={() => setIsMapOpen(false)} />}
      
      {isTermsModalOpen && (
        <TermsModal onClose={() => setIsTermsModalOpen(false)} forceScroll={false} />
      )}

      {isUserSyncModalOpen && (
        <UserSyncModal 
          onClose={() => setIsUserSyncModalOpen(false)} 
          userData={{ stamps, isExchanged, isDismissed, nonce: currentSyncNonce }}
          onScan={() => setIsScanning(true)}
        />
      )}

      {isStaffDashboardOpen && (
        <StaffDashboard 
          initialScannedData={scannedUserData}
          onClose={() => {
            setIsStaffDashboardOpen(false);
            setScannedUserData(null);
          }}
          onScanUser={() => {
            setIsScanning(true);
          }}
        />
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
