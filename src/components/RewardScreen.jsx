import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle, ChevronRight, Gift, Sparkles } from 'lucide-react';

export const RewardScreen = ({ isExchanged, isDismissed, onExchange, onDismiss }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  useEffect(() => {
    // Dynamic clock running
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    // Persistence check: If exchanged but not yet dismissed, show overlay
    if (isExchanged && !isDismissed) {
      setShowSuccessOverlay(true);
    }
  }, [isExchanged, isDismissed]);

  useEffect(() => {
    if (showSuccessOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showSuccessOverlay]);

  const [isDragging, setIsDragging] = useState(false);

  const handleSliderChange = (e) => {
    if (isExchanged) return;
    setIsDragging(true);
    setSliderValue(Number(e.target.value));
  };

  const handleSliderRelease = () => {
    if (isExchanged) return;
    setIsDragging(false);
    if (sliderValue > 90) {
      setSliderValue(100);
      setShowSuccessOverlay(true);
      onExchange();
    } else {
      setSliderValue(0);
    }
  };

  // 成功画面（全画面オーバーレイ）
  if (showSuccessOverlay) {
    return (
      <div className="full-screen-success-overlay">
        <div className="success-content">
          <div className="success-header">
            <CheckCircle2 size={80} className="icon-success-large" />
            <h2>引き換え完了しました</h2>
          </div>

          <div className="dynamic-clock-large">
            <p className="clock-label">現在時刻（引き換え証明）</p>
            <div className="time-display-large">
              <span className="date-text">{currentTime.toLocaleDateString()}</span>
              <span className="time-text">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="staff-notice">
            <p>※この画面をスタッフに提示してください</p>
          </div>

          <button className="btn-close-overlay" onClick={() => {
            onDismiss();
            setShowSuccessOverlay(false);
          }}>
            閉じる
          </button>
        </div>
      </div>
    );
  }

  const fillPercent = isExchanged ? 100 : sliderValue;

  return (
    <div className={`reward-container ${isExchanged ? 'exchanged-view' : 'ready-view'}`}>
      <div className="reward-header-simple">
        <div className="reward-badge-header">
          <Gift size={20} />
          <span>特典引き換え</span>
        </div>
        <h2>特典受取はこちら</h2>
        {!isExchanged && (
          <p className="sub-text">
            スタッフの確認のもと、右へスライドしてください
          </p>
        )}
      </div>

      <div className="dynamic-clock-inline">
        <div className="clock-icon-row">
          <Clock size={18} />
          <span>現在時刻</span>
        </div>
        <div className="current-time-text">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>

      <div className="slider-section">
        <div className={`slider-track-container ${isExchanged ? 'exchanged' : ''} ${isDragging ? 'dragging' : ''}`}>
          <div
            className="slider-fill-progress"
            style={{ width: `${fillPercent}%` }}
          />
          <div
            className="slider-text-label"
            style={{ opacity: isExchanged ? 0 : Math.max(0, 1 - (sliderValue / 70)) }}
          >
            <span>右へスライドして引き換え</span>
            <ChevronRight size={18} className="arrow-pulse" />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={fillPercent}
            onChange={handleSliderChange}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            disabled={isExchanged}
            className={`exchange-slider ${isExchanged ? 'disabled-slider' : ''}`}
          />
        </div>

        {isExchanged ? (
          <div className="exchanged-badge">
            <CheckCircle2 size={20} />
            <span>特典引き換え済みです</span>
          </div>
        ) : (
          <div className="warning-notice-box">
            <AlertTriangle size={15} />
            <p>※必ずスタッフの目の前でスライドを行ってください。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardScreen;
