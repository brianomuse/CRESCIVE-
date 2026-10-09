import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline functionality and fast shell caching in production
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
} else if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Ensure development server hot reloading and module resolution are never intercepted by stale service workers
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
