import { useEffect } from 'react';
import { debugLog } from '@/lib/debugLog';

// Update this version with each deployment
const APP_VERSION = '2025.02.07.1';

export const VersionCheck = () => {
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      debugLog('VersionCheck', 'New version detected', { current: APP_VERSION, previous: storedVersion });
      
      // Clear Service Worker caches
      if ('caches' in window) {
        caches.keys().then(names => {
          debugLog('VersionCheck', 'Clearing caches', { count: names.length });
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Unregister old Service Workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          debugLog('VersionCheck', 'Unregistering service workers', { count: registrations.length });
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Save new version and reload
      localStorage.setItem('app_version', APP_VERSION);
      
      // Small delay to ensure cache operations complete
      setTimeout(() => {
        debugLog('VersionCheck', 'Reloading page');
        window.location.reload();
      }, 500);
    } else if (!storedVersion) {
      // First visit, just store the version
      localStorage.setItem('app_version', APP_VERSION);
      debugLog('VersionCheck', 'First visit', { version: APP_VERSION });
    }
  }, []);
  
  return null;
};
