import { useState, useEffect, useCallback } from 'react';
import { getAccount, watchAccount, switchChain, getConnectors, disconnect } from '@wagmi/core';
import { wagmiConfig, BSC_CHAIN_ID, BSC_CONFIG, getWeb3Modal, isMobileBrowser, isInWalletBrowser, getMobileWalletDeepLink, getAppStoreLink, isMetaMaskAvailable, isBitgetAvailable } from '@/lib/web3Config';
import { bsc } from '@wagmi/core/chains';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type WalletType = 'metamask' | 'bitget' | 'unknown';

interface UseWalletConnectionReturn {
  isConnected: boolean;
  address: string;
  walletType: WalletType;
  chainId: number | undefined;
  isCorrectChain: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  isMobile: boolean;
  isInWallet: boolean;
  connectWallet: (type?: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToBSC: () => Promise<void>;
  openInWalletApp: (type: WalletType) => void;
}

export const useWalletConnection = (): UseWalletConnectionReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('unknown');
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const isMobile = isMobileBrowser();
  const isInWallet = isInWalletBrowser();
  const isCorrectChain = chainId === BSC_CHAIN_ID;

  // Detect wallet type from connector
  const detectWalletType = (connectorName: string): WalletType => {
    const name = connectorName.toLowerCase();
    if (name.includes('metamask')) return 'metamask';
    if (name.includes('bitget') || name.includes('bitkeep')) return 'bitget';
    return 'unknown';
  };

  // Get wallet type display name
  const getWalletDisplayName = (type: WalletType): string => {
    if (type === 'metamask') return 'MetaMask';
    if (type === 'bitget') return 'Bitget Wallet';
    return 'Unknown';
  };

  // Save wallet info to database
  const saveWalletToDb = useCallback(async (walletAddress: string, type: WalletType) => {
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({
          wallet_address: walletAddress,
          wallet_type: getWalletDisplayName(type),
        })
        .eq('id', user.id);
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
      
      // Try to switch chain via wagmi
      await switchChain(wagmiConfig, { chainId: bsc.id });
      
      toast({
        title: '✅ Đã chuyển sang BSC',
        description: 'Bạn đã kết nối với BNB Smart Chain',
      });
    } catch (error: any) {
      // If chain doesn't exist, try to add it
      if (error.code === 4902 || error.message?.includes('Unrecognized chain')) {
        try {
          const ethereum = (window as any).ethereum;
          if (ethereum) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [BSC_CONFIG],
            });
          }
        } catch (addError) {
          console.error('Failed to add BSC chain:', addError);
          toast({
            title: 'Không thể thêm BSC',
            description: 'Vui lòng thêm BSC thủ công trong ví của bạn',
            variant: 'destructive',
          });
        }
      } else {
        console.error('Failed to switch chain:', error);
        toast({
          title: 'Lỗi chuyển mạng',
          description: 'Vui lòng chuyển sang BSC trong ví của bạn',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Open wallet app on mobile
  const openInWalletApp = useCallback((type: WalletType) => {
    if (!isMobile) return;
    if (type === 'unknown') return;
    
    const deepLink = getMobileWalletDeepLink(type);
    
    // Try to open the deep link
    window.location.href = deepLink;
    
    // If app is not installed, redirect to app store after a delay
    setTimeout(() => {
      const appStoreLink = getAppStoreLink(type);
      window.location.href = appStoreLink;
    }, 2500);
  }, [isMobile]);

  // Connect wallet
  const connectWallet = useCallback(async (type?: WalletType) => {
    try {
      setIsLoading(true);

      // On mobile, if not in wallet browser, open wallet app
      if (isMobile && !isInWallet && type) {
        openInWalletApp(type);
        setIsLoading(false);
        return;
      }

      // If in wallet browser or on desktop, use Web3Modal
      const modal = getWeb3Modal();
      if (modal) {
        await modal.open();
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast({
        title: 'Lỗi kết nối ví',
        description: error.message || 'Không thể kết nối ví. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isMobile, isInWallet, openInWalletApp, toast]);

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
          
          const connectors = getConnectors(wagmiConfig);
          const activeConnector = connectors.find(c => c.id === account.connector?.id);
          const type = detectWalletType(activeConnector?.name || '');
          setWalletType(type);
          
          await saveWalletToDb(account.address, type);
          
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
          
          const connectors = getConnectors(wagmiConfig);
          const activeConnector = connectors.find(c => c.id === account.connector?.id);
          const type = detectWalletType(activeConnector?.name || '');
          setWalletType(type);
          
          await saveWalletToDb(account.address, type);
          
          // Auto-switch to BSC if on wrong chain
          if (account.chainId !== BSC_CHAIN_ID) {
            switchToBSC();
          }
        } else {
          setAddress('');
          setIsConnected(false);
          setWalletType('unknown');
          setChainId(undefined);
          await clearWalletFromDb();
        }
      },
    });

    return () => unwatch();
  }, [saveWalletToDb, clearWalletFromDb, switchToBSC]);

  return {
    isConnected,
    address,
    walletType,
    chainId,
    isCorrectChain,
    isLoading,
    isInitialized,
    isMobile,
    isInWallet,
    connectWallet,
    disconnectWallet,
    switchToBSC,
    openInWalletApp,
  };
};
