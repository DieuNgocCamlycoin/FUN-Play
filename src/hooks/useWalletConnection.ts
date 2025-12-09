import { useState, useEffect, useCallback } from 'react';
import { getAccount, watchAccount, switchChain, disconnect, getBalance } from '@wagmi/core';
import { wagmiConfig, BSC_CHAIN_ID, getWeb3Modal } from '@/lib/web3Config';
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
  const [isInitialized, setIsInitialized] = useState(false);
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
  }, [toast]);

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
    disconnectWallet,
    switchToBSC,
    refreshBalance,
  };
};
