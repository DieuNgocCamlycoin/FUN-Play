import { useEffect } from 'react';

// Update this version with each deployment
const APP_VERSION = '2025.01.10.1';

export const VersionCheck = () => {
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log('[VersionCheck] New version detected:', APP_VERSION, 'Previous:', storedVersion);
      
      // Clear Service Worker caches
      if ('caches' in window) {
        caches.keys().then(names => {
          console.log('[VersionCheck] Clearing', names.length, 'caches...');
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Unregister old Service Workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          console.log('[VersionCheck] Unregistering', registrations.length, 'service workers...');
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Save new version and reload
      localStorage.setItem('app_version', APP_VERSION);
      
      // Small delay to ensure cache operations complete
      setTimeout(() => {
        console.log('[VersionCheck] Reloading page...');
        window.location.reload();
      }, 500);
    } else if (!storedVersion) {
      // First visit, just store the version
      localStorage.setItem('app_version', APP_VERSION);
      console.log('[VersionCheck] First visit, version:', APP_VERSION);
    }
  }, []);
  
  return null;
};
