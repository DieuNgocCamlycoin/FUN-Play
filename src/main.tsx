import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCapacitor, isNative } from "./lib/capacitorInit";
import { initWeb3Modal } from "./lib/web3Config";

// Initialize Web3Modal EARLY for mobile wallet support
if (typeof window !== 'undefined') {
  initWeb3Modal();
  console.log('Web3Modal initialized for wallet connections');
}

// Initialize Capacitor for native app features
if (isNative) {
  initCapacitor().then(() => {
    console.log('Capacitor initialized for native platform');
  });
}

// Auto-reload when new Service Worker is activated
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('[App] New version activated, reloading...');
            window.location.reload();
          }
        });
      }
    });
  });
  
  // Listen for SW controller change (when new SW takes over)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[App] New Service Worker controller, reloading...');
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
