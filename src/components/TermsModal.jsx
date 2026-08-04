import React, { useState, useEffect } from 'react';
import { X, Smartphone, MapPin, HardDrive, Gift, ShieldAlert, FileText } from 'lucide-react';

const TermsModal = ({ onClose, forceScroll = true }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(!forceScroll);

  const handleScroll = (e) => {
    if (!forceScroll || hasScrolledToBottom) return;
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const element = document.querySelector('.terms-scroll-area');
      if (element && element.scrollHeight <= element.clientHeight) {
        setHasScrolledToBottom(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content terms-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => onClose(false)}>
          <X size={24} />
        </button>
        <div className="terms-header">
          <FileText size={22} className="terms-header-icon" />
          <h3>なずな祭スタンプラリー 利用規約</h3>
        </div>

        <div className="terms-scroll-area" onScroll={handleScroll}>
          <p className="terms-intro">
            本スタンプラリー（以下「本イベント」）に参加される前に、以下の規約を必ずご確認ください。本アプリで「同意して開始」を選択した時点で、本規約に同意したものとみなします。
          </p>

          <div className="terms-card-item">
            <h4><Smartphone size={18} /> 1. 推奨環境について</h4>
            <p>本アプリはブラウザの機能（GPS・ローカルストレージ）を利用します。以下の推奨環境以外では正常に動作しない場合があります。</p>
            <div className="env-list">
              <span className="env-tag">iOS: Safari（最新版）</span>
              <span className="env-tag">Android: Google Chrome（最新版）</span>
            </div>
            <p className="terms-note">※ LINE・Instagram等のアプリ内ブラウザやシークレットモード（プライベートブラウズ）では正しく利用できません。</p>
          </div>

          <div className="terms-card-item">
            <h4><MapPin size={18} /> 2. 位置情報（GPS）の利用</h4>
            <p>スタンプ取得には、端末の位置情報サービスを「オン」にし、ブラウザによる位置情報の取得を許可する必要があります。</p>
            <p className="terms-note">※ GPSの精度は端末や周囲の建物環境に依存します。近づいても反応しない場合は場所を移動して再試行してください。</p>
          </div>

          <div className="terms-card-item">
            <h4><HardDrive size={18} /> 3. データの保存について</h4>
            <p>取得したスタンプ情報は、お使いの端末内に保存されます（サーバーには自動保存されません）。</p>
            <p className="terms-warning-text">
              以下の操作を行うと取得したスタンプが消去され、復元できなくなりますのでご注意ください。<br />
              ・ブラウザの履歴・キャッシュの削除<br />
              ・ストレージ最適化アプリの実行<br />
              ・別ブラウザでのアクセス
            </p>
          </div>

          <div className="terms-card-item">
            <h4><Gift size={18} /> 4. 特典の引き換え（お一人様1回まで）</h4>
            <p>特典の引き換えはお一人様につき1回（いずれか1エリアのコンプリート時のみ）に限ります。1つのエリアで引き換えた後、別エリアで2回目の引き換えを行うことはできません。</p>
            <p className="terms-note">
              ※ 引き換え画面は必ずスタッフの指示に従って操作してください。誤って使用済みにした場合の再発行・スクリーショットでの引き換えは無効です。
            </p>
          </div>

          <div className="terms-card-item">
            <h4><ShieldAlert size={18} /> 5. 免責事項・注意事項</h4>
            <p>歩きスマホは大変危険です。画面操作は必ず安全な場所に立ち止まって行ってください。</p>
            <p>位置情報の偽装やシステムの解析・改ざん等の不適切行為が発覚した場合、権利を無効とします。また、本アプリ利用中に発生した事故・損害について主催者は一切の責任を負いません。</p>
          </div>

          <p className="copyright">©2026 なずな祭実行委員会</p>
        </div>
        <div className="modal-footer">
          {!hasScrolledToBottom && (
            <p className="scroll-notice">最下部までスクロールしてください</p>
          )}
          <button
            className={`btn-primary ${!hasScrolledToBottom ? 'disabled' : ''}`}
            disabled={!hasScrolledToBottom}
            onClick={() => onClose(true)}
          >
            確認して閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
