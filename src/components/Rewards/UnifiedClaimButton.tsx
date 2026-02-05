import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Coins, Wallet, ChevronDown, ExternalLink, LogOut, Gamepad2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnectionWithRetry } from "@/hooks/useWalletConnectionWithRetry";
import { supabase } from "@/integrations/supabase/client";
import { ClaimRewardsModal } from "./ClaimRewardsModal";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { SUPPORTED_TOKENS } from "@/config/tokens";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnifiedClaimButtonProps {
  compact?: boolean;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  icon: string;
}

export const UnifiedClaimButton = ({ compact = false }: UnifiedClaimButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    isConnected,
    address,
    disconnectWallet,
    connectWithRetry,
  } = useWalletConnectionWithRetry();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);

  // Fetch rewards function
  const fetchRewards = useCallback(async () => {
    if (!user?.id) {
      setUnclaimedCount(0);
      setTotalUnclaimed(0);
      setApprovedAmount(0);
      return;
    }

    try {
      // Fetch unclaimed reward transactions
      const { data: transactions } = await supabase
        .from("reward_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("claimed", false)
        .eq("status", "success");

      if (transactions) {
        setUnclaimedCount(transactions.length);
        setTotalUnclaimed(transactions.reduce((sum, r) => sum + Number(r.amount), 0));
      }

      // Fetch approved rewards from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("approved_reward")
        .eq("id", user.id)
        .single();

      if (profile) {
        setApprovedAmount(profile.approved_reward || 0);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    }
  }, [user?.id]);

  // Initial fetch and window event listeners
  useEffect(() => {
    fetchRewards();

    // Listen for reward events
    const handleReward = () => fetchRewards();
    window.addEventListener("camly-reward", handleReward);
    window.addEventListener("reward-claimed", handleReward);

    return () => {
      window.removeEventListener("camly-reward", handleReward);
      window.removeEventListener("reward-claimed", handleReward);
    };
  }, [fetchRewards]);

  // Supabase Realtime subscription for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('unified-claim-rewards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchRewards()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        () => fetchRewards()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchRewards]);

  // Fetch token balances when connected
  const fetchBalances = useCallback(async (userAddress: string) => {
    if (!userAddress) return;
    
    setIsFetchingBalances(true);
    const newBalances: TokenBalance[] = [];

    try {
      const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      
      for (const token of SUPPORTED_TOKENS.slice(0, 3)) { // Only first 3 tokens for compact view
        try {
          if (token.address === "native") {
            const balance = await provider.getBalance(userAddress);
            const bnbBalance = ethers.formatEther(balance);
            newBalances.push({ 
              symbol: token.symbol, 
              balance: parseFloat(bnbBalance).toFixed(4),
              icon: token.icon
            });
          } else {
            const tokenContract = new ethers.Contract(
              token.address,
              ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"],
              provider
            );
            
            const [balance, decimals] = await Promise.all([
              tokenContract.balanceOf(userAddress),
              tokenContract.decimals()
            ]);
            
            const formattedBalance = ethers.formatUnits(balance, decimals);
            newBalances.push({ 
              symbol: token.symbol, 
              balance: parseFloat(formattedBalance).toFixed(4),
              icon: token.icon
            });
          }
        } catch {
          newBalances.push({ symbol: token.symbol, balance: "0.0000", icon: token.icon });
        }
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    }

    setBalances(newBalances);
    setIsFetchingBalances(false);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances(address);
    }
  }, [isConnected, address, fetchBalances]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleButtonClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // If has unclaimed rewards, open claim modal
    if (totalUnclaimed > 0 || approvedAmount > 0) {
      setModalOpen(true);
      return;
    }

    // If connected but no rewards, dropdown will handle
    if (!isConnected) {
      connectWithRetry();
    }
  };

  const hasRewards = totalUnclaimed > 0 || approvedAmount > 0;
  const showDropdown = isConnected && !hasRewards;

  // Compact version for mobile
  if (compact) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {showDropdown ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 relative text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Coins className="h-3.5 w-3.5" />
                      {isConnected && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full border border-background" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-green-500 rounded-full" />
                      {formatAddress(address || "")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Token Balances
                    </DropdownMenuLabel>
                    {balances.map((token) => (
                      <DropdownMenuItem key={token.symbol} className="justify-between">
                        <span className="flex items-center gap-2">
                          <img src={token.icon} alt={token.symbol} className="h-4 w-4 rounded-full" />
                          {token.symbol}
                        </span>
                        <span className="text-muted-foreground">{token.balance}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/wallet")} className="gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      Mở FUN Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => window.open(`https://bscscan.com/address/${address}`, "_blank")}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Xem trên BscScan
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={disconnectWallet} className="gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      Ngắt kết nối
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleButtonClick}
                  className="h-7 w-7 relative text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                >
                  <motion.div
                    animate={hasRewards ? { rotate: [0, 15, -15, 0] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Coins className="h-3.5 w-3.5" />
                  </motion.div>
                  {unclaimedCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center"
                    >
                      {unclaimedCount > 9 ? "9+" : unclaimedCount}
                    </motion.span>
                  )}
                  {isConnected && !hasRewards && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full border border-background" />
                  )}
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {hasRewards ? "Nhận thưởng CAMLY" : isConnected ? "Ví đã kết nối" : "Kết nối ví"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <ClaimRewardsModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  // Full version for desktop
  return (
    <>
      {showDropdown ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <Coins className="h-4 w-4" />
              <span className="hidden md:inline">{formatAddress(address || "")}</span>
              <span className="h-2 w-2 bg-green-500 rounded-full" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full" />
              Đã kết nối BSC Mainnet
            </DropdownMenuLabel>
            <div className="px-2 py-1 text-xs text-muted-foreground font-mono">
              {address}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Token Balances
            </DropdownMenuLabel>
            {isFetchingBalances ? (
              <DropdownMenuItem disabled>Đang tải...</DropdownMenuItem>
            ) : (
              balances.map((token) => (
                <DropdownMenuItem key={token.symbol} className="justify-between">
                  <span className="flex items-center gap-2">
                    <img src={token.icon} alt={token.symbol} className="h-5 w-5 rounded-full" />
                    <span className="font-medium">{token.symbol}</span>
                  </span>
                  <span className="text-muted-foreground">{token.balance}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/wallet")} className="gap-2">
              <Gamepad2 className="h-4 w-4" />
              Mở FUN Wallet
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.open(`https://bscscan.com/address/${address}`, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Xem trên BscScan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={disconnectWallet} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Ngắt kết nối ví
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <motion.div className="relative">
          <Button
            onClick={handleButtonClick}
            className={`relative gap-2 ${
              hasRewards
                ? "bg-gradient-to-r from-yellow-500 to-cyan-500 hover:from-yellow-600 hover:to-cyan-600 text-white font-bold shadow-lg"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {/* Shimmer effect for rewards */}
            {hasRewards && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-lg"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
            
            <motion.div
              animate={hasRewards ? { rotate: [0, 15, -15, 0] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Coins className="h-5 w-5" />
            </motion.div>
            
            <span className="hidden md:inline">
              {!user
                ? "Nhận Thưởng"
                : hasRewards
                ? "Claim"
                : isConnected
                ? formatAddress(address || "")
                : "Kết nối ví"}
            </span>

            {/* Badge count */}
            <AnimatePresence>
              {unclaimedCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
                >
                  {unclaimedCount > 99 ? "99+" : unclaimedCount}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Glow effect */}
            {hasRewards && (
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none"
                animate={{
                  boxShadow: [
                    "0 0 10px rgba(255, 215, 0, 0.5)",
                    "0 0 20px rgba(64, 224, 208, 0.5)",
                    "0 0 10px rgba(255, 215, 0, 0.5)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </Button>
        </motion.div>
      )}

      <ClaimRewardsModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
