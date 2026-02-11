import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { RichNotification } from "./RichNotification";
import { requestNotificationPermission, showLocalNotification } from "@/lib/pushNotifications";

export const GlobalPaymentNotifications = () => {
  const { user } = useAuth();
  const [showRichNotification, setShowRichNotification] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receivedToken, setReceivedToken] = useState("");
  const [receivedCount, setReceivedCount] = useState(0);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Helper to count total received transactions
  const fetchReceivedCount = async (userId: string) => {
    const [walletResult, donationResult] = await Promise.all([
      supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', userId)
        .in('status', ['success', 'completed']),
      supabase
        .from('donation_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('status', 'success'),
    ]);
    return (walletResult.count || 0) + (donationResult.count || 0);
  };

  // Helper to show notification
  const triggerNotification = (amount: string, token: string, count: number) => {
    setReceivedAmount(amount);
    setReceivedToken(token);
    setReceivedCount(count);
    setShowRichNotification(true);

    showLocalNotification(
      '💰 FUN Play - RICH!',
      {
        body: `Bạn vừa nhận được ${amount} ${token}! 🎉`,
        icon: '/images/camly-coin.png',
        badge: '/images/camly-coin.png',
        tag: 'crypto-payment',
        requireInteraction: true,
      }
    );

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CRYPTO_RECEIVED',
        amount,
        token,
      });
    }
  };

  // Real-time: wallet_transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-wallet-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `to_user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Global payment notification received:', payload);
          const newTx = payload.new;
          const amount = parseFloat(newTx.amount as string);
          const token = newTx.token_type as string;
          const count = await fetchReceivedCount(user.id);
          triggerNotification(amount.toFixed(3), token, count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Real-time: donation_transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-donation-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donation_transactions',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Donation notification received:', payload);
          const newTx = payload.new;
          const amount = parseFloat(newTx.amount as string);

          // Fetch token symbol from donate_tokens
          let tokenSymbol = 'CAMLY';
          if (newTx.token_id) {
            const { data: tokenData } = await supabase
              .from('donate_tokens')
              .select('symbol')
              .eq('id', newTx.token_id as string)
              .single();
            if (tokenData) tokenSymbol = tokenData.symbol;
          }

          const count = await fetchReceivedCount(user.id);
          triggerNotification(amount.toFixed(3), tokenSymbol, count);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'donation_transactions',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const newTx = payload.new;
          const oldTx = payload.old;
          // Only notify when status changes to 'success'
          if (newTx.status === 'success' && oldTx.status !== 'success') {
            console.log('Donation confirmed:', payload);
            const amount = parseFloat(newTx.amount as string);

            let tokenSymbol = 'CAMLY';
            if (newTx.token_id) {
              const { data: tokenData } = await supabase
                .from('donate_tokens')
                .select('symbol')
                .eq('id', newTx.token_id as string)
                .single();
              if (tokenData) tokenSymbol = tokenData.symbol;
            }

            const count = await fetchReceivedCount(user.id);
            triggerNotification(amount.toFixed(3), tokenSymbol, count);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Listen for FUN Wallet transaction events
  useEffect(() => {
    const handleFunWalletTx = (event: CustomEvent) => {
      const { amount, token, type } = event.detail || {};
      
      if (type === 'received') {
        setReceivedAmount(String(amount));
        setReceivedToken(token || 'CAMLY');
        setShowRichNotification(true);

        showLocalNotification('🔶 FUN Wallet - RICH!', {
          body: `Bạn vừa nhận được ${amount} ${token}! 🎉`,
          icon: '/images/fun-wallet-logo.png',
        });
      }
    };

    window.addEventListener('fun-wallet-transaction', handleFunWalletTx as EventListener);
    return () => window.removeEventListener('fun-wallet-transaction', handleFunWalletTx as EventListener);
  }, []);

  return (
    <RichNotification
      show={showRichNotification}
      amount={receivedAmount}
      token={receivedToken}
      count={receivedCount}
      onClose={() => setShowRichNotification(false)}
      userId={user?.id}
    />
  );
};
