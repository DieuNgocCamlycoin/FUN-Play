/**
 * Debug logging utility for FUN PLAY
 * Only logs when DEBUG mode is enabled via localStorage or env
 * 
 * Usage:
 *   import { debugLog, enableDebug, disableDebug } from '@/lib/debugLog';
 *   debugLog('MyComponent', 'message', data);
 */

const DEBUG_KEY = 'FUN_PLAY_DEBUG';

// Check if debug mode is enabled
const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage
  const localDebug = localStorage.getItem(DEBUG_KEY);
  if (localDebug === 'true') return true;
  
  // Check URL param for quick enable
  if (window.location.search.includes('debug=true')) {
    localStorage.setItem(DEBUG_KEY, 'true');
    return true;
  }
  
  return false;
};

// Enable debug mode
export const enableDebug = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEBUG_KEY, 'true');
    console.log('[FUN PLAY] Debug mode enabled');
  }
};

// Disable debug mode
export const disableDebug = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEBUG_KEY);
    console.log('[FUN PLAY] Debug mode disabled');
  }
};

// Debug log function
export const debugLog = (module: string, message: string, data?: unknown): void => {
  if (!isDebugEnabled()) return;
  
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const prefix = `[${timestamp}] [${module}]`;
  
  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
};

// Debug warn function
export const debugWarn = (module: string, message: string, data?: unknown): void => {
  if (!isDebugEnabled()) return;
  
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const prefix = `[${timestamp}] [${module}]`;
  
  if (data !== undefined) {
    console.warn(prefix, message, data);
  } else {
    console.warn(prefix, message);
  }
};

// Debug error - always logs regardless of debug mode
export const debugError = (module: string, message: string, error?: unknown): void => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.error(`[${timestamp}] [${module}]`, message, error);
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).FUN_PLAY_DEBUG = {
    enable: enableDebug,
    disable: disableDebug,
    isEnabled: isDebugEnabled,
  };
}
