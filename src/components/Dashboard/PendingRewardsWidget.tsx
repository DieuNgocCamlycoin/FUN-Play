import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Gift, ArrowRight, Clock, Wallet } from "lucide-react";
import { usePendingRewards } from "@/hooks/useClaimHistory";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface PendingRewardsWidgetProps {
  userId: string;
  onClaimClick?: () => void;
}

export const PendingRewardsWidget = ({ userId, onClaimClick }: PendingRewardsWidgetProps) => {
  const { data, loading } = usePendingRewards(userId);
  const { profile } = useProfile();
  const [isHovered, setIsHovered] = useState(false);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 h-40" />
      </Card>
    );
  }

  const pendingAmount = data?.pendingRewards || 0;
  const hasWallet = !!profile?.wallet_address;
  const canClaim = pendingAmount >= 100000 && hasWallet;

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#FFD700]/10 via-[#FF9500]/10 to-[#FF6B00]/10 border-2 border-[#FFD700]/30 hover:border-[#FFD700]/50 transition-all duration-300">
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/5 to-transparent"
            />
          )}
        </AnimatePresence>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#FFD700]" />
            Phần thưởng sẵn sàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <motion.div 
                className="text-4xl font-black bg-gradient-to-r from-[#FFD700] to-[#FF9500] bg-clip-text text-transparent"
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {pendingAmount.toLocaleString()}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                CAMLY Tokens
              </p>
            </div>

            <div className="text-right">
              {!hasWallet ? (
                <Badge variant="outline" className="border-amber-500 text-amber-500">
                  <Wallet className="w-3 h-3 mr-1" />
                  Chưa kết nối ví
                </Badge>
              ) : pendingAmount < 100000 ? (
                <Badge variant="outline" className="border-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  Tối thiểu 100,000
                </Badge>
              ) : (
                <Button 
                  onClick={onClaimClick}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FF9500] text-black font-bold hover:opacity-90"
                >
                  Claim Now
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {data?.lastClaimAt && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Lần claim gần nhất: {format(new Date(data.lastClaimAt), "dd/MM/yyyy HH:mm", { locale: vi })}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
