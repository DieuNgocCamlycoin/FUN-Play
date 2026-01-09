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
    // Request notification permission on load
    requestNotificationPermission();
  }, []);

  // Real-time monitoring for incoming transactions on ALL pages
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

          // Update received count
          const { count } = await supabase
            .from('wallet_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('to_user_id', user.id)
            .eq('status', 'success');

          setReceivedAmount(amount.toFixed(3));
          setReceivedToken(token);
          setReceivedCount((count || 0));
          setShowRichNotification(true);

          // Show browser notification
          showLocalNotification(
            '💰 FUN Play - RICH!',
            {
              body: `Bạn vừa nhận được ${amount.toFixed(3)} ${token}! 🎉`,
              icon: '/images/camly-coin.png',
              badge: '/images/camly-coin.png',
              tag: 'crypto-payment',
              requireInteraction: true,
            }
          );

          // Send message to service worker for PWA push notification
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CRYPTO_RECEIVED',
              amount: amount.toFixed(3),
              token: token,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Listen for FUN Wallet transaction events (from FunWallet page iframe)
  useEffect(() => {
    const handleFunWalletTx = (event: CustomEvent) => {
      const { amount, token, type } = event.detail || {};
      
      if (type === 'received') {
        setReceivedAmount(String(amount));
        setReceivedToken(token || 'CAMLY');
        setShowRichNotification(true);

        // Browser notification
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
