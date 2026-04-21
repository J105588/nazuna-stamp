import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const RewardScreen = ({ isExchanged, onExchange }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  useEffect(() => {
    // Dynamic clock running
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleSliderChange = (e) => {
    if (isExchanged) return;
    setSliderValue(e.target.value);
  };

  const handleSliderRelease = () => {
    if (isExchanged) return;
    if (sliderValue > 95) {
      // Show local overlay first
      setShowSuccessOverlay(true);
      // Trigger the parent state update
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

          <button className="btn-close-overlay" onClick={() => setShowSuccessOverlay(false)}>
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`reward-container ${isExchanged ? 'exchanged-view' : 'ready-view'}`}>
      <div className="reward-header-simple">
        <h2>特典引き換え</h2>
        {!isExchanged && (
          <p className="sub-text">
            スタッフの目の前で操作してください。
          </p>
        )}
      </div>

      <div className="dynamic-clock-inline">
        <div className="clock-icon-row">
          <Clock size={20} />
          <span>現在時刻</span>
        </div>
        <div className="current-time-text">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>

      <div className="slider-section">
        <div className="slider-wrapper">
          <input
            type="range"
            min="0"
            max="100"
            value={isExchanged ? 100 : sliderValue}
            onChange={handleSliderChange}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            disabled={isExchanged}
            className={`exchange-slider ${isExchanged ? 'disabled-slider' : ''}`}
          />
          <div className="slider-text" style={{ opacity: isExchanged ? 0 : 1 - (sliderValue / 100) }}>
            スライドして引き換える ➔
          </div>
        </div>
        
        {isExchanged ? (
          <div className="exchanged-badge">
             <CheckCircle2 size={20} />
             <span>引き換え済み</span>
          </div>
        ) : (
          <div className="warning-notice-box">
             <AlertTriangle size={16} />
             <p>引き換え完了画面は一度閉じると再表示できません。必ずスタッフの確認を受けてから閉じてください。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardScreen;
