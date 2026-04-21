import React, { useState, useEffect } from 'react';
import { isInAppBrowser } from '../utils/browserDetect';
import { AlertCircle, CheckCircle, FileText, X } from 'lucide-react';

const EntryGuard = ({ onAgreed }) => {
  const [agreed, setAgreed] = useState(false);
  const [inAppMode, setInAppMode] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);

  useEffect(() => {
    if (isInAppBrowser()) {
      setInAppMode(true);
    } else if (localStorage.getItem('terms_agreed') === 'true') {
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
          <div className="modal-overlay" onClick={() => setShowTerms(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowTerms(false)}>
                <X size={24} />
              </button>
              <h3>利用規約</h3>
              <div className="terms-scroll-area">
                <p>本スタンプラリー（以下「本イベント」）に参加される前に、以下の規約を必ずご確認ください。本アプリで「同意して開始」を選択した時点で、本規約に同意したものとみなします。</p>
                
                <h4>1. 推奨環境について</h4>
                <p>本アプリはブラウザの機能（GPS・ローカルストレージ）を利用します。以下の環境以外では正常に動作しない場合があります。<br/><br/>
                iOS: Safari（最新版）<br/>
                Android: Google Chrome（最新版）<br/><br/>
                注意: アプリ内ブラウザ、シークレットモード（プライベートブラウズ）では正しく利用できません。</p>
                
                <h4>2. 位置情報（GPS）の利用</h4>
                <p>スタンプ取得には、端末の位置情報サービスを「オン」にし、ブラウザによる位置情報の取得を許可する必要があります。<br/><br/>
                GPSの精度は端末や周囲の建物環境に依存します。近づいても反応しない場合は、場所を少し移動して再試行してください。</p>
                
                <h4>3. データの保存について</h4>
                <p>取得したスタンプ情報は、お使いの端末内に保存されます。サーバーには保存されません。<br/><br/>
                以下の操作を行うと、取得したスタンプがすべて消去され、復元はできませんのでご注意ください。<br/>
                ・ブラウザの「履歴」や「キャッシュ」の削除<br/>
                ・スマートフォンのストレージ最適化（クリーナーアプリ等の実行）<br/>
                ・スタンプ取得時とは別のブラウザでのアクセス</p>
                
                <h4>4. 特典の引き換え</h4>
                <p>スタンプをすべてコンプリートした際に出現する「引き換え画面」は、必ずスタッフの指示に従って操作してください。<br/><br/>
                一度「使用済み」となった特典は再利用できません。<br/>
                画面のスクリーンショットによる引き換えは無効です。</p>
                
                <h4>5. 免責事項</h4>
                <p>本アプリの使用中に発生した事故、怪我、端末の故障、紛失、またはデータの消失について、主催者は一切の責任を負いません。<br/><br/>
                歩きスマホは大変危険です。画面の操作は必ず安全な場所に立ち止まって行ってください。<br/>
                本サービスは予告なく中断・終了する場合があります。</p>
                
                <p className="copyright">©2026 なずな祭実行委員会</p>
              </div>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setTermsViewed(true);
                  setShowTerms(false);
                }}
              >
                確認して閉じる
              </button>
            </div>
          </div>
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
              localStorage.setItem('terms_agreed', 'true');
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
