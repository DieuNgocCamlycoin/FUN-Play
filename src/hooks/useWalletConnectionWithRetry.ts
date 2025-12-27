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
    const attemptConnect = async (attempt: number): Promise<boolean> => {
      try {
        setConnectionStep('initializing');
        setConnectionError(undefined);
        startProgressSimulation();
        
        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));
        setConnectionStep('opening-modal');
        
        // Use mobile support for better UX on mobile
        await walletConnection.connectWithMobileSupport();
        
        setConnectionStep('waiting-approval');
        
        // Wait for connection with timeout
        const connectionTimeout = 30000; // 30 seconds
        const startTime = Date.now();
        
        while (!walletConnection.isConnected && Date.now() - startTime < connectionTimeout) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (walletConnection.isConnected) {
          stopProgressSimulation();
          setConnectionProgress(100);
          setConnectionStep('connected');
          return true;
        }
        
        throw new Error('Hết thời gian chờ kết nối');
      } catch (error: any) {
        stopProgressSimulation();
        console.error(`[WalletRetry] Attempt ${attempt} failed:`, error);
        
        if (attempt < mergedConfig.maxRetries) {
          setRetryCount(attempt);
          toast({
            title: `Thử lại (${attempt}/${mergedConfig.maxRetries})`,
            description: `Kết nối thất bại, đang thử lại...`,
          });
          
          await new Promise(resolve => setTimeout(resolve, mergedConfig.retryDelayMs));
          return attemptConnect(attempt + 1);
        }
        
        setConnectionStep('error');
        setConnectionError(error.message || 'Không thể kết nối ví');
        setConnectionProgress(0);
        return false;
      }
    };
    
    return attemptConnect(1);
  }, [walletConnection, mergedConfig, startProgressSimulation, stopProgressSimulation]);

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
