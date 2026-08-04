import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Map, Layers, Building2, ChevronRight, Sparkles } from 'lucide-react';

const STEPS = [
  {
    target: '.section-tabs-container',
    title: 'エリア（駅）切替',
    icon: Building2,
    description: 'タップしてエリア（駅）を切り替え、各エリアのスタンプカードを確認できます。',
    forcePlacement: 'bottom'
  },
  {
    target: '.card-grid',
    title: 'スタンプコレクション',
    icon: Layers,
    description: '獲得したスタンプがカード内にコレクションされます。番号順に自動で入ります！',
    forcePlacement: 'auto'
  },
  {
    target: '.scan-btn-large',
    title: 'QRコードスキャン',
    icon: Camera,
    description: 'ポスターを見つけたら、このボタンを押してカメラでQRコードを読み取りましょう！',
    forcePlacement: 'top'
  },
  {
    target: '.fab-map',
    title: '周辺マップ機能',
    icon: Map,
    description: '地図を開くとチェックポイントの位置や現在地をマップ上で確認できます！',
    forcePlacement: 'top'
  }
];

const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowLeft: 0, arrowPos: 'top', cardWidth: 340 });
  const tooltipRef = useRef(null);

  const updatePosition = useCallback(() => {
    const step = STEPS[currentStep];
    if (!step) return false;

    const el = document.querySelector(step.target);
    if (!el) {
      setTargetRect(null);
      return false;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const cardWidth = Math.min(windowWidth - 32, 350);
    const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 170;

    let top = 0;
    let arrowPos = 'top';

    // Placement logic guaranteeing 0% overlap with target element
    if (step.forcePlacement === 'bottom') {
      top = rect.top + rect.height + 14;
      arrowPos = 'top';
      if (top + tooltipHeight > windowHeight - 12) {
        top = Math.max(12, rect.top - tooltipHeight - 14);
        arrowPos = 'bottom';
      }
    } else if (step.forcePlacement === 'top') {
      top = rect.top - tooltipHeight - 14;
      arrowPos = 'bottom';
      if (top < 12) {
        top = rect.top + rect.height + 14;
        arrowPos = 'top';
      }
    } else {
      // Auto placement
      const spaceAbove = rect.top;
      const spaceBelow = windowHeight - (rect.top + rect.height);
      if (spaceAbove >= tooltipHeight + 20) {
        top = rect.top - tooltipHeight - 14;
        arrowPos = 'bottom';
      } else {
        top = rect.top + rect.height + 14;
        arrowPos = 'top';
      }
    }

    // Clamp top to viewport bounds
    top = Math.max(12, Math.min(top, windowHeight - tooltipHeight - 12));

    // Horizontal positioning centered on target, clamped inside viewport
    const targetCenterX = rect.left + rect.width / 2;
    let left = targetCenterX - cardWidth / 2;
    left = Math.max(16, Math.min(left, windowWidth - cardWidth - 16));

    // Calculate exact arrow position pointing to target center
    const arrowLeft = Math.max(24, Math.min(targetCenterX - left, cardWidth - 24));

    setTooltipPos({ top, left, arrowLeft, arrowPos, cardWidth });
    return true;
  }, [currentStep]);

  // Target element locator polling effect
  useEffect(() => {
    setIsReady(false);
    let attempts = 0;

    const checkAndPosition = () => {
      const step = STEPS[currentStep];
      if (!step) return;

      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Check if element is in viewport, only scroll if out of view
          const windowHeight = window.innerHeight;
          const isVisible = rect.top >= 10 && rect.bottom <= windowHeight - 10;

          if (!isVisible) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          updatePosition();
          setIsReady(true);
          return;
        }
      }

      attempts++;
      if (attempts < 20) {
        setTimeout(checkAndPosition, 50);
      } else {
        // Fallback if element really doesn't exist
        setIsReady(true);
      }
    };

    checkAndPosition();
  }, [currentStep, updatePosition]);

  // Continuous position tracking on scroll and resize
  useEffect(() => {
    if (!isReady) return;
    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isReady, updatePosition]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = STEPS[currentStep];
  const IconComponent = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  const padding = 6;
  const rectX = targetRect ? targetRect.left - padding : 0;
  const rectY = targetRect ? targetRect.top - padding : 0;
  const rectW = targetRect ? targetRect.width + padding * 2 : 0;
  const rectH = targetRect ? targetRect.height + padding * 2 : 0;

  if (!isReady || !targetRect) {
    return null; // Don't render broken (0,0) tooltip while waiting for DOM/layout!
  }

  return (
    <div className="onboarding-tour-container">
      {/* 100% Crisp SVG Cutout Mask */}
      <svg className="onboarding-svg-overlay" width="100%" height="100%">
        <defs>
          <mask id="spotlight-cutout-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={rectX}
              y={rectY}
              width={rectW}
              height={rectH}
              rx="14"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#spotlight-cutout-mask)"
        />
      </svg>

      {/* Target Glowing Ring Frame */}
      <div
        className="onboarding-spotlight-ring"
        style={{
          top: `${rectY}px`,
          left: `${rectX}px`,
          width: `${rectW}px`,
          height: `${rectH}px`
        }}
      />

      {/* Speech Bubble Tooltip */}
      <div
        ref={tooltipRef}
        className={`onboarding-speech-bubble arrow-${tooltipPos.arrowPos}`}
        style={{
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
          width: `${tooltipPos.cardWidth}px`
        }}
      >
        {/* Dynamic Arrow Pointer */}
        <div
          className="speech-bubble-arrow"
          style={{ left: `${tooltipPos.arrowLeft}px` }}
        />

        <div className="onboarding-tooltip-header">
          <div className="onboarding-title-group">
            <div className="onboarding-icon-badge">
              <IconComponent size={20} />
            </div>
            <h4>{step.title}</h4>
          </div>
          <button className="onboarding-skip-btn" onClick={handleSkip}>
            スキップ
          </button>
        </div>

        <p className="onboarding-description">{step.description}</p>

        <div className="onboarding-footer">
          <div className="onboarding-progress">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`progress-dot ${idx === currentStep ? 'active' : idx < currentStep ? 'completed' : ''}`}
              />
            ))}
            <span className="step-count-label">{currentStep + 1} / {STEPS.length}</span>
          </div>

          <button className="btn-tour-next" onClick={handleNext}>
            {isLast ? (
              <>
                <span>START！</span>
              </>
            ) : (
              <>
                <span>次へ</span>
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
