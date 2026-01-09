import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WalletLink {
  id: string;
  user_id: string;
  wallet_address: string;
  platform: string;
  linked_at: string;
  is_primary: boolean;
  sync_status: string;
  last_sync_at: string;
}

export const FUN_WALLET_URL = 'https://funwallet-rich.lovable.app';

export const getFunWalletDeepLink = (callbackUrl?: string): string => {
  const callback = callbackUrl || window.location.href;
  return `${FUN_WALLET_URL}/connect?callback=${encodeURIComponent(callback)}`;
};

export const useFunWalletSync = () => {
  const { user } = useAuth();
  const [isLinked, setIsLinked] = useState(false);
  const [funWalletAddress, setFunWalletAddress] = useState<string | null>(null);
  const [walletLink, setWalletLink] = useState<WalletLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<string | null>(null);

  // Listen for balance updates from iframe postMessage
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (event.detail?.balance) {
        setBalance(event.detail.balance);
      }
    };
    
    window.addEventListener('fun-wallet-balance', handleBalanceUpdate as EventListener);
    return () => window.removeEventListener('fun-wallet-balance', handleBalanceUpdate as EventListener);
  }, []);

  // Check link status on mount
  useEffect(() => {
    const checkLink = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('wallet_links')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', 'fun_wallet')
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsLinked(true);
          setFunWalletAddress(data.wallet_address);
          setWalletLink(data as WalletLink);
        }
      } catch (error) {
        console.error('Error checking FUN Wallet link:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLink();
  }, [user?.id]);

  // Realtime sync for wallet updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('fun-wallet-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_links',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[FUN Wallet Sync] Received update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as WalletLink;
            if (newData.platform === 'fun_wallet') {
              setIsLinked(true);
              setFunWalletAddress(newData.wallet_address);
              setWalletLink(newData);
              toast.success('FUN Wallet đã đồng bộ!');
            }
          } else if (payload.eventType === 'DELETE') {
            const oldData = payload.old as WalletLink;
            if (oldData.platform === 'fun_wallet') {
              setIsLinked(false);
              setFunWalletAddress(null);
              setWalletLink(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Listen for postMessage from FUN Wallet
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Accept messages from FUN Wallet
      if (event.origin !== FUN_WALLET_URL) return;

      const { type, payload } = event.data || {};

      if (type === 'FUN_WALLET_CONNECTED' && payload?.address) {
        console.log('[FUN Wallet] Received connection:', payload);
        await linkFunWallet(payload.address);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user?.id]);

  const linkFunWallet = useCallback(async (address: string) => {
    if (!user?.id) {
      toast.error('Vui lòng đăng nhập để liên kết FUN Wallet');
      return false;
    }

    try {
      const { error } = await supabase
        .from('wallet_links')
        .upsert({
          user_id: user.id,
          wallet_address: address.toLowerCase(),
          platform: 'fun_wallet',
          is_primary: true,
          sync_status: 'active',
          last_sync_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) throw error;

      setIsLinked(true);
      setFunWalletAddress(address.toLowerCase());
      toast.success('Đã liên kết FUN Wallet thành công!');
      return true;
    } catch (error) {
      console.error('Error linking FUN Wallet:', error);
      toast.error('Không thể liên kết FUN Wallet');
      return false;
    }
  }, [user?.id]);

  const unlinkFunWallet = useCallback(async () => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('wallet_links')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', 'fun_wallet');

      if (error) throw error;

      setIsLinked(false);
      setFunWalletAddress(null);
      setWalletLink(null);
      toast.success('Đã hủy liên kết FUN Wallet');
      return true;
    } catch (error) {
      console.error('Error unlinking FUN Wallet:', error);
      toast.error('Không thể hủy liên kết');
      return false;
    }
  }, [user?.id]);

  const openFunWallet = useCallback(() => {
    const deepLink = getFunWalletDeepLink();
    window.open(deepLink, '_blank');
  }, []);

  return {
    isLinked,
    funWalletAddress,
    walletLink,
    isLoading,
    balance,
    linkFunWallet,
    unlinkFunWallet,
    openFunWallet,
    FUN_WALLET_URL
  };
};
