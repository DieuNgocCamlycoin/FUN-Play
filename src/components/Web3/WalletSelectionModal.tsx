import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ExternalLink, Smartphone, Monitor, QrCode, ArrowRight, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getWalletDeepLink, isMobileBrowser, logWalletDebug } from "@/lib/web3Config";

interface WalletSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => Promise<void>;
  onDeepLink: (wallet: 'metamask' | 'bitget' | 'trust') => void;
  isConnecting: boolean;
}

const WALLETS = [
  {
    id: 'metamask' as const,
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    description: 'Ví Web3 phổ biến nhất',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  {
    id: 'bitget' as const,
    name: 'Bitget Wallet',
    icon: 'https://img.cryptorank.io/exchanges/bitget1663580368976.png',
    description: 'Ví đa năng hỗ trợ nhiều chain',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'trust' as const,
    name: 'Trust Wallet',
    icon: 'https://assets.coingecko.com/coins/images/11085/small/Trust.png',
    description: 'Ví chính thức của Binance',
    color: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
];

export const WalletSelectionModal = ({
  open,
  onOpenChange,
  onConnect,
  onDeepLink,
  isConnecting,
}: WalletSelectionModalProps) => {
  const isMobile = useIsMobile();
  const [selectedWallet, setSelectedWallet] = useState<typeof WALLETS[0] | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleWalletSelect = async (wallet: typeof WALLETS[0]) => {
    setSelectedWallet(wallet);
    logWalletDebug(`Selected wallet: ${wallet.name}`, { isMobile });

    if (isMobileBrowser()) {
      // On mobile: Use deep link to open wallet app
      setIsRedirecting(true);
      
      // Small delay to show selection feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onDeepLink(wallet.id);
      
      // Close modal after a delay (user will be redirected)
      setTimeout(() => {
        setIsRedirecting(false);
        setSelectedWallet(null);
        onOpenChange(false);
      }, 2000);
    } else {
      // On desktop: Use Web3Modal
      await onConnect();
      setSelectedWallet(null);
    }
  };

  const handleClose = () => {
    if (!isConnecting && !isRedirecting) {
      setSelectedWallet(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/20">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {isMobile ? (
                <Smartphone className="w-6 h-6 text-primary" />
              ) : (
                <Monitor className="w-6 h-6 text-primary" />
              )}
              Chọn Ví Web3
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {isMobile 
              ? "Chọn ví để mở app và kết nối" 
              : "Chọn ví hoặc quét mã QR để kết nối"
            }
          </p>
        </div>

        {/* Wallet options */}
        <div className="p-4 space-y-3">
          <AnimatePresence>
            {WALLETS.map((wallet, index) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${wallet.bgColor} ${wallet.borderColor} border-2 ${
                    selectedWallet?.id === wallet.id 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => !isConnecting && !isRedirecting && handleWalletSelect(wallet)}
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${wallet.color} opacity-5`} />
                  
                  <div className="relative p-4 flex items-center gap-4">
                    {/* Wallet icon */}
                    <div className="relative">
                      <img 
                        src={wallet.icon} 
                        alt={wallet.name}
                        className="w-12 h-12 rounded-xl object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/camly-coin.png';
                        }}
                      />
                      {/* Selection indicator */}
                      {selectedWallet?.id === wallet.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                        >
                          {isRedirecting ? (
                            <Loader2 className="w-3 h-3 text-primary-foreground animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Wallet info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{wallet.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {wallet.description}
                      </p>
                    </div>

                    {/* Action indicator */}
                    <div className="flex-shrink-0">
                      {selectedWallet?.id === wallet.id ? (
                        isRedirecting ? (
                          <div className="flex items-center gap-1 text-primary text-sm">
                            <span>Đang mở</span>
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : (
                          <Check className="w-5 h-5 text-primary" />
                        )
                      ) : (
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* QR Code option for desktop */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="outline"
                className="w-full py-6 border-dashed border-2 hover:border-primary/50 gap-3"
                onClick={onConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <QrCode className="w-5 h-5 text-primary" />
                )}
                <span>Quét mã QR với ví di động</span>
              </Button>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Hỗ trợ BSC Network</span>
            <a
              href="https://docs.fun.rich/wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              Cần trợ giúp?
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelectionModal;
