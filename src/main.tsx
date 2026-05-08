import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for notifications (safely)
if ('serviceWorker' in navigator && 'Notification' in window) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('SW registered successfully:', registration.scope);
    })
    .catch((error) => {
      console.warn('SW registration failed (this is OK):', error);
    });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
