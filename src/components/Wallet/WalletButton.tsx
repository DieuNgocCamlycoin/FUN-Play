import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatViewsShort } from "@/lib/formatters";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WalletButtonProps {
  compact?: boolean;
  className?: string;
}

export const WalletButton = ({ compact = false, className }: WalletButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingRewards, setPendingRewards] = useState(0);
  const [approvedRewards, setApprovedRewards] = useState(0);

  // Fetch rewards function
  const fetchRewards = useCallback(async () => {
    if (!user?.id) {
      setPendingRewards(0);
      setApprovedRewards(0);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("pending_rewards, approved_reward")
        .eq("id", user.id)
        .single();

      if (profile) {
        setPendingRewards(profile.pending_rewards || 0);
        setApprovedRewards(profile.approved_reward || 0);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    }
  }, [user?.id]);

  // Initial fetch and event listeners
  useEffect(() => {
    fetchRewards();

    const handleReward = () => fetchRewards();
    window.addEventListener("camly-reward", handleReward);
    window.addEventListener("reward-claimed", handleReward);

    return () => {
      window.removeEventListener("camly-reward", handleReward);
      window.removeEventListener("reward-claimed", handleReward);
    };
  }, [fetchRewards]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('wallet-button-rewards')
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

  const handleClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/wallet");
  };

  const totalRewards = pendingRewards + approvedRewards;
  const hasRewards = totalRewards > 0;


  // Compact version for mobile
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClick}
              className={cn(
                "h-7 w-7 relative",
                hasRewards && "text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10",
                className
              )}
            >
              <motion.div
                animate={hasRewards ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <img 
                  src="/images/fun-play-wallet-icon.png" 
                  alt="Wallet" 
                  className="h-5 w-5 rounded-full"
                />
              </motion.div>
              
              {/* Badge for rewards */}
              <AnimatePresence>
                {hasRewards && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      boxShadow: "0 0 8px rgba(255, 215, 0, 0.6)"
                    }}
                  >
                    {formatViewsShort(totalRewards)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="space-y-1">
              <p className="font-bold">FUN PLAY WALLET</p>
              {hasRewards ? (
                <>
                  <p className="text-yellow-500">🪙 {totalRewards.toLocaleString()} CAMLY</p>
                  <p className="text-muted-foreground text-[10px]">Nhấn để xem chi tiết & Claim</p>
                </>
              ) : (
                <p className="text-muted-foreground">Nhấn để mở ví</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full version for desktop - Hologram Glass Cyan-Teal-Blue Style
  return (
    <motion.div className={cn("relative", className)}>
      <Button
        onClick={handleClick}
        className={cn(
          "relative gap-2 font-bold transition-all duration-300 overflow-hidden rounded-full px-4 h-10",
          "bg-[linear-gradient(90deg,#5EEAD4_0%,#22D3EE_35%,#06B6D4_50%,#0EA5E9_75%,#0284C7_100%)]",
          "text-white",
          "hover:brightness-110 hover:saturate-125 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(34,211,238,0.5)]",
          "active:brightness-95 active:translate-y-0.5 active:shadow-[0_2px_10px_rgba(34,211,238,0.3)]"
        )}
        style={{
          boxShadow: "0 4px 20px rgba(34, 211, 238, 0.35), 0 0 40px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255,255,255,0.4)"
        }}
      >
        {/* Glass highlight reflection on top */}
        <div 
          className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none"
        />
        
        {/* Continuous Mirror Shimmer Effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-mirror-shimmer pointer-events-none rounded-full"
          style={{ width: '50%' }}
        />
        
        <div className="relative z-10">
          <img 
            src="/images/fun-play-wallet-icon.png" 
            alt="Wallet" 
            className="h-6 w-6 rounded-full drop-shadow-lg"
          />
        </div>
        
        <span 
          className="relative z-10 font-bold text-white tracking-wide text-base"
          style={{
            textShadow: "0 0 10px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.2)"
          }}
        >
          WALLET
        </span>

        {/* Soft glow effect for rewards */}
        {hasRewards && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 20px rgba(34, 211, 238, 0.4)",
                "0 0 35px rgba(6, 182, 212, 0.6)",
                "0 0 20px rgba(34, 211, 238, 0.4)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </Button>
    </motion.div>
  );
};
