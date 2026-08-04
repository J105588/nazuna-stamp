import React, { useState } from 'react';
import { Camera, Check, ChevronDown, Building2, Sparkles, CheckCircle2, Layers, Star, Heart, Award, Flame, ThumbsUp, CheckCircle, Map, ChevronRight } from 'lucide-react';

const StampCard = ({
  stamps,
  sections = [],
  checkpoints = [],
  activeSectionId,
  onSectionChange,
  onOpenAreaModal,
  onOpenMap,
  isComplete,
  isExchanged,
  onOpenCamera,
  scannerClosedAt,
  onBackdoorAction
}) => {
  const [tapCount, setTapCount] = useState(0);
  const [headerTapCount, setHeaderTapCount] = useState(0);

  // Selected section's checkpoints
  const currentSection = sections.find(s => s.id === activeSectionId) || sections[0];
  const sectionCheckpoints = checkpoints.filter(cp => cp.sectionId === (currentSection?.id || ''));

  const sortedCheckpoints = [...sectionCheckpoints].sort((a, b) => (a.order || 0) - (b.order || 0));
  const totalSlotsCount = sectionCheckpoints.length;

  const slotsList = Array.from({ length: totalSlotsCount }, (_, i) => {
    const slotNumber = i + 1;
    const cp = sortedCheckpoints[i];
    return { slotNumber, cp };
  });

  const handleHeaderTap = () => {
    const newCount = headerTapCount + 1;
    if (newCount >= 3) {
      onBackdoorAction();
      setHeaderTapCount(0);
    } else {
      setHeaderTapCount(newCount);
      setTimeout(() => setHeaderTapCount(0), 3000);
    }
  };

  const handleSlotClick = (slotIndex) => {
    const now = Date.now();
    const isRecentlyClosed = (now - scannerClosedAt) < 10000;

    if (slotIndex === 1 && isRecentlyClosed) { // 2nd slot
      const newCount = tapCount + 1;
      if (newCount === 3) {
        onBackdoorAction();
        setTapCount(0);
      } else {
        setTapCount(newCount);
      }
    } else {
      setTapCount(0);
    }
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'Star': return Star;
      case 'Heart': return Heart;
      case 'Award': return Award;
      case 'Flame': return Flame;
      case 'ThumbsUp': return ThumbsUp;
      case 'CheckCircle': return CheckCircle;
      default: return Check;
    }
  };

  return (
    <div className="stamp-card-container" onClick={(e) => {
      if (e.target.closest('.stamp-slot') || e.target.closest('.event-logo-img-small') || e.target.closest('.event-title')) return;
      setTapCount(0);
    }}>
      <div className="header" onClick={handleHeaderTap}>
        <img src="/app-icon.jpg" alt="なずな祭ロゴ" className="event-logo-img-small" />
        <h1 className="event-title">なずな祭<br />街歩きスタンプラリー</h1>
      </div>

      {/* Selected Area Banner */}
      {sections.length > 0 && (
        <div className="active-area-banner">
          <div className="active-area-info">
            <div className="active-area-badge">
              <Building2 size={16} />
              <span>選択中のエリア</span>
            </div>
            <div className="active-area-name">
              {currentSection?.name || '未選択'}
            </div>
          </div>
          <button 
            className="btn-change-area-subtle" 
            onClick={onOpenAreaModal}
            title="エリアを変更"
          >
            <span>エリア変更</span>
          </button>
        </div>
      )}

      {/* Prominent Map Callout Button */}
      {onOpenMap && (
        <button className="btn-map-prominent" onClick={onOpenMap} title="周辺スポットの地図を開く">
          <div className="map-btn-icon-wrapper">
            <Map size={24} />
          </div>
          <div className="map-btn-text-group">
            <span className="map-btn-title">周辺スポットの地図を見る</span>
            <span className="map-btn-subtitle">チェックポイントの正確な場所を確認</span>
          </div>
          <ChevronRight size={20} className="map-btn-arrow" />
        </button>
      )}

      {/* Active Section Stamp Grid */}
      <div className="card-outer">
        <div className="section-title-label">
          <strong>{currentSection?.name || 'スタンプカード'}</strong>
          {currentSection?.description && <span className="sec-sub-desc">{currentSection.description}</span>}
          
          {totalSlotsCount > 0 && (
            <div className="section-progress-pill" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
              padding: '4px 14px',
              backgroundColor: 'var(--card-subtle-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: 'var(--primary-color)'
            }}>
              <span>獲得スタンプ:</span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--primary-color)' }}>
                {sectionCheckpoints.filter(cp => stamps.includes(cp.qrId || cp.id)).length}
              </strong>
              <span style={{ color: 'var(--text-light)' }}>/ {totalSlotsCount}</span>
            </div>
          )}
        </div>

        {totalSlotsCount === 0 ? (
          <div className="empty-card-placeholder" onClick={handleHeaderTap}>
            <Layers size={32} className="empty-icon" />
            <p>現在登録されているスタンプスポットがありません</p>
          </div>
        ) : (
          <div className="card-grid">
            {slotsList.map(({ slotNumber, cp }, index) => {
              const spotId = cp ? (cp.qrId || cp.id) : null;
              const isStamped = spotId ? stamps.includes(spotId) : false;

              return (
                <div key={cp ? cp.id : `empty-slot-${slotNumber}`} className="stamp-slot-item">
                  <div
                    className={`stamp-slot ${isStamped ? 'stamped' : ''}`}
                    onClick={() => handleSlotClick(index)}
                  >
                    <div className="slot-inner">
                      <div className="slot-number">{slotNumber}</div>
                      {isStamped && cp && (() => {
                        if (cp.stampIcon && cp.stampIcon.startsWith('data:image')) {
                          return (
                            <div className="stamp-mark image-stamp-mark">
                              <img 
                                src={cp.stampIcon} 
                                alt="スタンプ" 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', imageRendering: '-webkit-optimize-contrast' }} 
                              />
                            </div>
                          );
                        }
                        const IconComponent = getIconComponent(cp.stampIcon);
                        return (
                          <div className="stamp-mark">
                            <IconComponent size={32} className="check-icon" />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="stamp-slot-label">
                    {cp?.name || `スポット ${slotNumber}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isComplete ? (
        <div className="complete-banner-card">
          <div className="complete-header-row">
            <Award size={36} className="complete-award-icon" />
            <div>
              <h3>エリアコンプリート達成！</h3>
              <p>「{currentSection?.name || 'スタンプラリー'}」の全スタンプを集めました！</p>
            </div>
          </div>
          {!isExchanged ? (
            <div className="complete-reward-notice">
              <Sparkles size={18} />
              <span>下部の「特典引き換え」セクションから景品をお受け取りください。</span>
              <ChevronDown size={24} className="bounce-arrow" />
            </div>
          ) : (
            <div className="complete-reward-notice exchanged">
              <CheckCircle2 size={18} />
              <span>特典の引き換えが完了しています。ご参加ありがとうございました！</span>
            </div>
          )}
        </div>
      ) : (
        <p className="instruction-text">
          エリアのスタンプを集めてコンプリートを目指そう！<br />スポットに着いたら「スキャンする」ボタンを押してください。
        </p>
      )}

      {!isExchanged && !isComplete && (
        <div className="camera-button-action-area">
          <button className="scan-btn-large" onClick={onOpenCamera}>
            <div className="scan-btn-icon">
              <Camera size={28} />
            </div>
            <span>スキャンする</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default StampCard;
