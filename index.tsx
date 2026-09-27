import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  // Register immediately, including when the entry module runs after `load`.
  // Waiting only for a future load event can leave offline caching uninstalled.
  navigator.serviceWorker.register('/sw.js').catch((error) => {
    console.warn('QuietSend offline cache could not be installed.', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
