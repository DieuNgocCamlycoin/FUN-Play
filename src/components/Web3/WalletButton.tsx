import { Wallet, ChevronDown, ExternalLink, LogOut, AlertTriangle, Loader2, HelpCircle, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletConnectionWithRetry } from "@/hooks/useWalletConnectionWithRetry";
import { logWalletDebug, getWeb3ConfigStatus, isMobileBrowser } from "@/lib/web3Config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileWalletGuide } from "./MobileWalletGuide";
import { WalletSelectionModal } from "./WalletSelectionModal";
import { useFunWalletSync, FUN_WALLET_URL } from "@/hooks/useFunWalletSync";

// Wallet icons
const METAMASK_ICON = "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg";
const BITGET_ICON = "https://img.cryptorank.io/exchanges/bitget1663580368976.png";
const BSC_ICON = "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png";

export const WalletButton = () => {
  const navigate = useNavigate();
  const {
    isConnected,
    address,
    walletType,
    isCorrectChain,
    isLoading,
    isInitialized,
    connectWithRetry,
    disconnectWallet,
    switchToBSC,
    isConnecting,
  } = useWalletConnectionWithRetry();

  const [showGuide, setShowGuide] = useState(false);
  const [showWalletSelection, setShowWalletSelection] = useState(false);
  const isMobile = isMobileBrowser();
  const { isLinked: isFunWalletLinked, funWalletAddress, openFunWallet } = useFunWalletSync();

  // Get wallet icon based on type  
  const getWalletIcon = () => {
    if (isFunWalletLinked) return null; // Use emoji for FUN Wallet
    if (walletType === 'metamask') return METAMASK_ICON;
    if (walletType === 'bitget') return BITGET_ICON;
    return null;
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Open BSCScan explorer
  const openExplorer = () => {
    if (address) {
      window.open(`https://bscscan.com/address/${address}`, '_blank');
    }
  };

  // Handle connect - show wallet selection modal
  const handleConnect = () => {
    setShowWalletSelection(true);
  };

  // Handle connecting to other wallets via Web3Modal
  const handleConnectOtherWallet = async () => {
    const status = getWeb3ConfigStatus();
    logWalletDebug('Connect button clicked', status);
    
    if (!status.projectId) {
      console.error('[WalletButton] WalletConnect Project ID not configured!');
    }
    
    await connectWithRetry();
  };

  // Loading state
  if (!isInitialized) {
    return (
      <Button
        disabled
        size="sm"
        className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500"
      >
        <Wallet className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline">Đang tải...</span>
      </Button>
    );
  }

  // Connected state
  if (isConnected) {
    const walletIcon = getWalletIcon();

    return (
      <>
        {/* Chain switch warning */}
        {!isCorrectChain && (
          <Button
            onClick={switchToBSC}
            size="sm"
            variant="destructive"
            className="gap-2 mr-2 animate-pulse"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Chuyển BSC</span>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/50 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20 relative overflow-visible"
              disabled={isLoading}
            >
              {/* Wallet icon */}
              {isFunWalletLinked ? (
                <span className="text-lg">🎮</span>
              ) : walletIcon ? (
                <img src={walletIcon} alt={walletType} className="h-5 w-5 rounded-full" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              
              {/* Address */}
              <span className="font-mono text-sm">{formatAddress(address)}</span>
              
              {/* BSC indicator */}
              {isCorrectChain && (
                <img src={BSC_ICON} alt="BSC" className="h-4 w-4 rounded-full" />
              )}
              
              <ChevronDown className="h-3 w-3 opacity-50" />

              {/* Little angel sitting on the button (desktop only) */}
              <motion.div
                className="absolute -top-6 right-0 hidden md:block pointer-events-none"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-lg">👼</span>
              </motion.div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56 bg-background z-[9999]">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">Đã kết nối với</p>
              <p className="font-mono text-sm font-medium">{formatAddress(address)}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {isFunWalletLinked && (
                  <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-500 border-yellow-500/30 mr-1">
                    🎮 FUN Wallet
                  </Badge>
                )}
                {isCorrectChain ? (
                  <>
                    <img src={BSC_ICON} alt="BSC" className="h-3 w-3 rounded-full" />
                    <span className="text-xs text-green-500">BSC Mainnet</span>
                  </>
                ) : (
                  <span className="text-xs text-yellow-500">⚠️ Sai mạng</span>
                )}
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            {/* FUN Wallet link */}
            <DropdownMenuItem onClick={() => window.open(FUN_WALLET_URL, '_blank')} className="gap-2">
              <Gamepad2 className="h-4 w-4 text-yellow-500" />
              Mở FUN Wallet
            </DropdownMenuItem>
            
            {!isCorrectChain && (
              <DropdownMenuItem onClick={switchToBSC} className="gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                Chuyển sang BSC
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={openExplorer} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Xem trên BscScan
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={disconnectWallet} 
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Ngắt kết nối
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  // Disconnected state - Connect button (uses Web3Modal which works on ALL devices)
  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          onClick={handleConnect}
          size="sm"
          disabled={isLoading || isConnecting}
          className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold shadow-lg shadow-yellow-500/25 transition-all duration-300 hover:shadow-yellow-500/40 hover:scale-105"
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{isConnecting ? 'Đang kết nối...' : 'Kết nối ví'}</span>
          <span className="sm:hidden">{isConnecting ? '...' : 'Ví'}</span>
        </Button>
        
        {/* Help button for mobile users */}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(true)}
            className="p-2"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
      
      {/* Mobile Wallet Guide Dialog */}
      <MobileWalletGuide 
        open={showGuide} 
        onOpenChange={setShowGuide}
        trigger={<></>}
      />

      {/* Wallet Selection Modal */}
      <WalletSelectionModal
        open={showWalletSelection}
        onOpenChange={setShowWalletSelection}
        onSelectFunWallet={() => navigate("/fun-wallet")}
        onSelectOtherWallet={handleConnectOtherWallet}
        isConnecting={isConnecting}
      />
    </>
  );
};
