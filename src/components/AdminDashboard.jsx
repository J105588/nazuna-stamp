import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import {
  X,
  Layers,
  MapPin,
  Plus,
  Edit,
  Trash2,
  QrCode,
  RotateCcw,
  Building2,
  Settings,
  Power,
  KeyRound,
  Save,
  Check,
  RefreshCw,
  Navigation,
  Download,
  FolderDown,
  FolderArchive,
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Share2
} from 'lucide-react';
import { stampDb, generateUUID } from '../utils/stampDb';
import { isSupabaseConfigured } from '../lib/supabase';
import CustomAlertModal from './CustomAlertModal';

const AdminDashboard = ({ onClose, isFullView = true, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState('spots'); // 'spots' | 'settings'
  const [sections, setSections] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [settings, setSettings] = useState({
    isAppStopped: false,
    staffPasscode: "",
    adminPasscode: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  // Custom Alert Modal State
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = (message, title = '', type = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  // Settings form state
  const [isAppStopped, setIsAppStopped] = useState(false);
  const [staffPasscode, setStaffPasscode] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Section Form state
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editSectionName, setEditSectionName] = useState('');
  const [editSectionDesc, setEditSectionDesc] = useState('');

  // Checkpoint Form state
  const [addingCheckpointSectionId, setAddingCheckpointSectionId] = useState(null);
  const [newCpLat, setNewCpLat] = useState('');
  const [newCpLon, setNewCpLon] = useState('');
  const [newCpName, setNewCpName] = useState('');
  const [newCpDesc, setNewCpDesc] = useState('');
  const [newCpOrder, setNewCpOrder] = useState('');
  const [newCpStampIcon, setNewCpStampIcon] = useState('');
  const [newCpCustomQrId, setNewCpCustomQrId] = useState('');
  const [editingCpId, setEditingCpId] = useState(null);
  const [editCpLat, setEditCpLat] = useState('');
  const [editCpLon, setEditCpLon] = useState('');
  const [editCpName, setEditCpName] = useState('');
  const [editCpDesc, setEditCpDesc] = useState('');
  const [editCpOrder, setEditCpOrder] = useState('');
  const [editCpStampIcon, setEditCpStampIcon] = useState('');

  // QR Modal preview
  const [previewQrItem, setPreviewQrItem] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [secData, cpData, settingsData] = await Promise.all([
        stampDb.getSectionsAsync(),
        stampDb.getCheckpointsAsync(),
        stampDb.getSettingsAsync()
      ]);
      setSections(secData);
      setCheckpoints(cpData);
      setSettings(settingsData);
      setIsAppStopped(settingsData.isAppStopped || false);
      setStaffPasscode(settingsData.staffPasscode || "");
      setAdminPasscode(settingsData.adminPasscode || "");
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // System Settings Handlers
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updated = await stampDb.updateSettingsAsync({
        isAppStopped,
        staffPasscode: staffPasscode.trim(),
        adminPasscode: adminPasscode.trim()
      });
      setSettings(updated);
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 3000);
      if (onSettingsChange) onSettingsChange(updated);
    } catch (err) {
      showAlert('設定の保存に失敗しました: ' + err.message, '保存エラー', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Section Handlers
  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    setIsLoading(true);
    try {
      await stampDb.addSectionAsync(newSectionName.trim(), newSectionDesc.trim());
      setNewSectionName('');
      setNewSectionDesc('');
      await loadData();
    } catch (err) {
      showAlert('セクションの追加に失敗しました: ' + err.message, '追加エラー', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSection = async (id) => {
    if (!editSectionName.trim()) return;
    setIsLoading(true);
    try {
      await stampDb.updateSectionAsync(id, {
        name: editSectionName.trim(),
        description: editSectionDesc.trim()
      });
      setEditingSectionId(null);
      await loadData();
    } catch (err) {
      showAlert('セクションの更新に失敗しました: ' + err.message, '更新エラー', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSection = async (id) => {
    if (window.confirm('このセクションと関連する全チェックポイントを削除しますか？')) {
      setIsLoading(true);
      try {
        await stampDb.deleteSectionAsync(id);
        await loadData();
      } catch (err) {
        showAlert('セクションの削除に失敗しました: ' + err.message, '削除エラー', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Checkpoint Handlers
  const handleAddCheckpoint = async (sectionId, e) => {
    e.preventDefault();
    if (!newCpLat || !newCpLon) {
      showAlert('緯度および経度を入力してください。', '入力エラー', 'warning');
      return;
    }
    const sectionCps = checkpoints.filter(cp => cp.sectionId === sectionId);
    const maxAllowedOrder = sectionCps.length + 1;
    let finalOrder = newCpOrder !== '' ? parseInt(newCpOrder, 10) : maxAllowedOrder;
    if (finalOrder > maxAllowedOrder || finalOrder < 1) {
      showAlert(`順番は登録されている個数内（1〜${maxAllowedOrder}）で指定してください。`, '順番指定エラー', 'warning');
      return;
    }
    const isDuplicate = sectionCps.some(cp => cp.order === finalOrder);
    if (isDuplicate) {
      showAlert(`順番 [${finalOrder}] は既に別のスポットで使用されています。重複しない番号を指定してください。`, '重複エラー', 'warning');
      return;
    }

    setIsLoading(true);
    const newUuid = newCpCustomQrId.trim() || generateUUID();
    try {
      await stampDb.addCheckpointAsync({
        lat: parseFloat(newCpLat),
        lon: parseFloat(newCpLon),
        sectionId,
        qrId: newUuid,
        name: newCpName || undefined,
        description: newCpDesc || undefined,
        stampIcon: newCpStampIcon || undefined,
        order: finalOrder
      });
      setAddingCheckpointSectionId(null);
      setNewCpLat('');
      setNewCpLon('');
      setNewCpName('');
      setNewCpDesc('');
      setNewCpOrder('');
      setNewCpStampIcon('');
      setNewCpCustomQrId('');
      await loadData();
    } catch (err) {
      showAlert('チェックポイントの追加に失敗しました: ' + err.message, '追加エラー', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCheckpoint = async (id) => {
    if (!editCpLat || !editCpLon) return;
    const targetCp = checkpoints.find(c => c.id === id);
    const sectionCps = checkpoints.filter(cp => cp.sectionId === targetCp?.sectionId);
    const maxAllowedOrder = sectionCps.length;
    let finalOrder = editCpOrder !== '' ? parseInt(editCpOrder, 10) : (targetCp?.order || 1);
    if (finalOrder > maxAllowedOrder || finalOrder < 1) {
      showAlert(`順番は登録されている個数内（1〜${maxAllowedOrder}）で指定してください。`, '順番指定エラー', 'warning');
      return;
    }
    const isDuplicate = sectionCps.some(cp => cp.id !== id && cp.order === finalOrder);
    if (isDuplicate) {
      showAlert(`順番 [${finalOrder}] は既に別のスポットで使用されています。重複しない番号を指定してください。`, '重複エラー', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await stampDb.updateCheckpointAsync(id, {
        lat: parseFloat(editCpLat),
        lon: parseFloat(editCpLon),
        name: editCpName || undefined,
        description: editCpDesc || undefined,
        stampIcon: editCpStampIcon || undefined,
        order: finalOrder
      });
      setEditingCpId(null);
      setEditCpLat('');
      setEditCpLon('');
      setEditCpName('');
      setEditCpDesc('');
      setEditCpOrder('');
      setEditCpStampIcon('');
      await loadData();
    } catch (err) {
      showAlert('チェックポイントの更新に失敗しました: ' + err.message, '更新エラー', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCheckpoint = async (id) => {
    if (window.confirm('このチェックポイントを削除しますか？')) {
      setIsLoading(true);
      try {
        await stampDb.deleteCheckpointAsync(id);
        await loadData();
      } catch (err) {
        showAlert('チェックポイントの削除に失敗しました: ' + err.message, '削除エラー', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 人間が読める形式のファイル名を出力するヘルパー (例: 市川真間駅エリア_01_北口ロータリー.png)
  const getHumanReadableFileName = (checkpoint, sectionName = '') => {
    const orderNum = checkpoint.order || 1;
    const orderStr = String(orderNum).padStart(2, '0');
    const secNameRaw = (sectionName || checkpoint.sectionName || '').trim();
    const cpNameRaw = (checkpoint.name || checkpoint.displayName || `スポット${orderNum}`).trim();

    // OSファイル名として使用不可な文字（\ / : * ? " < > |）を全角またはアンダースコアに安全置換
    const safeSec = secNameRaw.replace(/[/\\?%*:|"<>]/g, '_');
    const safeCp = cpNameRaw.replace(/[/\\?%*:|"<>]/g, '_');

    if (safeSec) {
      return `${safeSec}_${orderStr}_${safeCp}.png`;
    }
    return `${orderStr}_${safeCp}.png`;
  };

  // CanvasからPNG DataURLを生成する関数
  const getQrCanvasDataUrl = (checkpoint, sectionName = '', targetSvgElement = null) => {
    return new Promise((resolve) => {
      const qrId = checkpoint.qrId || checkpoint.id;
      const cpName = checkpoint.name || checkpoint.displayName || 'チェックポイント';
      const displaySecName = sectionName || checkpoint.sectionName || '';
      const qrUrl = `${window.location.origin}${window.location.pathname}?stamp=${qrId}`;

      const targetSvg = targetSvgElement ||
                        document.querySelector(`.qr-svg-item-${qrId}`) ||
                        document.querySelector('.qr-container-large svg');

      if (!targetSvg) {
        resolve(null);
        return;
      }

      try {
        const xml = new XMLSerializer().serializeToString(targetSvg);
        const svg64 = btoa(unescape(encodeURIComponent(xml)));
        const imageSrc = `data:image/svg+xml;base64,${svg64}`;

        const canvas = document.createElement('canvas');
        const width = 1000;
        const height = 1120;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
          // 背景 (白)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // 外枠
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 8;
          ctx.strokeRect(30, 30, width - 60, height - 60);

          // セクション名
          if (displaySecName) {
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 36px "Inter", "Noto Sans JP", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(displaySecName, width / 2, 110);
          }

          // スポット名
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 46px "Inter", "Noto Sans JP", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(cpName, width / 2, displaySecName ? 175 : 130);

          // QRコード画像 (640x640)
          const qrSize = 640;
          const qrX = (width - qrSize) / 2;
          const qrY = displaySecName ? 220 : 170;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

          // フッター URL & タイトル
          ctx.fillStyle = '#334155';
          ctx.font = '26px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(qrUrl, width / 2, height - 130);

          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 24px "Inter", "Noto Sans JP", sans-serif';
          ctx.fillText('なずな祭 スタンプラリー', width / 2, height - 75);

          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = imageSrc;
      } catch (err) {
        console.error("Canvas render error:", err);
        resolve(null);
      }
    });
  };

  // 単体QRコードのPNGダウンロード処理
  const handleDownloadQrCode = async (checkpoint, sectionName = '') => {
    const dataUrl = await getQrCanvasDataUrl(checkpoint, sectionName);
    if (dataUrl) {
      const fileName = getHumanReadableFileName(checkpoint, sectionName);
      const a = document.createElement('a');
      a.download = fileName;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      setPreviewQrItem({ ...checkpoint, displayName: checkpoint.name || 'チェックポイント', sectionName });
      setTimeout(async () => {
        const el = document.querySelector('.qr-container-large svg');
        if (el) {
          const url = await getQrCanvasDataUrl(checkpoint, sectionName, el);
          if (url) {
            const fileName = getHumanReadableFileName(checkpoint, sectionName);
            const a = document.createElement('a');
            a.download = fileName;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      }, 150);
    }
  };

  // 複数チェックポイントの.zip一括ダウンロード処理
  const handleBulkZipDownload = async (targetCheckpoints, targetSectionName = '') => {
    if (!targetCheckpoints || targetCheckpoints.length === 0) {
      alert('ダウンロード対象のチェックポイントがありません。');
      return;
    }

    setIsLoading(true);
    const zip = new JSZip();

    try {
      for (let i = 0; i < targetCheckpoints.length; i++) {
        const cp = targetCheckpoints[i];
        const secName = targetSectionName || sections.find(s => s.id === cp.sectionId)?.name || '未設定エリア';
        const orderNum = cp.order || (i + 1);
        const orderStr = String(orderNum).padStart(2, '0');
        const cpName = cp.name || cp.displayName || `スポット${orderNum}`;

        const safeSec = secName.trim().replace(/[/\\?%*:|"<>]/g, '_');
        const safeCp = cpName.trim().replace(/[/\\?%*:|"<>]/g, '_');

        // 画面上のプレビューコンテナにQRCodeを描画
        setPreviewQrItem({ ...cp, displayName: cpName, sectionName: secName });

        // レンダリング待機
        await new Promise(r => setTimeout(r, 180));

        const svgEl = document.querySelector('.qr-container-large svg');
        if (svgEl) {
          const base64Png = await getQrCanvasDataUrl(cp, secName, svgEl);
          if (base64Png) {
            const base64Data = base64Png.replace(/^data:image\/png;base64,/, '');

            // ZIP構造: 単一セクション指定の場合は直下にファイル、全セクション一括の場合はフォルダ分け
            const filePath = targetSectionName
              ? `${orderStr}_${safeCp}.png`
              : `${safeSec}/${orderStr}_${safeCp}.png`;

            zip.file(filePath, base64Data, { base64: true });
          }
        }
      }

      setPreviewQrItem(null);

      // ZIPファイル生成
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const archiveFileName = targetSectionName
        ? `${targetSectionName.trim().replace(/[/\\?%*:|"<>]/g, '_')}_QRコード集.zip`
        : `スタンプラリー_全QRコード集.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = archiveFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      console.error("ZIP generation error:", err);
      alert("ZIPファイルの生成中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLatChange = (e, setLat, setLon) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',');
      if (parts.length === 2) {
        const parsedLat = parts[0].trim();
        const parsedLon = parts[1].trim();
        if (!isNaN(parseFloat(parsedLat)) && !isNaN(parseFloat(parsedLon))) {
          setLat(parsedLat);
          setLon(parsedLon);
          return;
        }
      }
    }
    setLat(val);
  };

  const handleGetCurrentLocation = (setLat, setLon) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLon(position.coords.longitude.toString());
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert("位置情報の取得に失敗しました。デバイスやブラウザの設定を確認してください。");
        },
        { enableHighAccuracy: true }
      );
    } else {
      showAlert("お使いのブラウザは位置情報に対応していません。", "位置情報エラー", "warning");
    }
  };

  const handleSharedQrSelect = (selectedQrId) => {
    setNewCpCustomQrId(selectedQrId);
    if (!selectedQrId) return;

    const sourceCp = checkpoints.find(cp => (cp.qrId || cp.id) === selectedQrId || cp.id === selectedQrId);
    if (sourceCp) {
      if (sourceCp.name) setNewCpName(sourceCp.name);
      if (sourceCp.description) setNewCpDesc(sourceCp.description);
      if (sourceCp.lat) setNewCpLat(String(sourceCp.lat));
      if (sourceCp.lon) setNewCpLon(String(sourceCp.lon));
      if (sourceCp.stampIcon) setNewCpStampIcon(sourceCp.stampIcon);
    }
  };

  const handleQuickShareAdd = async (sourceCp, targetSectionId) => {
    setIsLoading(true);
    const sectionCps = checkpoints.filter(cp => cp.sectionId === targetSectionId);
    const maxAllowedOrder = sectionCps.length + 1;

    try {
      await stampDb.addCheckpointAsync({
        lat: sourceCp.lat,
        lon: sourceCp.lon,
        sectionId: targetSectionId,
        qrId: sourceCp.qrId || sourceCp.id,
        name: sourceCp.name || undefined,
        description: sourceCp.description || undefined,
        stampIcon: sourceCp.stampIcon || undefined,
        order: maxAllowedOrder
      });
      await loadData();
      showAlert(`「${sourceCp.name || 'スポット'}」をこのエリアに同一条件で共有追加しました！`, '共有追加完了', 'success');
    } catch (err) {
      showAlert('共有追加に失敗しました: ' + err.message, 'エラー', 'error');
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e, setStampIcon) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 384;
        let width = img.width;
        let height = img.height;

        const size = Math.min(width, height);
        const offsetX = (width - size) / 2;
        const offsetY = (height - size) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, MAX_SIZE, MAX_SIZE);

        const base64Str = canvas.toDataURL('image/webp', 0.92);
        setStampIcon(base64Str);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleResetDb = async () => {
    if (window.confirm('DB設定（セクション・チェックポイント・認証情報）を消去・リセットしますか？')) {
      setIsLoading(true);
      try {
        await stampDb.resetToDefaultsAsync();
        await loadData();
      } catch (err) {
        alert('DBのリセットに失敗しました: ' + err.message);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={isFullView ? "admin-full-page" : "admin-modal-overlay"}>
      <div className="admin-dashboard-container">
        <header className="admin-header-compact">
          <div className="admin-title-compact">
            <Layers size={18} className="admin-icon" />
            <span>管理パネル</span>
            <span className="admin-badge-compact">
              {isSupabaseConfigured ? 'REMOTE SYNC' : 'LOCAL'}
            </span>
          </div>
          <div className="admin-header-actions">
            <button className="btn-icon-compact" onClick={loadData} title="最新データを再読み込み">
              <RefreshCw size={15} className={isLoading ? "spin-icon" : ""} />
            </button>
            <button className="admin-close-btn-compact" onClick={onClose} title="管理画面を閉じる">
              <X size={18} />
              <span>閉じる</span>
            </button>
          </div>
        </header>

        <div className="admin-body">
          {/* DASHBOARD STATS SUMMARY BAR */}
          <div className="admin-summary-bar">
            <div className="summary-card">
              <div className="summary-icon sec-icon">
                <Building2 size={22} />
              </div>
              <div className="summary-info">
                <span className="summary-label">エリアセクション</span>
                <span className="summary-value">{sections.length} <small>エリア</small></span>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon cp-icon">
                <MapPin size={22} />
              </div>
              <div className="summary-info">
                <span className="summary-label">全チェックポイント</span>
                <span className="summary-value">{checkpoints.length} <small>箇所</small></span>
              </div>
            </div>

            <div className="summary-card">
              <div className={`summary-icon status-icon ${isAppStopped ? 'stopped' : 'running'}`}>
                <Power size={22} />
              </div>
              <div className="summary-info">
                <span className="summary-label">サービス稼働状況</span>
                <span className={`summary-value status-text ${isAppStopped ? 'stopped' : 'running'}`}>
                  {isAppStopped ? '停止中 (STOPPED)' : '正常稼働中'}
                </span>
              </div>
            </div>

            {checkpoints.length > 0 && (
              <button
                type="button"
                className="summary-card action-card-btn"
                onClick={() => handleBulkZipDownload(checkpoints)}
                disabled={isLoading}
                title="登録されている全QRコードをZIPアーカイブで保存"
              >
                <div className="summary-icon zip-icon">
                  <FolderArchive size={22} />
                </div>
                <div className="summary-info">
                  <span className="summary-label">全QR一括保存</span>
                  <span className="summary-value-action">ZIPダウンロード ➔</span>
                </div>
              </button>
            )}
          </div>

          {/* TAB NAVIGATION HEADER */}
          <div className="admin-tabs-nav">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'spots' ? 'active' : ''}`}
              onClick={() => setActiveTab('spots')}
            >
              <Building2 size={18} />
              <span>エリア・スポット管理 ({checkpoints.length})</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'qr_mapping' ? 'active' : ''}`}
              onClick={() => setActiveTab('qr_mapping')}
            >
              <QrCode size={18} />
              <span>QR紐づけ＆共用マップ</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              <span>システム設定・パスコード</span>
            </button>
          </div>

          {/* TAB 1: SPOTS & SECTIONS MANAGEMENT */}
          {activeTab === 'spots' && (
            <div className="tab-content-pane">
              {/* Add Section Card */}
              <div className="db-card add-section-card">
                <h4><Building2 size={18} /> 新規駅セクション（エリア）の追加</h4>
                <form onSubmit={handleAddSection} className="db-form">
                  <div className="add-section-form-group">
                    <input
                      type="text"
                      placeholder="駅・エリア名称 (例: 市川真間駅エリア)"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="エリアの説明・補足 (任意)"
                      value={newSectionDesc}
                      onChange={(e) => setNewSectionDesc(e.target.value)}
                    />
                    <button type="submit" className="btn-primary" disabled={isLoading}><Plus size={16} /> セクション追加</button>
                  </div>
                </form>
              </div>

          {/* Section & Checkpoint List */}
          {sections.length === 0 ? (
            <div className="db-card admin-empty-card">
              <Building2 size={36} className="empty-sec-icon" />
              <h4>登録されている駅セクションがありません</h4>
              <p>上記の「新規駅セクション追加」フォームから駅・エリアを登録し、チェックポイント（座標）を設定してください。</p>
            </div>
          ) : (
            <div className="section-list">
              {sections.map((section) => {
                const sectionCps = checkpoints
                  .filter(cp => cp.sectionId === section.id)
                  .sort((a, b) => (a.order || 0) - (b.order || 0));
                return (
                  <div key={section.id} className="db-card section-card">
                    <div className="section-card-header">
                      {editingSectionId === section.id ? (
                        <div className="inline-edit-form">
                          <input
                            type="text"
                            value={editSectionName}
                            onChange={(e) => setEditSectionName(e.target.value)}
                          />
                          <input
                            type="text"
                            value={editSectionDesc}
                            onChange={(e) => setEditSectionDesc(e.target.value)}
                          />
                          <button className="btn-small-primary" onClick={() => handleUpdateSection(section.id)}>保存</button>
                          <button className="btn-small-secondary" onClick={() => setEditingSectionId(null)}>キャンセル</button>
                        </div>
                      ) : (
                        <>
                          <div className="section-info">
                            <span className="section-name">{section.name}</span>
                            {section.description && <span className="section-desc">{section.description}</span>}
                            <span className="cp-count-tag">{sectionCps.length} 個のスポット</span>
                          </div>
                          <div className="section-actions">
                            {sectionCps.length > 0 && (
                              <button
                                className="btn-icon"
                                onClick={() => handleBulkZipDownload(sectionCps, section.name)}
                                title={`${section.name}の全QRコードをZIPでダウンロード`}
                              >
                                <FolderArchive size={16} />
                              </button>
                            )}
                            <button
                              className="btn-icon"
                              onClick={() => {
                                setEditingSectionId(section.id);
                                setEditSectionName(section.name);
                                setEditSectionDesc(section.description || '');
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button className="btn-icon danger" onClick={() => handleDeleteSection(section.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Checkpoints List in Section */}
                    <div className="checkpoint-list">
                      {sectionCps.map((cp, cpIdx) => (
                        <div key={cp.id} className="checkpoint-item">
                          {editingCpId === cp.id ? (
                            <div className="inline-edit-cp-form">
                              <div className="form-group-row">
                                <input
                                  type="text"
                                  value={editCpName}
                                  onChange={(e) => setEditCpName(e.target.value)}
                                  placeholder="スポット名"
                                />
                                <input
                                  type="number"
                                  value={editCpOrder}
                                  onChange={(e) => setEditCpOrder(e.target.value)}
                                  placeholder="順番 (例: 1, 2, 3)"
                                  style={{ width: '110px' }}
                                />
                              </div>
                              <input
                                type="text"
                                value={editCpDesc}
                                onChange={(e) => setEditCpDesc(e.target.value)}
                                placeholder="説明文 (任意)"
                              />
                              <div className="geo-inputs">
                                <input
                                  type="text"
                                  value={editCpLat}
                                  onChange={(e) => handleLatChange(e, setEditCpLat, setEditCpLon)}
                                  placeholder="緯度 (lat)"
                                />
                                <input
                                  type="text"
                                  value={editCpLon}
                                  onChange={(e) => setEditCpLon(e.target.value)}
                                  placeholder="経度 (lon)"
                                />
                                <div className="stamp-icon-upload">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, setEditCpStampIcon)}
                                    style={{ maxWidth: '140px', fontSize: '0.8rem' }}
                                  />
                                  {editCpStampIcon && editCpStampIcon.startsWith('data:image') && (
                                    <img
                                      src={editCpStampIcon}
                                      alt="プレビュー"
                                      style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                  )}
                                  <button type="button" className="btn-icon" onClick={() => setEditCpStampIcon('')} title="画像をクリア">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => handleGetCurrentLocation(setEditCpLat, setEditCpLon)}
                                  title="現在地を取得"
                                >
                                  <Navigation size={18} />
                                </button>
                              </div>
                              <div className="form-actions">
                                <button className="btn-small-primary" onClick={() => handleUpdateCheckpoint(cp.id)}>保存</button>
                                <button className="btn-small-secondary" onClick={() => setEditingCpId(null)}>完了</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="cp-details">
                                <div className="cp-title-row">
                                  <MapPin size={16} className="cp-icon" />
                                  <strong className="cp-name">[No. {cp.order || (cpIdx + 1)}] {cp.name || `スポット ${cpIdx + 1}`}</strong>
                                </div>
                                {cp.description && <p className="cp-desc">{cp.description}</p>}
                                <div className="cp-geo-info">
                                  <span>緯度: {cp.lat} / 経度: {cp.lon}</span>
                                </div>
                                <div className="cp-uuid-info">
                                  <span className="uuid-label">固有識別子(UUID):</span>
                                  <code className="uuid-val">{cp.qrId || cp.id}</code>
                                </div>
                                {(() => {
                                  const qid = cp.qrId || cp.id;
                                  const sharedCps = checkpoints.filter(c => (c.qrId || c.id) === qid);
                                  const otherSecNames = sharedCps
                                    .filter(c => c.sectionId !== cp.sectionId)
                                    .map(c => sections.find(s => s.id === c.sectionId)?.name)
                                    .filter(Boolean);
                                  
                                  if (otherSecNames.length > 0) {
                                    return (
                                      <div className="cp-shared-badge" title="他のエリアでも共用されているQRコードです">
                                        <Share2 size={12} />
                                        <span>「{otherSecNames.join('」「')}」でも共用中</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>

                              <div className="cp-actions">
                                <button
                                  className="btn-qr-preview"
                                  onClick={() => setPreviewQrItem({ ...cp, displayName: cp.name || `スポット ${cpIdx + 1}`, sectionName: section.name })}
                                  title="QRコードを表示"
                                >
                                  <QrCode size={18} />
                                </button>
                                <button
                                  className="btn-qr-preview btn-qr-download"
                                  onClick={() => handleDownloadQrCode(cp, section.name)}
                                  title="QRコード(PNG)をダウンロード"
                                >
                                  <Download size={18} />
                                </button>
                                <button
                                  className="btn-icon"
                                  onClick={() => {
                                    setEditingCpId(cp.id);
                                    setEditCpName(cp.name || '');
                                    setEditCpDesc(cp.description || '');
                                    setEditCpLat(cp.lat);
                                    setEditCpLon(cp.lon);
                                    setEditCpOrder(cp.order || (cpIdx + 1));
                                    setEditCpStampIcon(cp.stampIcon || '');
                                  }}
                                >
                                  <Edit size={16} />
                                </button>
                                <button className="btn-icon danger" onClick={() => handleDeleteCheckpoint(cp.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {/* Add Checkpoint Form */}
                      {addingCheckpointSectionId === section.id ? (
                        <form onSubmit={(e) => handleAddCheckpoint(section.id, e)} className="add-cp-form">
                          <h5>新しいチェックポイント座標の追加</h5>
                          <div className="form-group-row">
                            <input
                              type="text"
                              value={newCpName}
                              onChange={(e) => setNewCpName(e.target.value)}
                              placeholder="スポット名"
                              style={{ flex: 2 }}
                            />
                            <input
                              type="number"
                              value={newCpOrder}
                              onChange={(e) => setNewCpOrder(e.target.value)}
                              placeholder="順番 (例: 1, 2, 3)"
                              style={{ flex: 1 }}
                            />
                          </div>
                          <input
                            type="text"
                            value={newCpDesc}
                            onChange={(e) => setNewCpDesc(e.target.value)}
                            placeholder="説明文 (任意)"
                            style={{ marginBottom: '8px' }}
                          />
                          <select
                            value={newCpCustomQrId}
                            onChange={(e) => handleSharedQrSelect(e.target.value)}
                            style={{ marginBottom: '10px', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', width: '100%' }}
                          >
                            <option value="">新規QRコードを自動生成（単独QR）</option>
                            {checkpoints.map(cp => {
                              const sec = sections.find(s => s.id === cp.sectionId);
                              return (
                                <option key={cp.id} value={cp.qrId || cp.id}>
                                  [既存QRを共用] {cp.name || 'スポット'} ({sec ? sec.name : '別エリア'})
                                </option>
                              );
                            })}
                          </select>
                          <div className="geo-inputs">
                            <input
                              type="text"
                              placeholder="緯度(lat) または 緯度,経度 をペースト"
                              value={newCpLat}
                              onChange={(e) => handleLatChange(e, setNewCpLat, setNewCpLon)}
                              required
                            />
                            <input
                              type="text"
                              placeholder="経度 (lon)"
                              value={newCpLon}
                              onChange={(e) => setNewCpLon(e.target.value)}
                              required
                            />
                            <div className="stamp-icon-upload" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, setNewCpStampIcon)}
                                style={{ maxWidth: '140px', fontSize: '0.8rem' }}
                              />
                              {newCpStampIcon && newCpStampIcon.startsWith('data:image') && (
                                <img
                                  src={newCpStampIcon}
                                  alt="プレビュー"
                                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              )}
                              <button type="button" className="btn-icon" onClick={() => setNewCpStampIcon('')} title="画像をクリア">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleGetCurrentLocation(setNewCpLat, setNewCpLon)}
                              title="現在地を取得"
                            >
                              <Navigation size={18} />
                            </button>
                          </div>
                          <div className="form-actions">
                            <button type="submit" className="btn-primary btn-small-primary" disabled={isLoading}>
                              <Plus size={14} /> UUIDを自動生成して保存
                            </button>
                            <button
                              type="button"
                              className="btn-small-secondary"
                              onClick={() => {
                                setAddingCheckpointSectionId(null);
                                setNewCpName('');
                                setNewCpDesc('');
                                setNewCpStampIcon('');
                              }}
                            >
                              キャンセル
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          className="btn-add-cp"
                          onClick={() => {
                            setAddingCheckpointSectionId(section.id);
                            setNewCpLat('');
                            setNewCpLon('');
                          }}
                        >
                          <Plus size={16} /> チェックポイント（座標）を追加
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          )}

          {/* TAB 2: QR CODE CROSS-MAPPING VIEW */}
          {activeTab === 'qr_mapping' && (
            <div className="tab-content-pane">
              <div className="db-card qr-mapping-card">
                <div className="qr-mapping-header">
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                      <QrCode size={20} /> ポスターQRコード (UUID) 紐づけ・共用マップ
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                      各QRコード（UUID）がどのエリアのどのスポットに紐づいているか、エリア間での共用状況を一目で一覧確認できます。
                    </p>
                  </div>
                </div>

                {checkpoints.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    チェックポイントがまだ登録されていません
                  </div>
                ) : (
                  <div className="qr-mapping-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {(() => {
                      // Group checkpoints by qrId / id
                      const groups = {};
                      checkpoints.forEach(cp => {
                        const qid = cp.qrId || cp.id;
                        if (!groups[qid]) groups[qid] = [];
                        groups[qid].push(cp);
                      });

                      return Object.entries(groups).map(([qid, groupCps]) => {
                        const isShared = groupCps.length > 1;
                        return (
                          <div 
                            key={qid} 
                            className={`qr-mapping-item-card ${isShared ? 'is-shared' : ''}`}
                            style={{
                              background: '#ffffff',
                              borderRadius: '16px',
                              border: isShared ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                              padding: '16px',
                              boxShadow: isShared ? '0 4px 16px rgba(59, 130, 246, 0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            <div className="qr-map-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <QrCode size={18} style={{ color: isShared ? '#2563eb' : '#64748b' }} />
                                <code style={{ fontSize: '0.78rem', fontWeight: '800', color: '#1e293b', background: '#f8fafc', padding: '2px 6px', borderRadius: '6px' }}>{qid.slice(0, 18)}...</code>
                              </div>
                              <div style={{
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: isShared ? '#eff6ff' : '#f1f5f9',
                                color: isShared ? '#1d4ed8' : '#475569',
                                border: isShared ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                              }}>
                                {isShared ? (
                                  <>
                                    <Share2 size={12} />
                                    <span>{groupCps.length}エリアで共用中</span>
                                  </>
                                ) : (
                                  <span>単独エリア</span>
                                )}
                              </div>
                            </div>

                            <div className="qr-map-locations-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>紐づき先スポット・エリア一覧:</span>
                              {groupCps.map((item, idx) => {
                                const sec = sections.find(s => s.id === item.sectionId);
                                return (
                                  <div 
                                    className="location-row-item" 
                                    key={item.id || idx}
                                    style={{
                                      background: '#f8fafc',
                                      borderRadius: '8px',
                                      padding: '8px 10px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px',
                                      border: '1px solid #e2e8f0'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        color: '#9b2d30',
                                        background: '#fff5f5',
                                        padding: '1px 8px',
                                        borderRadius: '10px',
                                        border: '1px solid #fecdd3',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}>
                                        <Building2 size={11} />
                                        {sec ? sec.name : '別エリア'}
                                      </span>
                                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{item.name || 'スポット'}</strong>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                      緯度: {item.lat} / 経度: {item.lon}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="qr-map-card-footer" style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                              <button
                                className="btn-small-primary"
                                style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                onClick={() => setPreviewQrItem({ ...groupCps[0], displayName: groupCps[0].name || 'スポット', sectionName: '共用QR' })}
                              >
                                <QrCode size={14} /> QR表示
                              </button>
                              <button
                                className="btn-small-secondary"
                                style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                onClick={() => handleDownloadQrCode(groupCps[0], '共用QR')}
                              >
                                <Download size={14} /> PNG保存
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM SETTINGS & SECURITY */}
          {activeTab === 'settings' && (
            <div className="tab-content-pane">
              {/* SYSTEM SETTINGS CARD */}
              <div className="db-card system-settings-card">
                <div className="card-header-row">
                  <h4><Settings size={18} /> システム基本設定 (パスコード & 稼働制御)</h4>
                  {settingsSavedMessage && (
                    <span className="saved-badge"><Check size={14} /> 保存しました</span>
                  )}
                </div>

                <form onSubmit={handleSaveSettings} className="settings-form">
                  <div className="setting-row power-toggle-row">
                    <div className="setting-info">
                      <span className="setting-label"><Power size={16} /> サービス稼働ステータス</span>
                      <span className="setting-subtext">「停止中」に切り替えると、一般ユーザーの画面でサービス停止案内が表示されます</span>
                    </div>
                    <button
                      type="button"
                      className={`btn-toggle-switch ${isAppStopped ? 'stopped' : 'running'}`}
                      onClick={() => setIsAppStopped(!isAppStopped)}
                    >
                      <Power size={16} />
                      <span>{isAppStopped ? 'サービス停止中 (STOPPED)' : '正常稼働中 (RUNNING)'}</span>
                    </button>
                  </div>

                  <div className="setting-passcodes-grid">
                    <div className="setting-item">
                      <label><KeyRound size={14} /> 現場スタッフ用パスコード</label>
                      <input
                        type="password"
                        value={staffPasscode}
                        onChange={(e) => setStaffPasscode(e.target.value)}
                        maxLength={15}
                        placeholder="パスコードを設定してください"
                      />
                    </div>
                    <div className="setting-item">
                      <label><KeyRound size={14} /> システム管理者用パスコード</label>
                      <input
                        type="password"
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                        maxLength={15}
                        placeholder="パスコードを設定してください"
                      />
                    </div>
                  </div>

                  <div className="settings-form-actions">
                    <button type="submit" className="btn-primary btn-save-settings" disabled={isLoading}>
                      <Save size={16} /> 基本設定を保存
                    </button>
                  </div>
                </form>
              </div>

              {/* DANGER ZONE RESET CARD */}
              <div className="db-card danger-zone-card">
                <div className="danger-header">
                  <AlertTriangle size={20} className="danger-icon" />
                  <h4>データベース危険操作ゾーン</h4>
                </div>
                <p className="danger-desc">
                  すべての登録駅セクション、チェックポイント（座標）、およびパスコード設定を削除し、初期状態にリセットします。この操作は取り消せません。
                </p>
                <div className="danger-actions">
                  <button type="button" className="btn-text-danger" onClick={handleResetDb}>
                    <RotateCcw size={16} /> 全データを初期化・全消去する
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {previewQrItem && (
        <div className="debug-passcode-overlay" onClick={() => setPreviewQrItem(null)}>
          <div className="passcode-card qr-modal-card" onClick={e => e.stopPropagation()}>
            <button className="passcode-close" onClick={() => setPreviewQrItem(null)}>
              <X size={20} />
            </button>
            <h3>QRコード プレビュー</h3>
            <p className="qr-cp-title">{previewQrItem.displayName || 'チェックポイント'}</p>
            {(() => {
              const qrUrl = `${window.location.origin}${window.location.pathname}?stamp=${previewQrItem.qrId || previewQrItem.id}`;
              return (
                <>
                  <div className="qr-container-large">
                    <QRCodeSVG value={qrUrl} size={220} level="M" includeMargin />
                  </div>
                  <div className="uuid-display-box" style={{ flexDirection: 'column', gap: '4px' }}>
                    <span>QRコード用URL (ポスター印刷用):</span>
                    <code style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{qrUrl}</code>
                  </div>
                  <div className="qr-modal-actions" style={{ display: 'flex', gap: '8px', marginTop: '16px', width: '100%' }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => handleDownloadQrCode(previewQrItem, previewQrItem.sectionName)}
                    >
                      <Download size={18} /> QR画像をダウンロード (PNG)
                    </button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPreviewQrItem(null)}>
                      閉じる
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* Custom Alert Modal */}
      <CustomAlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminDashboard;
