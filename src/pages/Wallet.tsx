import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet as WalletIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnectionWithRetry } from "@/hooks/useWalletConnectionWithRetry";
import { MainLayout } from "@/components/Layout/MainLayout";
import { CAMLYPriceSection } from "@/components/Wallet/CAMLYPriceSection";
import { ClaimRewardsSection } from "@/components/Wallet/ClaimRewardsSection";
import { TopSponsorsSection } from "@/components/Wallet/TopSponsorsSection";
import { TransactionHistorySection } from "@/components/Wallet/TransactionHistorySection";
import { WalletSelectionModal } from "@/components/Web3/WalletSelectionModal";
import { WalletChangeConfirmDialog } from "@/components/Web3/WalletChangeConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    isConnected, 
    address, 
    connectWithRetry, 
    disconnectWallet,
    isConnecting, 
    isInitialized,
    // Wallet change dialog
    showWalletChangeDialog,
    walletChangeDetails,
    isProcessingWalletChange,
    handleConfirmWalletChange,
    handleCancelWalletChange,
  } = useWalletConnectionWithRetry();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (authLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ boxShadow: ["0 0 15px hsl(var(--primary)/0.3)", "0 0 30px hsl(var(--primary)/0.5)", "0 0 15px hsl(var(--primary)/0.3)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="rounded-full"
                >
                  <img src="/images/fun-play-wallet-icon.png" alt="FUN PLAY WALLET" className="h-12 w-12 rounded-full" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-primary">FUN PLAY WALLET</h1>
                  <p className="text-sm text-muted-foreground">Trung tâm tài chính của bạn</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isConnected && address ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-mono text-primary">{formatAddress(address)}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={disconnectWallet} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowWalletModal(true)} disabled={isConnecting || !isInitialized} className="gap-2">
                  <WalletIcon className="h-4 w-4" />
                  {isConnecting ? "Đang kết nối..." : "Kết nối ví"}
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <CAMLYPriceSection />
            <ClaimRewardsSection />
            <TopSponsorsSection />
            <TransactionHistorySection />
          </div>
        </div>
      </div>

      <WalletSelectionModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onSelectFunWallet={() => navigate("/fun-wallet")}
        onSelectOtherWallet={() => { setShowWalletModal(false); connectWithRetry(); }}
        isConnecting={isConnecting}
      />

      {/* Wallet Change Confirmation Dialog */}
      <WalletChangeConfirmDialog
        open={showWalletChangeDialog}
        oldAddress={walletChangeDetails?.oldAddress || ''}
        newAddress={walletChangeDetails?.newAddress || ''}
        oldWalletType={walletChangeDetails?.oldWalletType}
        newWalletType={walletChangeDetails?.newWalletType}
        isLoading={isProcessingWalletChange}
        onConfirm={handleConfirmWalletChange}
        onCancel={handleCancelWalletChange}
      />
    </MainLayout>
  );
};

export default WalletPage;
