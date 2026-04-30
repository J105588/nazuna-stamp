import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { AlertTriangle } from 'lucide-react'

// Appを遅延読み込み（停止時はダウンロードされないようにする）
const App = lazy(() => import('./App.jsx'));

const IS_APP_STOPPED = import.meta.env.VITE_APP_STOPPED !== 'false';

const StoppedScreen = () => (
  <div className="app-stopped-container">
    <div className="stopped-card">
      <div className="stopped-icon">
        <AlertTriangle size={64} />
      </div>
      <h1>サービス停止中</h1>
      <p>現在、「なずな祭街歩きスタンプラリー」はサービスを停止しております。</p>
      <p>開催期間外、またはメンテナンス中の可能性があります。</p>
      <div className="stopped-footer">
        <p>©2026 なずな祭実行委員会</p>
      </div>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {IS_APP_STOPPED ? (
      <StoppedScreen />
    ) : (
      <Suspense fallback={null}>
        <App />
      </Suspense>
    )}
  </React.StrictMode>,
)
