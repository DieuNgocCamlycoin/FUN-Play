import { useState, useEffect, useCallback, useRef } from 'react';
import { getAccount, watchAccount, switchChain, disconnect, getBalance } from '@wagmi/core';
import { 
  wagmiConfig, 
  BSC_CHAIN_ID, 
  getWeb3Modal, 
  isMobileBrowser, 
  isInWalletBrowser, 
  getWalletDeepLink,
  logWalletDebug,
  detectAvailableWallet,
  getWeb3ConfigStatus
} from '@/lib/web3Config';
import { bsc } from '@wagmi/core/chains';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatEther } from 'viem';
export type WalletType = 'metamask' | 'bitget' | 'unknown';

interface UseWalletConnectionReturn {
  isConnected: boolean;
  address: string;
  walletType: WalletType;
  chainId: number | undefined;
  isCorrectChain: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  bnbBalance: string;
  connectWallet: () => Promise<void>;
  connectWithMobileSupport: (preferredWallet?: 'metamask' | 'bitget' | 'trust') => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToBSC: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

export const useWalletConnection = (): UseWalletConnectionReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('unknown');
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  // Initialize immediately to true - button should always be visible
  const [isInitialized, setIsInitialized] = useState(true);
  const [bnbBalance, setBnbBalance] = useState('0');
  const { user } = useAuth();
  const { toast } = useToast();

  const isCorrectChain = chainId === BSC_CHAIN_ID;

  // Detect wallet type from connector name
  const detectWalletType = (connectorName: string): WalletType => {
    const name = connectorName.toLowerCase();
    if (name.includes('metamask')) return 'metamask';
    if (name.includes('bitget') || name.includes('bitkeep')) return 'bitget';
    return 'unknown';
  };

  // Fetch BNB balance
  const fetchBalance = useCallback(async (addr: `0x${string}`) => {
    try {
      const balance = await getBalance(wagmiConfig, { address: addr, chainId: BSC_CHAIN_ID });
      setBnbBalance(formatEther(balance.value));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBnbBalance('0');
    }
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (address) {
      await fetchBalance(address as `0x${string}`);
    }
  }, [address, fetchBalance]);

  // Save wallet info to database
  const saveWalletToDb = useCallback(async (walletAddress: string, type: WalletType) => {
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({
          wallet_address: walletAddress,
          wallet_type: type === 'metamask' ? 'MetaMask' : type === 'bitget' ? 'Bitget Wallet' : 'Unknown',
        })
        .eq('id', user.id);
      
      // Track IP for wallet connection (non-blocking)
      supabase.functions.invoke('track-ip', {
        body: { action_type: 'wallet_connect', wallet_address: walletAddress },
      }).catch(e => console.warn('[Wallet] track-ip failed:', e));
    } catch (error) {
      console.error('Failed to save wallet to DB:', error);
    }
  }, [user]);

  // Clear wallet info from database
  const clearWalletFromDb = useCallback(async () => {
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({
          wallet_address: null,
          wallet_type: null,
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to clear wallet from DB:', error);
    }
  }, [user]);

  // Switch to BSC chain
  const switchToBSC = useCallback(async () => {
    try {
      setIsLoading(true);
      await switchChain(wagmiConfig, { chainId: bsc.id });
      toast({
        title: '✅ Đã chuyển sang BSC',
        description: 'Bạn đã kết nối với BNB Smart Chain',
      });
    } catch (error: any) {
      console.error('Failed to switch chain:', error);
      toast({
        title: 'Lỗi chuyển mạng',
        description: 'Vui lòng chuyển sang BSC trong ví của bạn',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Connect wallet using Web3Modal
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = getWeb3ConfigStatus();
      const availableWallet = detectAvailableWallet();
      
      logWalletDebug('Starting wallet connection', {
        ...status,
        availableWallet,
      });
      
      // Check if WalletConnect is properly configured
      if (!status.projectId) {
        toast({
          title: 'Cấu hình thiếu',
          description: 'WalletConnect chưa được cấu hình. Vui lòng liên hệ admin.',
          variant: 'destructive',
        });
        return;
      }
      
      const modal = getWeb3Modal();
      console.log('[WalletConnect] Modal instance:', !!modal);
      console.log('[WalletConnect] Modal state before open:', modal?.getState?.());
      
      if (modal) {
        logWalletDebug('Opening Web3Modal...');
        await modal.open();
        logWalletDebug('modal.open() completed');
        
        // Debug: Check if modal elements exist in DOM after opening
        setTimeout(() => {
          const modalElements = document.querySelectorAll('w3m-modal, wcm-modal, [data-w3m-modal], wui-flex[data-modal="true"]');
          console.log('[WalletConnect] Modal elements in DOM:', modalElements.length);
          modalElements.forEach((el, i) => {
            console.log(`[WalletConnect] Modal ${i}:`, el.tagName, el.className);
            const computedStyle = window.getComputedStyle(el);
            console.log(`[WalletConnect] Modal ${i} display:`, computedStyle.display);
            console.log(`[WalletConnect] Modal ${i} visibility:`, computedStyle.visibility);
            console.log(`[WalletConnect] Modal ${i} z-index:`, computedStyle.zIndex);
          });
        }, 500);
      } else {
        console.error('[WalletConnect] Modal is null!');
        logWalletDebug('Web3Modal not initialized - attempting re-init');
        toast({
          title: 'Đang khởi tạo...',
          description: 'Vui lòng đợi và thử lại trong giây lát.',
        });
        // Try to reinitialize
        setTimeout(() => {
          getWeb3Modal();
        }, 500);
      }
    } catch (error: any) {
      logWalletDebug('Connection error', error);
      toast({
        title: 'Lỗi kết nối ví',
        description: error.message || 'Không thể kết nối ví. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Connect with mobile deep link support
  const connectWithMobileSupport = useCallback(async (preferredWallet?: 'metamask' | 'bitget' | 'trust') => {
    const isMobile = isMobileBrowser();
    const inWallet = isInWalletBrowser();
    const availableWallet = detectAvailableWallet();
    
    logWalletDebug('Mobile connect attempt', { 
      isMobile, 
      inWallet, 
      preferredWallet,
      availableWallet 
    });
    
    // If already in wallet browser, just connect directly
    if (inWallet) {
      logWalletDebug('In wallet browser, connecting directly via injected provider');
      
      // If there's an injected provider, try to use it directly
      if (availableWallet) {
        toast({
          title: `🦊 Kết nối ${availableWallet === 'metamask' ? 'MetaMask' : availableWallet === 'bitget' ? 'Bitget' : 'Trust'}...`,
          description: 'Vui lòng xác nhận trong ví của bạn',
        });
      }
      
      await connectWallet();
      return;
    }
    
    // On mobile, if user selected a specific wallet, use deep link
    if (isMobile && preferredWallet) {
      const deepLink = getWalletDeepLink(preferredWallet);
      logWalletDebug(`Opening ${preferredWallet} via deep link`, { deepLink });
      
      toast({
        title: '🔗 Đang mở ví...',
        description: `Đang chuyển đến ${preferredWallet === 'metamask' ? 'MetaMask' : preferredWallet === 'bitget' ? 'Bitget Wallet' : 'Trust Wallet'}`,
      });
      
      // Small delay to show toast before redirect
      setTimeout(() => {
        window.location.href = deepLink;
      }, 500);
      return;
    }
    
    // Desktop or mobile without preferred wallet: use Web3Modal
    logWalletDebug('Using Web3Modal for connection');
    await connectWallet();
  }, [connectWallet, toast]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      await disconnect(wagmiConfig);
      await clearWalletFromDb();
      
      setIsConnected(false);
      setAddress('');
      setWalletType('unknown');
      setChainId(undefined);
      setBnbBalance('0');
      
      toast({
        title: '✅ Đã ngắt kết nối',
        description: 'Ví của bạn đã được ngắt kết nối',
      });
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clearWalletFromDb, toast]);

  // Initialize and watch account changes
  useEffect(() => {
    const init = async () => {
      try {
        getWeb3Modal();
        
        const account = getAccount(wagmiConfig);
        if (account.address && account.isConnected) {
          setAddress(account.address);
          setIsConnected(true);
          setChainId(account.chainId);
          
          const type = detectWalletType(account.connector?.name || '');
          setWalletType(type);
          
          await saveWalletToDb(account.address, type);
          await fetchBalance(account.address);
          
          // Auto-switch to BSC if on wrong chain
          if (account.chainId !== BSC_CHAIN_ID) {
            switchToBSC();
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Web3 init error:', error);
        setIsInitialized(true);
      }
    };

    init();

    // Watch for account changes
    const unwatch = watchAccount(wagmiConfig, {
      onChange: async (account) => {
        if (account.address && account.isConnected) {
          setAddress(account.address);
          setIsConnected(true);
          setChainId(account.chainId);
          
          const type = detectWalletType(account.connector?.name || '');
          setWalletType(type);
          
          await saveWalletToDb(account.address, type);
          await fetchBalance(account.address);
          
          // Auto-switch to BSC if on wrong chain
          if (account.chainId !== BSC_CHAIN_ID) {
            switchToBSC();
          }
        } else {
          setAddress('');
          setIsConnected(false);
          setWalletType('unknown');
          setChainId(undefined);
          setBnbBalance('0');
          await clearWalletFromDb();
        }
      },
    });

    return () => unwatch();
  }, [saveWalletToDb, clearWalletFromDb, switchToBSC, fetchBalance]);

  return {
    isConnected,
    address,
    walletType,
    chainId,
    isCorrectChain,
    isLoading,
    isInitialized,
    bnbBalance,
    connectWallet,
    connectWithMobileSupport,
    disconnectWallet,
    switchToBSC,
    refreshBalance,
  };
};
