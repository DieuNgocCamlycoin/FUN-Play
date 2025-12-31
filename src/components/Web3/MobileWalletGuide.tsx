import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Smartphone, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle,
  Wallet
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileWalletGuideProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const WALLET_INFO = {
  metamask: {
    name: "MetaMask",
    icon: "🦊",
    description: "Ví Web3 phổ biến nhất thế giới",
    androidUrl: "https://play.google.com/store/apps/details?id=io.metamask",
    iosUrl: "https://apps.apple.com/app/metamask/id1438144202",
    deepLink: "metamask://",
    color: "from-orange-500 to-orange-600",
    steps: [
      "Tải MetaMask từ App Store/Play Store",
      "Mở app và tạo ví mới hoặc import ví có sẵn",
      "Thêm mạng BSC (BNB Smart Chain)",
      "Quay lại FUN PLAY và nhấn 'Kết nối Ví'",
      "Chọn MetaMask trong danh sách ví"
    ]
  },
  bitget: {
    name: "Bitget Wallet",
    icon: "💎",
    description: "Ví đa năng với hỗ trợ nhiều chain",
    androidUrl: "https://play.google.com/store/apps/details?id=com.bitkeep.wallet",
    iosUrl: "https://apps.apple.com/app/bitget-wallet-ex-bitkeep/id1395301115",
    deepLink: "bitkeep://",
    color: "from-blue-500 to-purple-600",
    steps: [
      "Tải Bitget Wallet từ App Store/Play Store",
      "Mở app và tạo ví mới hoặc import",
      "BSC đã được hỗ trợ sẵn trong app",
      "Quay lại FUN PLAY và nhấn 'Kết nối Ví'",
      "Chọn Bitget Wallet trong danh sách"
    ]
  },
  trust: {
    name: "Trust Wallet",
    icon: "🛡️",
    description: "Ví chính thức của Binance, tích hợp BSC sẵn",
    androidUrl: "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp",
    iosUrl: "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409",
    deepLink: "trust://",
    color: "from-cyan-500 to-blue-600",
    steps: [
      "Tải Trust Wallet từ App Store/Play Store",
      "Mở app và tạo ví mới hoặc import",
      "BSC (BNB Smart Chain) đã được hỗ trợ sẵn",
      "Quay lại FUN PLAY và nhấn 'Kết nối Ví'",
      "Chọn Trust Wallet trong danh sách"
    ]
  }
};

export const MobileWalletGuide = ({ open, onOpenChange, trigger }: MobileWalletGuideProps) => {
  const [selectedWallet, setSelectedWallet] = useState<"metamask" | "bitget" | "trust">("metamask");
  const isMobile = useIsMobile();
  
  const currentWallet = WALLET_INFO[selectedWallet];
  
  const openAppStore = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS ? currentWallet.iosUrl : currentWallet.androidUrl;
    window.open(url, "_blank");
  };
  
  const openWalletApp = () => {
    window.location.href = currentWallet.deepLink;
  };

  const content = (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="text-center p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <Smartphone className="w-10 h-10 mx-auto mb-2 text-primary" />
        <h3 className="font-semibold text-lg">Kết nối Ví trên Mobile</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Cài đặt app ví và quay lại để kết nối
        </p>
      </div>

      {/* Wallet Selection Tabs */}
      <Tabs value={selectedWallet} onValueChange={(v) => setSelectedWallet(v as typeof selectedWallet)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metamask" className="gap-1 text-xs">
            <span>🦊</span> MetaMask
          </TabsTrigger>
          <TabsTrigger value="bitget" className="gap-1 text-xs">
            <span>💎</span> Bitget
          </TabsTrigger>
          <TabsTrigger value="trust" className="gap-1 text-xs">
            <span>🛡️</span> Trust
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedWallet}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value={selectedWallet} className="mt-4 space-y-4">
              {/* Wallet Card */}
              <Card className={`bg-gradient-to-r ${currentWallet.color} text-white`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{currentWallet.icon}</span>
                    <div>
                      <h4 className="font-bold text-lg">{currentWallet.name}</h4>
                      <p className="text-sm opacity-90">{currentWallet.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Steps */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Các bước thực hiện
                </h4>
                <div className="space-y-2">
                  {currentWallet.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid gap-3 pt-2">
                <Button 
                  onClick={openAppStore}
                  className={`bg-gradient-to-r ${currentWallet.color} hover:opacity-90`}
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Tải {currentWallet.name}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                
                {isMobile && (
                  <Button 
                    variant="outline"
                    onClick={openWalletApp}
                    size="lg"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Mở {currentWallet.name} App
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Tips */}
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400">Mẹo nhỏ</p>
              <p className="text-muted-foreground">
                Sau khi cài đặt ví, hãy quay lại trang này và nhấn nút "Kết nối Ví". 
                Hệ thống sẽ tự động mở app ví của bạn.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // If using as controlled dialog
  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Hướng dẫn cài đặt Ví
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // If using as standalone component within a dialog controlled externally
  return content;
};

export default MobileWalletGuide;
