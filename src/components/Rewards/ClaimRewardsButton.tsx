import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClaimRewardsModal } from "./ClaimRewardsModal";

interface ClaimRewardsButtonProps {
  compact?: boolean;
}

export const ClaimRewardsButton = ({ compact = false }: ClaimRewardsButtonProps) => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnclaimedCount();
    }
  }, [user]);

  const fetchUnclaimedCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("reward_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("claimed", false)
        .eq("status", "success");

      if (!error && data) {
        setUnclaimedCount(data.length);
        setTotalUnclaimed(data.reduce((sum, r) => sum + Number(r.amount), 0));
      }
    } catch (error) {
      console.error("Error fetching unclaimed count:", error);
    }
  };

  if (!user || totalUnclaimed <= 0) {
    return null;
  }

  // Compact version for mobile header
  if (compact) {
    return (
      <>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <Button
            onClick={() => setModalOpen(true)}
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Coins className="h-4 w-4" />
            </motion.div>
          </Button>

          {/* Badge count */}
          <AnimatePresence>
            {unclaimedCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
              >
                {unclaimedCount > 9 ? "9+" : unclaimedCount}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <ClaimRewardsModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  // Full version
  return (
    <>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <Button
          onClick={() => setModalOpen(true)}
          className="relative bg-gradient-to-r from-yellow-500 to-cyan-500 hover:from-yellow-600 hover:to-cyan-600 text-white font-bold shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="mr-2"
          >
            <Coins className="h-5 w-5" />
          </motion.div>
          Claim Rewards
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-md"
            animate={{
              boxShadow: [
                "0 0 10px rgba(255, 215, 0, 0.5)",
                "0 0 20px rgba(64, 224, 208, 0.5)",
                "0 0 10px rgba(255, 215, 0, 0.5)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </Button>

        {/* Badge count */}
        <AnimatePresence>
          {unclaimedCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
            >
              {unclaimedCount > 99 ? "99+" : unclaimedCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle decoration */}
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-4 w-4 text-yellow-400" />
        </motion.div>
      </motion.div>

      <ClaimRewardsModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};