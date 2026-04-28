import React, { useState, useEffect } from 'react';
import { isInAppBrowser } from '../utils/browserDetect';
import { storage } from '../utils/storage';
import { AlertCircle, CheckCircle, FileText, X } from 'lucide-react';

import TermsModal from './TermsModal';

const EntryGuard = ({ onAgreed }) => {
  const [agreed, setAgreed] = useState(false);
  const [inAppMode, setInAppMode] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);

  useEffect(() => {
    if (isInAppBrowser()) {
      setInAppMode(true);
    } else if (storage.load('terms_agreed') === true) {
      setAgreed(true);
      onAgreed();
    }
  }, [onAgreed]);

  if (inAppMode) {
    return (
      <div className="entry-guard-container warning-bg">
        <div className="card-box">
          <AlertCircle size={48} className="icon-warning" />
          <h2>アプリ内ブラウザを検知しました</h2>
          <p>
            注意: <strong>LINE、Googleアプリ、Yahoo!アプリ、Instagram</strong> などのアプリ内ブラウザや、シークレットモード（プライベートブラウズ）では正常に動作しません。
          </p>
          <div className="instruction-box">
            <p><strong>iPhone</strong>をお使いの方は <strong>Safari / Brave</strong></p>
            <p><strong>Android</strong>をお使いの方は <strong>Chrome / Brave</strong></p>
            <p style={{ marginTop: '10px' }}>で開き直してください。</p>
            <p className="highlight" style={{ marginTop: '15px', fontSize: '0.9rem' }}>
              ※右上の「⋮」または右下のメニューから「ブラウザで開く」を選択するか、URLをコピーしてブラウザに貼り付けてください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!agreed) {
    return (
      <div className="entry-guard-container">
        {showTerms && (
          <TermsModal 
            onClose={() => {
              setShowTerms(false);
              setTermsViewed(true);
            }} 
            forceScroll={true}
          />
        )}

        <div className="card-box">
          <div className="entry-logo">
            <img src="/app-icon.jpg" alt="なずな祭ロゴ" className="event-logo-img" />
            <h1 className="event-title">なずな祭<br/>街歩きスタンプラリー</h1>
          </div>
          <h2>はじめる前の注意点</h2>
          <ul className="caution-list">
            <li>
              <CheckCircle size={18} className="list-icon" />
              <span>必ず <strong>Safari / Chrome / Brave</strong> を使用してください。</span>
            </li>
            <li>
              <CheckCircle size={18} className="list-icon" />
              <span>ブラウザの <strong>位置情報(GPS)</strong> の使用を「許可」してください。</span>
            </li>
            <li>
              <CheckCircle size={18} className="list-icon" />
              <span><strong>プライベートモード</strong>は使用しないでください（データが消えます）。</span>
            </li>
          </ul>
          
          <div className="terms-preview">
            <button className="btn-text-link" onClick={() => setShowTerms(true)}>
              <FileText size={18} />
              利用規約を確認する
            </button>
          </div>

          <button 
            className={`btn-primary ${!termsViewed ? 'disabled' : ''}`}
            disabled={!termsViewed}
            onClick={() => {
              storage.save('terms_agreed', true);
              setAgreed(true);
              onAgreed();
            }}
          >
            同意して開始
          </button>
          {!termsViewed && (
            <p className="instruction-text-small" style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 'bold' }}>
              ※開始するには、利用規約の確認が必要です。
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default EntryGuard;
