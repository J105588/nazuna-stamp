import React, { useState, useEffect } from 'react';
import EntryGuard from './components/EntryGuard';
import StampCard from './components/StampCard';
import QRScanner from './components/QRScanner';
import RewardScreen from './components/RewardScreen';
import MapModal from './components/MapModal';
import AreaSelectModal from './components/AreaSelectModal';
import { storage } from './utils/storage';
import { stampDb } from './utils/stampDb';
import { X, Map as MapIcon, AlertTriangle, Loader2 } from 'lucide-react';
import StaffDashboard from './components/StaffDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserSyncModal from './components/UserSyncModal';
import { decodeSyncData, SYNC_PREFIX } from './utils/syncUtils';
import { calculateDistance, MAX_DISTANCE_METERS } from './utils/geoUtils';
import TermsModal from './components/TermsModal';
import OnboardingTour from './components/OnboardingTour';
import CustomAlertModal from './components/CustomAlertModal';
import CustomConfirmModal from './components/CustomConfirmModal';
import { supabase, isSupabaseConfigured, setAdminAuth } from './lib/supabase';

function App() {
  const [agreed, setAgreed] = useState(false);
  const [stamps, setStamps] = useState([]);
  const [sections, setSections] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    isAppStopped: false,
    staffPasscode: "",
    adminPasscode: ""
  });

  // Custom Alert Modal State
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Out of Area Scan Confirmation State
  const [pendingOutAreaScan, setPendingOutAreaScan] = useState(null);

  const showAlert = (message, title = '', type = 'info') => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type
    });
  };
  const [activeSectionId, setActiveSectionId] = useState(() => {
    return storage.load('selected_section_id') || null;
  });
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [isExchanged, setIsExchanged] = useState(false);
  const [scannerClosedAt, setScannerClosedAt] = useState(0);
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isStaffDashboardOpen, setIsStaffDashboardOpen] = useState(false);

  // Separate Staff Mode and Master Admin Mode
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [isUserSyncModalOpen, setIsUserSyncModalOpen] = useState(false);
  const [syncTapCount, setSyncTapCount] = useState(0);
  const [currentSyncNonce, setCurrentSyncNonce] = useState(null);
  const [scannedUserData, setScannedUserData] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);

  // Load dynamic sections, checkpoints, and settings from Supabase DB / local storage
  const loadDb = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch system settings first to check system active status
      const currentSettings = await stampDb.getSettingsAsync();
      setSettings(currentSettings);

      // System Protection: If app is stopped, halt fetching data and processing check-ins
      if (currentSettings.isAppStopped) {
        setSections([]);
        setCheckpoints([]);
        return;
      }

      const [secList, cpList] = await Promise.all([
        stampDb.getSectionsAsync(),
        stampDb.getCheckpointsAsync()
      ]);
      setSections(secList);
      setCheckpoints(cpList);
      const savedSectionId = storage.load('selected_section_id');
      if (secList.length > 0) {
        if (savedSectionId && secList.some(s => s.id === savedSectionId)) {
          setActiveSectionId(savedSectionId);
        } else {
          setActiveSectionId(secList[0].id);
          storage.save('selected_section_id', secList[0].id);
          setIsAreaModalOpen(true);
        }
      }

      // Load user progress and filter based on fetched checkpoints
      const savedData = storage.load('stamp_rally_data');
      const validSpotIds = cpList.map(cp => cp.qrId || cp.id);

      if (savedData) {
        const filteredStamps = (savedData.stamps || []).filter(id => validSpotIds.includes(id));
        setStamps(filteredStamps);
        setIsExchanged(savedData.isExchanged || false);
        setIsDismissed(savedData.isDismissed || false);
        setIsStaffMode(savedData.isStaffMode || false);

        if (filteredStamps.length !== (savedData.stamps || []).length) {
          storage.save('stamp_rally_data', {
            ...savedData,
            stamps: filteredStamps
          });
        }
      }

      // Check for URL query parameter auto check-in (e.g. ?stamp=UUID or ?qr=UUID)
      const urlParams = new URLSearchParams(window.location.search);
      const urlQrId = urlParams.get('stamp') || urlParams.get('qr');

      if (urlQrId) {
        const targetCp = cpList.find(cp => (cp.qrId || cp.id) === urlQrId || cp.id === urlQrId);
        if (targetCp) {
          const spotId = targetCp.qrId || targetCp.id;
          const currentSaved = storage.load('stamp_rally_data');
          let currentStamps = currentSaved?.stamps || [];

          if (!currentStamps.includes(spotId)) {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  const distance = calculateDistance(latitude, longitude, targetCp.lat, targetCp.lon);
                  if (distance <= MAX_DISTANCE_METERS) {
                    currentStamps = [...currentStamps, spotId];
                    setStamps(currentStamps);
                    storage.save('stamp_rally_data', {
                      ...(currentSaved || {}),
                      stamps: currentStamps
                    });
                    showAlert(`「${targetCp.name || 'スポット'}」にチェックインしました！`, 'スタンプ獲得', 'success');
                  } else {
                    showAlert(`スポットから離れています（あと約${Math.round(distance)}m）。掲示場所の近くで再度お試しください。`, '位置エラー', 'warning');
                  }
                },
                (err) => {
                  console.error("URL checkin geolocation error:", err);
                  showAlert("位置情報が取得できないため、スタンプを適用できませんでした。スキャナーをご利用ください。", "位置情報エラー", "error");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              );
            } else {
              showAlert("お使いの端末はGPS位置情報に対応していません。", "位置情報エラー", "error");
            }
          } else {
            showAlert(`「${targetCp.name || 'スポット'}」は既にチェックイン済みです！`, '獲得済み', 'warning');
          }

          if (targetCp.sectionId) {
            setActiveSectionId(targetCp.sectionId);
          }
        }
        // Clean URL query param so refresh doesn't trigger it again
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }
    } catch (err) {
      console.error("Error loading DB in App:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDb();
  }, []);

  useEffect(() => {
    if (agreed && storage.load('has_seen_onboarding') !== true) {
      setShowOnboardingTour(true);
    }
  }, [agreed]);

  const handleCompleteOnboarding = () => {
    storage.save('has_seen_onboarding', true);
    setShowOnboardingTour(false);
  };

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

    if (settings.isAppStopped) {
      showAlert("現在サービス停止中のため、スタンプの獲得・チェックインはできません。", "サービス停止中", "error");
      return;
    }

    const lowerDecodedText = decodedText.toLowerCase();

    // Handle Staff Sync Request (Staff scans User)
    if (lowerDecodedText.startsWith(SYNC_PREFIX.USER_DATA)) {
      if (!isStaffDashboardOpen && !isStaffMode) {
        console.log("Sync request ignored: Staff dashboard not open.");
        return;
      }
      const userData = decodeSyncData(decodedText, SYNC_PREFIX.USER_DATA);
      if (userData) {
        setScannedUserData(userData);
      } else {
        showAlert("ユーザーデータの読み取りに失敗しました。QRコードを再表示してください。", "読み取りエラー", "error");
      }
      return;
    }

    // Handle Sync Response (User scans Staff)
    if (lowerDecodedText.startsWith(SYNC_PREFIX.STAFF_DATA)) {
      const updatedData = decodeSyncData(decodedText, SYNC_PREFIX.STAFF_DATA);
      if (updatedData) {
        if (updatedData.nonce !== currentSyncNonce) {
          showAlert("この同期用QRコードはあなたの端末用ではありません。別のユーザーのデータである可能性があります。", "同期対象外", "warning");
          return;
        }

        const validSpotIds = checkpoints.map(cp => cp.qrId || cp.id);
        const filteredSyncedStamps = (updatedData.stamps || []).filter(id => validSpotIds.includes(id));

        setStamps(filteredSyncedStamps);
        setIsExchanged(updatedData.isExchanged || false);
        setIsDismissed(updatedData.isDismissed || false);
        saveState(filteredSyncedStamps, updatedData.isExchanged, updatedData.isDismissed);
        setCurrentSyncNonce(null);
        showAlert("データ同期が完了しました！", "同期完了", "success");
      } else {
        showAlert("同期データの復号に失敗しました。", "同期エラー", "error");
      }
      return;
    }

    // Normal Stamp Scan (extract UUID if text is a URL)
    let qrId = decodedText;
    if (qrId.includes('http://') || qrId.includes('https://') || qrId.includes('?')) {
      try {
        const urlObj = new URL(qrId, window.location.origin);
        const stampParam = urlObj.searchParams.get('stamp') || urlObj.searchParams.get('qr');
        if (stampParam) qrId = stampParam;
      } catch {
        // Fallthrough
      }
    }

    // 全チェックポイントから一致するものを取得（複数エリアでの同一QR共用に対応）
    const matchingCps = checkpoints.filter(cp => (cp.qrId || cp.id) === qrId || cp.id === qrId);

    if (matchingCps.length === 0) {
      showAlert("該当するチェックポイントが見つかりませんでした。", "スキャンエラー", "error");
      return;
    }

    // 既にいずれかのエリアでコンプリート達成済みの場合は他エリアのスタンプ獲得をブロック（規約: お一人様1エリアまで）
    if (completedSection) {
      const isTargetInCompletedSection = matchingCps.some(cp => cp.sectionId === completedSection.id);
      if (!isTargetInCompletedSection) {
        showAlert(
          `既に「${completedSection.name}」でコンプリートを達成しているため、他のエリアのスタンプは獲得できません。`,
          'スタンプ獲得不可',
          'warning'
        );
        return;
      }
    }

    // 1. 現在選択中のエリア内のCPがあればそれを優先
    let targetCp = matchingCps.find(cp => cp.sectionId === activeSectionId);

    // 2. 現在のエリアになければ他エリアのCP
    const isOutOfArea = !targetCp;
    if (!targetCp) {
      targetCp = matchingCps[0];
    }

    const targetSec = sections.find(s => s.id === targetCp.sectionId);
    const secName = targetSec ? targetSec.name : '別エリア';
    const spotIdsToAcquire = matchingCps.map(cp => cp.qrId || cp.id);

    // 選択中エリア外の場合 ➔ 確認ダイアログを表示
    if (isOutOfArea && targetCp.sectionId) {
      setPendingOutAreaScan({
        targetCp,
        matchingCps,
        secName,
        spotIdsToAcquire
      });
      return;
    }

    // 同一エリア内スキャンの場合
    const unacquiredIds = spotIdsToAcquire.filter(id => !stamps.includes(id));
    if (unacquiredIds.length > 0) {
      const newStamps = [...stamps, ...unacquiredIds];
      setStamps(newStamps);
      saveState(newStamps, isExchanged, isDismissed);
      showAlert(`「${targetCp.name || 'スポット'}」のスタンプを獲得しました！`, "スタンプ獲得", "success");
    } else {
      showAlert("このスポットは既にチェックイン済みです！", "獲得済み", "warning");
    }
  };

  // エリア外スタンプ獲得＆エリア変更の承認実行ハンドラー
  const handleConfirmOutAreaScan = () => {
    if (!pendingOutAreaScan) return;
    const { targetCp, secName, spotIdsToAcquire } = pendingOutAreaScan;

    // 選択エリア変更 ＆ localStorageへ保存
    handleSelectSection(targetCp.sectionId);

    const unacquiredIds = spotIdsToAcquire.filter(id => !stamps.includes(id));
    if (unacquiredIds.length > 0) {
      const newStamps = [...stamps, ...unacquiredIds];
      setStamps(newStamps);
      saveState(newStamps, isExchanged, isDismissed);
      showAlert(`「${targetCp.name || 'スポット'}」のスタンプを獲得し、エリアを「${secName}」に変更しました！`, "スタンプ獲得＆エリア移動", "success");
    } else {
      showAlert(`エリアを「${secName}」に変更しました。（スタンプは獲得済みです）`, "エリア移動完了", "info");
    }

    setPendingOutAreaScan(null);
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

  const handlePasscodeSubmit = async (e) => {
    e.preventDefault();

    let isAdminValid = false;
    let isStaffValid = false;

    if (isSupabaseConfigured && supabase) {
      const { data: isAdmin } = await supabase.rpc('verify_passcode', { p_passcode: passcodeInput, p_type: 'admin' });
      if (isAdmin) {
        isAdminValid = true;
      } else {
        const { data: isStaff } = await supabase.rpc('verify_passcode', { p_passcode: passcodeInput, p_type: 'staff' });
        if (isStaff) isStaffValid = true;
      }
    } else {
      showAlert("データベースが設定されていないため、管理者・スタッフ機能は利用できません。", "DB未設定", "warning");
      setPasscodeInput("");
      return;
    }

    if (isAdminValid) {
      if (isSupabaseConfigured) setAdminAuth(passcodeInput);
      setIsAdminMode(true);
      setShowPasscode(false);
      setPasscodeInput("");
    } else if (isStaffValid) {
      setIsStaffMode(true);
      saveState(stamps, isExchanged, isDismissed, true);
      setShowPasscode(false);
      setPasscodeInput("");
    } else {
      showAlert("入力されたパスコードが正しくありません。", "認証エラー", "error");
      setPasscodeInput("");
    }
  };

  // 達成済みエリアの算出 (規約: お一人様1エリアまで)
  const completedSection = sections.find(sec => {
    const secCps = checkpoints.filter(cp => cp.sectionId === sec.id);
    return secCps.length > 0 && secCps.every(cp => stamps.includes(cp.qrId || cp.id));
  }) || null;

  const handleSelectSection = (secId) => {
    if (completedSection && secId !== completedSection.id) {
      const targetSec = sections.find(s => s.id === secId);
      showAlert(
        `既に「${completedSection.name}」でエリアコンプリートを達成しているため、他のエリア（${targetSec ? targetSec.name : '選択エリア'}）での追加コンプリート・特典獲得はできません。`,
        'コンプリート達成済み',
        'warning'
      );
    }
    setActiveSectionId(secId);
    storage.save('selected_section_id', secId);
  };

  useEffect(() => {
    if (showPasscode || isMapOpen || isTermsModalOpen || isScanning || isUserSyncModalOpen || isStaffDashboardOpen || isAdminMode || isAreaModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showPasscode, isMapOpen, isTermsModalOpen, isScanning, isUserSyncModalOpen, isStaffDashboardOpen, isAdminMode, isAreaModalOpen]);

  // Loading Screen (Data Loading / Parsing Overlay)
  if (isLoading) {
    return (
      <div className="app-loading-container">
        <div className="loading-card">
          <Loader2 size={48} className="spin-icon-slow" />
        </div>
      </div>
    );
  }

  // Master Admin Mode (Separate DB Management View) - Access allowed even if stopped
  if (isAdminMode) {
    return (
      <div className="app-container">
        <AdminDashboard
          onClose={() => {
            setIsAdminMode(false);
            loadDb();
          }}
          onSettingsChange={(newSettings) => {
            setSettings(newSettings);
          }}
          isFullView={true}
        />
      </div>
    );
  }

  // App Stopped Screen (Forced Overriding Protection View)
  if (settings.isAppStopped) {
    return (
      <div className="app-stopped-container">
        <div className="stopped-card">
          <div className="stopped-icon">
            <AlertTriangle size={64} />
          </div>
          <h1>サービス停止中</h1>
          <p>現在、「なずな祭街歩きスタンプラリー」はサービスを停止しております。</p>
          <p>開催期間外、またはメンテナンス中の可能性があります。</p>
          <div className="stopped-footer">
            <p
              className="copyright-stopped"
              onClick={() => {
                const newCount = syncTapCount + 1;
                if (newCount >= 3) {
                  setShowPasscode(true);
                  setSyncTapCount(0);
                } else {
                  setSyncTapCount(newCount);
                  setTimeout(() => setSyncTapCount(0), 3000);
                }
              }}
            >
              ©2026 なずな祭実行委員会
            </p>
          </div>
        </div>

        {showPasscode && (
          <div className="debug-passcode-overlay" onClick={() => setShowPasscode(false)}>
            <div className="passcode-card" onClick={e => e.stopPropagation()}>
              <button className="passcode-close" onClick={() => setShowPasscode(false)}>
                <X size={20} />
              </button>
              <h3>管理者認証</h3>
              <p>アクセスパスコードを入力してください</p>
              <form onSubmit={handlePasscodeSubmit}>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={10}
                  value={passcodeInput}
                  onChange={e => setPasscodeInput(e.target.value)}
                  autoFocus
                  placeholder="****"
                />
                <button type="submit" className="btn-primary">認証</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Staff Mode (On-site Staff Operations View)
  if (isStaffMode) {
    return (
      <div className="app-container">
        <StaffDashboard
          initialScannedData={scannedUserData}
          onClose={() => {
            setScannedUserData(null);
            loadDb();
          }}
          onScanUser={() => {
            setIsScanning(!isScanning);
          }}
          isScanning={isScanning}
          isStaffMode={true}
          checkpoints={checkpoints}
          sections={sections}
          onExitStaffMode={() => {
            setIsStaffMode(false);
            saveState(stamps, isExchanged, isDismissed, false);
            loadDb();
          }}
        />
        {isScanning && (
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onCancel={handleCancelScan}
            isStaffDashboardOpen={true}
            checkpoints={checkpoints}
          />
        )}
      </div>
    );
  }

  if (!agreed) {
    return <EntryGuard onAgreed={() => setAgreed(true)} />;
  }

  // Completion Condition: Check if current active section is 100% complete
  const currentSecCps = checkpoints.filter(cp => cp.sectionId === activeSectionId);
  const isCurrentSectionComplete = currentSecCps.length > 0 && currentSecCps.every(cp => stamps.includes(cp.qrId || cp.id));

  // Qualification for Reward: If ANY single section has 100% of its checkpoints stamped
  const isAnySectionComplete = sections.length > 0 && sections.some(sec => {
    const secCps = checkpoints.filter(cp => cp.sectionId === sec.id);
    return secCps.length > 0 && secCps.every(cp => stamps.includes(cp.qrId || cp.id));
  });

  const isComplete = isAnySectionComplete;

  return (
    <div className="app-container">
      {isScanning ? (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onCancel={handleCancelScan}
          isStaffDashboardOpen={isStaffDashboardOpen}
          checkpoints={checkpoints}
        />
      ) : (
        <>
          <StampCard
            stamps={stamps}
            sections={sections}
            checkpoints={checkpoints}
            activeSectionId={activeSectionId}
            completedSection={completedSection}
            onSectionChange={handleSelectSection}
            onOpenAreaModal={() => setIsAreaModalOpen(true)}
            onOpenMap={toggleMap}
            isComplete={isCurrentSectionComplete}
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
                  const nonce = Math.random().toString(36).substring(2, 10);
                  setCurrentSyncNonce(nonce);
                  setIsUserSyncModalOpen(true);
                  setSyncTapCount(0);
                } else {
                  setSyncTapCount(newCount);
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
        </>
      )}

      {agreed && showOnboardingTour && !isScanning && !isStaffDashboardOpen && !isAdminMode && (
        <OnboardingTour onComplete={handleCompleteOnboarding} />
      )}

      {isMapOpen && (
        <MapModal
          activeSectionId={activeSectionId}
          onOpenAreaModal={() => setIsAreaModalOpen(true)}
          onClose={() => setIsMapOpen(false)}
        />
      )}

      {isAreaModalOpen && (
        <AreaSelectModal
          sections={sections}
          checkpoints={checkpoints}
          stamps={stamps}
          activeSectionId={activeSectionId}
          onSelectSection={handleSelectSection}
          onClose={() => setIsAreaModalOpen(false)}
          isCancelable={!!activeSectionId}
        />
      )}

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
            loadDb();
          }}
          onScanUser={() => {
            setIsScanning(!isScanning);
          }}
          isScanning={isScanning}
          checkpoints={checkpoints}
          sections={sections}
        />
      )}

      {showPasscode && (
        <div className="debug-passcode-overlay" onClick={() => setShowPasscode(false)}>
          <div className="passcode-card" onClick={e => e.stopPropagation()}>
            <button className="passcode-close" onClick={() => setShowPasscode(false)}>
              <X size={20} />
            </button>
            <h3>管理者認証</h3>
            <p>アクセスパスコードを入力してください</p>

            <form onSubmit={handlePasscodeSubmit}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={10}
                value={passcodeInput}
                onChange={e => setPasscodeInput(e.target.value)}
                autoFocus
                placeholder="****"
              />
              <button type="submit" className="btn-primary">認証</button>
            </form>
          </div>
        </div>
      )}

      <CustomAlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />

      <CustomConfirmModal
        isOpen={!!pendingOutAreaScan}
        title="選択中のエリア外のスポットです"
        secName={pendingOutAreaScan?.secName}
        spotName={pendingOutAreaScan?.targetCp?.name || 'チェックポイント'}
        message="スタンプを獲得して、選択中エリアを移動しますか？"
        confirmText="獲得してエリア移動"
        cancelText="キャンセル"
        onConfirm={handleConfirmOutAreaScan}
        onCancel={() => setPendingOutAreaScan(null)}
      />
    </div>
  );
}

export default App;
