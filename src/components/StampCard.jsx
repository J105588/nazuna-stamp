import React from 'react';
import { Camera, Check } from 'lucide-react';

const StampCard = ({ stamps, totalStamps, isExchanged, onOpenCamera }) => {
  const isComplete = stamps.length >= totalStamps;
  const slots = Array.from({ length: totalStamps }, (_, i) => i + 1);

  return (
    <div className="stamp-card-container">
      <div className="header">
        <h1 className="event-title">なずな祭<br />街歩きスタンプラリー</h1>
        <div className="progress-badge">
          <span>{stamps.length}</span> / {totalStamps}
        </div>
      </div>

      <div className="card-outer">
        <div className="card-grid">
          {slots.map((slot) => {
            const isStamped = stamps.length >= slot;
            return (
              <div key={slot} className={`stamp-slot ${isStamped ? 'stamped' : ''}`}>
                <div className="slot-inner">
                  <div className="slot-number">{slot}</div>
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
        <div className="complete-msg">
          コンプリート！
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
