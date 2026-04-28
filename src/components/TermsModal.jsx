import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TermsModal = ({ onClose, forceScroll = true }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(!forceScroll);

  const handleScroll = (e) => {
    if (!forceScroll) return;
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <h3>利用規約</h3>
        <div className="terms-scroll-area" onScroll={handleScroll}>
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
          スタッフの確認前に誤って「使用済み」にした場合、再発行はできません。<br/>
          一度「使用済み」となった特典は再利用できません。<br/>
          画面のスクリーンショットによる引き換えは無効です。</p>
          
          <h4>5. 免責事項</h4>
          <p>本アプリの使用中に発生した事故、怪我、端末の故障、紛失、またはデータの消失について、主催者は一切の責任を負いません。<br/><br/>
          歩きスマホは大変危険です。画面の操作は必ず安全な場所に立ち止まって行ってください。<br/>
          本サービスは予告なく中断・終了する場合があります。</p>
          
          <p className="copyright">©2026 なずな祭実行委員会</p>
        </div>
        <div className="modal-footer">
          {!hasScrolledToBottom && (
            <p className="scroll-notice">最下部までスクロールしてください</p>
          )}
          <button 
            className={`btn-primary ${!hasScrolledToBottom ? 'disabled' : ''}`}
            disabled={!hasScrolledToBottom}
            onClick={onClose}
          >
            確認して閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
