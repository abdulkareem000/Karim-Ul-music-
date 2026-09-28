import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-register service worker for offline audio caching and mobile app experience
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New Karim Ul update available. Reloading...');
  },
  onOfflineReady() {
    console.log('Karim Ul is ready to stream offline!');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
