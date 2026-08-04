import React, { useEffect } from 'react';
import { Building2, CheckCircle2, ChevronRight, MapPin, X } from 'lucide-react';

function AreaSelectModal({ sections = [], checkpoints = [], stamps = [], activeSectionId, onSelectSection, onClose, isCancelable = true }) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = 'auto';
    };
  }, []);
  return (
    <div className="modal-overlay" onClick={isCancelable ? onClose : undefined}>
      <div className="modal-content area-select-modal-content" onClick={e => e.stopPropagation()}>
        {isCancelable && (
          <button className="modal-close" onClick={onClose} aria-label="閉じる">
            <X size={24} />
          </button>
        )}

        <div className="area-modal-header">
          <div className="area-modal-icon-badge">
            <Building2 size={24} />
          </div>
          <h3>エリア（駅）を選択</h3>
          <p className="area-modal-subtitle">
            スタンプラリーを行うエリアを選択してください。<br />
            選択したエリアのスポットが地図やカードに表示されます。
          </p>
        </div>

        <div className="area-list-grid">
          {sections.map((sec) => {
            const secCps = checkpoints.filter(cp => cp.sectionId === sec.id);
            const secStamped = secCps.filter(cp => stamps.includes(cp.qrId || cp.id)).length;
            const isSecFull = secCps.length > 0 && secStamped === secCps.length;
            const isSelected = sec.id === activeSectionId;

            return (
              <button
                key={sec.id}
                className={`area-select-card ${isSelected ? 'selected' : ''} ${isSecFull ? 'completed' : ''}`}
                onClick={() => {
                  onSelectSection(sec.id);
                  if (onClose) onClose();
                }}
              >
                <div className="area-card-left">
                  <div className="area-card-pin">
                    <MapPin size={20} />
                  </div>
                  <div className="area-card-info">
                    <span className="area-card-title">{sec.name}</span>
                    {sec.description && (
                      <span className="area-card-desc">{sec.description}</span>
                    )}
                  </div>
                </div>

                <div className="area-card-right">
                  {isSecFull ? (
                    <div className="area-badge-completed">
                      <CheckCircle2 size={16} />
                      <span>達成！</span>
                    </div>
                  ) : (
                    <div className="area-badge-progress">
                      <span>{secStamped} / {secCps.length}</span>
                    </div>
                  )}
                  <ChevronRight size={18} className="area-card-arrow" />
                </div>
              </button>
            );
          })}
        </div>

        {isCancelable && (
          <button className="btn-secondary area-modal-close-btn" onClick={onClose}>
            閉じる
          </button>
        )}
      </div>
    </div>
  );
}

export default AreaSelectModal;
