import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle2 } from 'lucide-react';

export const RewardScreen = ({ isExchanged, onExchange }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Dynamic clock running if exchanged
    if (isExchanged) {
      const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timerId);
    }
  }, [isExchanged]);

  const handleSliderChange = (e) => {
    setSliderValue(e.target.value);
  };

  const handleSliderRelease = () => {
    if (sliderValue > 90) {
      // Confirm exchange
      onExchange();
    } else {
      setSliderValue(0);
    }
  };

  if (isExchanged) {
    return (
      <div className="reward-container exchanged">
        <div className="exchanged-stamp">
          <CheckCircle2 size={64} className="icon-success" />
          <h2>特典引き換え済み</h2>
        </div>
        
        <div className="dynamic-clock">
          <p className="clock-label">現在時刻（動的証明）</p>
          <div className="time-display">
            {currentTime.toLocaleDateString()} <br />
            <span className="time-large">{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <p className="exchange-notice">この画面をスタッフに提示してください。</p>
      </div>
    );
  }

  return (
    <div className="reward-container ready">
      <div className="reward-header">
        <Gift size={48} className="icon-reward" />
        <h2>コンプリート！</h2>
        <p>すべてのスタンプが集まりました。<br/>スタッフの目の前でスライダーを右に動かして特典と交換してください。</p>
      </div>

      <div className="slider-wrapper">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={sliderValue}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          className="exchange-slider" 
        />
        <div className="slider-text" style={{ opacity: 1 - (sliderValue / 100) }}>
          スライドして引き換える ➔
        </div>
      </div>
    </div>
  );
};

export default RewardScreen;
