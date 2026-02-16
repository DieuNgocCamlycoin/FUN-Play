import { useState, useCallback, useEffect, useRef } from 'react';

import { useWalletConnection } from './useWalletConnection';
import { toast } from '@/hooks/use-toast';
import { isMobileBrowser } from '@/lib/web3Config';
import type { ConnectionStep } from '@/components/Web3/WalletConnectionProgress';

interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  autoReconnect: boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelayMs: 2000,
  autoReconnect: true,
};

export const useWalletConnectionWithRetry = (config: Partial<RetryConfig> = {}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const walletConnection = useWalletConnection();
  
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('idle');
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionError, setConnectionError] = useState<string | undefined>();
  const [retryCount, setRetryCount] = useState(0);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasConnectedRef = useRef(false);
  const isConnectedRef = useRef(walletConnection.isConnected);
  const disconnectedAtRef = useRef<number | null>(null);

  // Clear intervals on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Keep isConnectedRef in sync
  useEffect(() => {
    isConnectedRef.current = walletConnection.isConnected;
  }, [walletConnection.isConnected]);

  // Auto-reconnect with debounce (5s) to avoid storms on mobile app-switching
  useEffect(() => {
    if (walletConnection.isConnected) {
      // Connection restored - clear any pending reconnect
      wasConnectedRef.current = true;
      disconnectedAtRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    if (wasConnectedRef.current && !walletConnection.isConnected && mergedConfig.autoReconnect) {
      // Mark disconnect time
      if (!disconnectedAtRef.current) {
        disconnectedAtRef.current = Date.now();
      }

      console.log('[WalletRetry] Connection lost, scheduling auto-reconnect in 5s...');
      
      // Debounce: wait 5 seconds before attempting reconnect
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        // Only reconnect if still disconnected after 5s
        if (!isConnectedRef.current && disconnectedAtRef.current) {
          console.log('[WalletRetry] Still disconnected after 5s, attempting reconnect...');
          toast({
            title: '⚠️ Mất kết nối ví',
            description: 'Đang thử kết nối lại...',
          });
          connectWithRetry();
        }
      }, 5000);
    }
    
    // Don't update wasConnectedRef here when disconnected - keep it true
  }, [walletConnection.isConnected, mergedConfig.autoReconnect]);

  // Update step based on wallet state
  useEffect(() => {
    if (walletConnection.isConnected && connectionStep !== 'idle') {
      setConnectionStep('connected');
      setConnectionProgress(100);
      setConnectionError(undefined);
      setRetryCount(0);
      
      setTimeout(() => {
        setConnectionStep('idle');
        setConnectionProgress(0);
      }, 2000);
    }
  }, [walletConnection.isConnected, connectionStep]);

  // Simulate progress during connection
  const startProgressSimulation = useCallback(() => {
    setConnectionProgress(0);
    let progress = 0;
    
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90;
      setConnectionProgress(Math.min(progress, 90));
    }, 300);
  }, []);

  const stopProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Connect with retry logic
  const connectWithRetry = useCallback(async () => {
    if (walletConnection.isConnected) {
      console.log('[WalletRetry] Already connected, skipping...');
      setConnectionStep('connected');
      setConnectionProgress(100);
      return true;
    }

    // Dynamic timeout: 30s mobile, 15s desktop
    const connectionTimeout = isMobileBrowser() ? 30000 : 15000;

    const attemptConnect = async (attempt: number): Promise<boolean> => {
      try {
        console.log(`[WalletRetry] Attempt ${attempt} starting... (timeout: ${connectionTimeout}ms)`);
        setConnectionStep('initializing');
        setConnectionError(undefined);
        startProgressSimulation();
        
        await new Promise(resolve => setTimeout(resolve, 300));
        setConnectionStep('opening-modal');
        
        await walletConnection.connectWithMobileSupport();
        
        setConnectionStep('waiting-approval');
        
        const startTime = Date.now();
        const checkInterval = 300;
        
        let connected = isConnectedRef.current;
        
        while (!connected && Date.now() - startTime < connectionTimeout) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          connected = isConnectedRef.current;
          if (connected) break;
        }
        
        if (connected) {
          console.log('[WalletRetry] Connection successful!');
          stopProgressSimulation();
          setConnectionProgress(100);
          setConnectionStep('connected');
          toast({
            title: '✅ Kết nối thành công!',
            description: 'Ví đã được kết nối với BSC Network',
          });
          return true;
        }
        
        console.log('[WalletRetry] Timeout reached, checking modal state...');
        stopProgressSimulation();
        setConnectionStep('idle');
        setConnectionProgress(0);
        return false;
        
      } catch (error: unknown) {
        stopProgressSimulation();
        console.error(`[WalletRetry] Attempt ${attempt} failed:`, error);
        
        const errorMessage = error instanceof Error ? error.message : '';
        const errorMsg = errorMessage.toLowerCase();
        const isUserCancel = errorMsg.includes('user rejected') || 
                             errorMsg.includes('user denied') ||
                             errorMsg.includes('cancelled');
        
        if (isUserCancel) {
          console.log('[WalletRetry] User cancelled connection');
          setConnectionStep('idle');
          setConnectionProgress(0);
          return false;
        }
        
        if (attempt < mergedConfig.maxRetries) {
          setRetryCount(attempt);
          toast({
            title: `⚠️ Thử lại (${attempt}/${mergedConfig.maxRetries})`,
            description: 'Kết nối thất bại, đang thử lại...',
          });
          
          await new Promise(resolve => setTimeout(resolve, mergedConfig.retryDelayMs));
          return attemptConnect(attempt + 1);
        }
        
        setConnectionStep('error');
        setConnectionError('Không thể kết nối ví. Vui lòng thử mở trang trong ứng dụng ví.');
        setConnectionProgress(0);
        return false;
      }
    };
    
    return attemptConnect(1);
  }, [walletConnection.isConnected, walletConnection.connectWithMobileSupport, mergedConfig, startProgressSimulation, stopProgressSimulation]);

  // Manual retry
  const retry = useCallback(() => {
    setRetryCount(0);
    connectWithRetry();
  }, [connectWithRetry]);

  // Cancel connection attempt
  const cancel = useCallback(() => {
    stopProgressSimulation();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setConnectionStep('idle');
    setConnectionProgress(0);
    setConnectionError(undefined);
  }, [stopProgressSimulation]);

  return {
    ...walletConnection,
    connectionStep,
    connectionProgress,
    connectionError,
    retryCount,
    connectWithRetry,
    retry,
    cancel,
    isConnecting: connectionStep !== 'idle' && connectionStep !== 'connected' && connectionStep !== 'error',
  };
};
