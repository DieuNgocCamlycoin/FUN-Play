import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ExternalLink } from "lucide-react";
import { FUN_WALLET_URL } from "@/hooks/useFunWalletSync";
import { toast } from "sonner";

interface WalletSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFunWallet: () => void;
  onSelectOtherWallet: () => void;
  isConnecting?: boolean;
}

export const WalletSelectionModal = ({
  open,
  onOpenChange,
  onSelectFunWallet,
  onSelectOtherWallet,
  isConnecting = false,
}: WalletSelectionModalProps) => {
  
  // Listen for callback success from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'FUN_WALLET_CALLBACK_SUCCESS') {
        console.log('[WalletSelectionModal] Received callback success:', event.data.payload);
        toast.success('Đã kết nối FUN Wallet thành công!');
        onOpenChange(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onOpenChange]);
  
  const handleFunWallet = () => {
    // Create callback URL for FUN Wallet to redirect back
    const callbackUrl = `${window.location.origin}/fun-wallet-callback`;
    const funWalletConnectUrl = `${FUN_WALLET_URL}/connect?callback=${encodeURIComponent(callbackUrl)}&app=funplay`;
    
    console.log('[WalletSelectionModal] Opening FUN Wallet connect:', funWalletConnectUrl);
    
    // Open in popup window for better control
    const popup = window.open(
      funWalletConnectUrl,
      'fun-wallet-connect',
      'width=450,height=700,left=100,top=100,scrollbars=yes,resizable=yes'
    );
    
    // If popup blocked, fall back to new tab
    if (!popup) {
      console.log('[WalletSelectionModal] Popup blocked, opening in new tab');
      window.open(funWalletConnectUrl, '_blank');
    }
    
    onSelectFunWallet();
    // Don't close modal immediately - wait for callback
  };

  const handleOtherWallet = () => {
    onSelectOtherWallet();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5" />
            Kết nối Ví
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* FUN Wallet - Primary Option */}
          <div className="relative">
            <Button
              onClick={handleFunWallet}
              className="w-full h-auto p-4 flex flex-col items-start gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border-2 border-yellow-500/50 hover:border-yellow-500 transition-all"
              variant="outline"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎮</span>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">FUN Wallet</span>
                      <Badge className="bg-yellow-500 text-black text-xs">Khuyên dùng</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ví chính thức của hệ sinh thái FUN
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">hoặc</span>
            </div>
          </div>

          {/* Other Wallets */}
          <Button
            onClick={handleOtherWallet}
            variant="outline"
            disabled={isConnecting}
            className="w-full h-auto p-4 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                alt="MetaMask" 
                className="h-8 w-8 rounded-full bg-white p-1"
              />
              <img 
                src="https://img.cryptorank.io/exchanges/bitget1663580368976.png" 
                alt="Bitget" 
                className="h-8 w-8 rounded-full bg-white p-1"
              />
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                +
              </div>
            </div>
            <div className="text-left flex-1">
              <span className="font-medium text-foreground">Kết nối ví khác</span>
              <p className="text-xs text-muted-foreground">
                MetaMask, Bitget, Trust Wallet...
              </p>
            </div>
          </Button>

          {/* Info */}
          <p className="text-xs text-center text-muted-foreground px-4">
            💡 Sử dụng FUN Wallet để đồng bộ tài sản giữa các ứng dụng trong hệ sinh thái FUN
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

