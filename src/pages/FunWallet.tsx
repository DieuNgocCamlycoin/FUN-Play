import { useEffect, useRef, useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle2, Send } from 'lucide-react';
import { useFunWalletSync, FUN_WALLET_URL } from '@/hooks/useFunWalletSync';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { SendToFunWalletModal } from '@/components/Web3/SendToFunWalletModal';
import { showLocalNotification } from '@/lib/pushNotifications';

export default function FunWallet() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isLinked, funWalletAddress, linkFunWallet } = useFunWalletSync();
  const [showSendModal, setShowSendModal] = useState(false);

  // Listen for postMessage from FUN Wallet iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Only accept messages from FUN Wallet
      if (event.origin !== FUN_WALLET_URL) return;

      const { type, payload } = event.data || {};
      console.log('[FUN Play] Received message from FUN Wallet:', type, payload);

      switch (type) {
        case 'FUN_WALLET_CONNECTED':
          if (payload?.address) {
            const success = await linkFunWallet(payload.address);
            if (success) {
              toast.success('Đã kết nối FUN Wallet thành công!');
            }
          }
          break;
        case 'FUN_WALLET_BALANCE_UPDATE':
          // Emit custom event for other components to listen
          window.dispatchEvent(new CustomEvent('fun-wallet-balance', {
            detail: { balance: payload?.balance, token: payload?.token }
          }));
          break;
        case 'FUN_WALLET_TX_SUCCESS':
          toast.success(`Giao dịch thành công: ${payload?.hash?.slice(0, 10)}...`);
          break;
        case 'FUN_WALLET_TX_ERROR':
          toast.error(`Giao dịch thất bại: ${payload?.message || 'Unknown error'}`);
          break;
        case 'FUN_WALLET_TX_RECEIVED':
          // Show push notification for incoming transaction
          showLocalNotification('🔶 FUN Wallet - RICH!', {
            body: `Bạn vừa nhận được ${payload?.amount} ${payload?.token}! 🎉`,
            icon: '/images/fun-wallet-logo.png',
          });
          // Dispatch event for RichNotification
          window.dispatchEvent(new CustomEvent('fun-wallet-transaction', {
            detail: {
              amount: payload?.amount,
              token: payload?.token,
              from: payload?.from,
              type: 'received'
            }
          }));
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [linkFunWallet]);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <img 
              src="/images/fun-wallet-logo.png" 
              alt="FUN Wallet" 
              className="h-10 w-10 rounded-full shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 bg-clip-text text-transparent">
                  FUN Wallet
                </h1>
                {isLinked && (
                  <Badge variant="outline" className="gap-1 text-green-500 border-green-500/30 bg-green-500/10">
                    <CheckCircle2 className="h-3 w-3" />
                    Đã kết nối
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isLinked ? formatAddress(funWalletAddress!) : 'Ví chính thức của hệ sinh thái FUN'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLinked && (
              <Button 
                variant="default" 
                size="sm"
                className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                onClick={() => setShowSendModal(true)}
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Gửi CAMLY</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={() => window.open(FUN_WALLET_URL, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Mở tab mới</span>
            </Button>
          </div>
        </div>
        
        {/* Iframe container */}
        <div className="flex-1 relative">
          <iframe
            ref={iframeRef}
            src={FUN_WALLET_URL}
            className="absolute inset-0 w-full h-full border-0"
            title="FUN Wallet"
            allow="clipboard-write; clipboard-read"
          />
        </div>
      </div>

      {/* Send CAMLY Modal */}
      <SendToFunWalletModal 
        isOpen={showSendModal} 
        onClose={() => setShowSendModal(false)} 
      />
    </MainLayout>
  );
}
