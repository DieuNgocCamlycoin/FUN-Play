import { useState, useCallback, useEffect, useRef } from 'react';
import { useWalletConnection } from './useWalletConnection';
import { toast } from '@/hooks/use-toast';
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

  // Clear intervals on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Auto-reconnect when connection is lost
  useEffect(() => {
    if (wasConnectedRef.current && !walletConnection.isConnected && mergedConfig.autoReconnect) {
      console.log('[WalletRetry] Connection lost, attempting auto-reconnect...');
      toast({
        title: '⚠️ Mất kết nối ví',
        description: 'Đang thử kết nối lại...',
      });
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWithRetry();
      }, mergedConfig.retryDelayMs);
    }
    
    wasConnectedRef.current = walletConnection.isConnected;
  }, [walletConnection.isConnected, mergedConfig.autoReconnect, mergedConfig.retryDelayMs]);

  // Update step based on wallet state
  useEffect(() => {
    if (walletConnection.isConnected && connectionStep !== 'idle') {
      setConnectionStep('connected');
      setConnectionProgress(100);
      setConnectionError(undefined);
      setRetryCount(0);
      
      // Reset to idle after showing success
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
      if (progress > 90) progress = 90; // Cap at 90% until actual connection
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
    // If already connected, skip
    if (walletConnection.isConnected) {
      console.log('[WalletRetry] Already connected, skipping...');
      setConnectionStep('connected');
      setConnectionProgress(100);
      return true;
    }

    const attemptConnect = async (attempt: number): Promise<boolean> => {
      try {
        console.log(`[WalletRetry] Attempt ${attempt} starting...`);
        setConnectionStep('initializing');
        setConnectionError(undefined);
        startProgressSimulation();
        
        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 300));
        setConnectionStep('opening-modal');
        
        // Use mobile support for better UX on mobile
        await walletConnection.connectWithMobileSupport();
        
        setConnectionStep('waiting-approval');
        
        // Wait for connection with timeout - shorter timeout for faster feedback
        const connectionTimeout = 15000; // 15 seconds
        const startTime = Date.now();
        const checkInterval = 300;
        
        // Check current state immediately
        let connected = walletConnection.isConnected;
        
        while (!connected && Date.now() - startTime < connectionTimeout) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          // Re-check connection state
          connected = walletConnection.isConnected;
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
        
        // Don't throw error if modal is still open - user might still be approving
        console.log('[WalletRetry] Timeout reached, checking modal state...');
        stopProgressSimulation();
        setConnectionStep('idle');
        setConnectionProgress(0);
        return false;
        
      } catch (error: any) {
        stopProgressSimulation();
        console.error(`[WalletRetry] Attempt ${attempt} failed:`, error);
        
        // Don't retry for user-initiated cancellations
        const errorMsg = error.message?.toLowerCase() || '';
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
