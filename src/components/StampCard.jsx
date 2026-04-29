import React, { useState } from 'react';
import { Camera, Check, ChevronDown } from 'lucide-react';
import { STAMP_SPOTS } from '../utils/geoUtils';

const StampCard = ({ stamps, totalStamps, isExchanged, onOpenCamera, scannerClosedAt, onBackdoorAction }) => {
  const isComplete = stamps.length >= totalStamps;
  const slots = Array.from({ length: totalStamps }, (_, i) => i + 1);
  const [tapCount, setTapCount] = useState(0);

  const handleSlotClick = (slot) => {
    // スキャナーを閉じてから10秒以内か判定
    const now = Date.now();
    const isRecentlyClosed = (now - scannerClosedAt) < 10000;

    if (slot === 2 && isRecentlyClosed) {
      const newCount = tapCount + 1;
      if (newCount === 3) {
        onBackdoorAction();
        setTapCount(0);
      } else {
        setTapCount(newCount);
      }
    } else {
      // 2番以外、または時間切れの場合はリセット
      setTapCount(0);
    }
  };

  return (
    <div className="stamp-card-container" onClick={(e) => {
      // スロット以外（背景など）をタップした場合もカウントリセット
      if (e.target.closest('.stamp-slot')) return;
      setTapCount(0);
    }}>
      <div className="header">
        <img src="/app-icon.jpg" alt="なずな祭ロゴ" className="event-logo-img-small" />
        <h1 className="event-title">なずな祭<br />街歩きスタンプラリー</h1>
        <div className="progress-badge">
          <span>{stamps.length}</span> / {totalStamps}
        </div>
      </div>

      <div className="card-outer">
        <div className="card-grid">
          {Object.keys(STAMP_SPOTS).map((spotId, index) => {
            const isStamped = stamps.includes(spotId);
            const slotNumber = index + 1;
            return (
              <div 
                key={spotId} 
                className={`stamp-slot ${isStamped ? 'stamped' : ''}`}
                onClick={() => handleSlotClick(slotNumber)}
              >
                <div className="slot-inner">
                  <div className="slot-number">{slotNumber}</div>
                  {isStamped && (
                    <div className="stamp-mark">
                      <Check size={32} className="check-icon" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isComplete ? (
        <div className="complete-msg-container">
          <div className="complete-msg">
            コンプリート！
          </div>
          {!isExchanged && (
            <div className="scroll-hint">
              <p>引き換えは下へ</p>
              <ChevronDown size={24} className="bounce-arrow" />
            </div>
          )}
        </div>
      ) : (
        <p className="instruction-text">
          スポットに着いたら「スキャンする」ボタンを押してね！
        </p>
      )}

      {!isExchanged && !isComplete && (
        <div className="camera-button-wrapper">
          <button className="scan-btn-large" onClick={onOpenCamera}>
            <div className="scan-btn-icon">
              <Camera size={32} />
            </div>
            <span>スキャンする</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default StampCard;
