import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ArrowRight, Shield, Check, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";

interface RewardZoneProps {
  totalRewards: number;
  claimableBalance: number;
  isKYCVerified: boolean;
  walletAddress: string | null;
  onClaimSuccess?: () => void;
}

export const RewardZone = ({
  totalRewards,
  claimableBalance,
  isKYCVerified,
  walletAddress,
  onClaimSuccess,
}: RewardZoneProps) => {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStep, setClaimStep] = useState(1);
  const [inputWallet, setInputWallet] = useState(walletAddress || "");
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();

  const handleClaim = async () => {
    if (claimStep === 1) {
      if (!inputWallet || !inputWallet.startsWith('0x') || inputWallet.length !== 42) {
        toast({ title: "Invalid wallet", description: "Please enter a valid BSC wallet address", variant: "destructive" });
        return;
      }
      setClaimStep(2);
      return;
    }

    setClaiming(true);
    try {
      // Simulate claim process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Claim Successful! 🎉",
        description: `${claimableBalance.toLocaleString()} CAMLY sent to ${inputWallet.slice(0, 6)}...${inputWallet.slice(-4)}`,
      });
      
      setShowClaimModal(false);
      setClaimStep(1);
      onClaimSuccess?.();
    } catch (error: any) {
      toast({ title: "Claim Failed", description: error.message, variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  const copyWallet = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({ title: "Copied!", description: "Wallet address copied to clipboard" });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-2xl p-[2px]"
          style={{
            background: 'linear-gradient(90deg, #00e7ff, #7a2bff, #ff00e5, #ffd700, #00e7ff)',
            backgroundSize: '300% 100%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-black via-[hsl(var(--cosmic-purple))] to-black" />
        </motion.div>

        <div className="relative z-10 p-6">
          {/* Total Rewards */}
          <div className="text-center mb-6">
            <div className="text-sm text-muted-foreground mb-2">Total Rewards Earned</div>
            <motion.div
              className="text-5xl font-black"
              style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #fff 50%, #ffd700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              animate={{
                textShadow: [
                  '0 0 20px rgba(255,215,0,0.5)',
                  '0 0 40px rgba(255,215,0,0.8)',
                  '0 0 20px rgba(255,215,0,0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CounterAnimation value={totalRewards} duration={2000} />
            </motion.div>
            <div className="text-lg text-[hsl(var(--cosmic-gold))] font-bold">CAMLY</div>
          </div>

          {/* Claimable Balance */}
          {isKYCVerified ? (
            <div className="text-center mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="text-sm text-green-400 mb-1">Claimable Balance</div>
              <div className="text-3xl font-bold text-green-400">
                <CounterAnimation value={claimableBalance} duration={1500} /> CAMLY
              </div>
            </div>
          ) : (
            <div className="text-center mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Complete KYC to claim rewards</span>
              </div>
            </div>
          )}

          {/* Wallet Address Display */}
          {walletAddress && (
            <div className="mb-6 p-3 rounded-lg bg-black/30 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[hsl(var(--cosmic-cyan))]" />
                  <span className="text-sm font-mono text-muted-foreground">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyWallet}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => window.open(`https://bscscan.com/address/${walletAddress}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Claim Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setShowClaimModal(true)}
              disabled={!isKYCVerified || claimableBalance <= 0}
              className="w-full h-14 text-xl font-bold relative overflow-hidden disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ff9500, #ffd700)',
                color: '#000',
              }}
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                CLAIM REWARDS
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Claim Modal */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="bg-gradient-to-br from-black via-[hsl(var(--cosmic-purple))] to-black border-2 border-[hsl(var(--cosmic-gold)/0.5)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[hsl(var(--cosmic-gold))]">
              {claimStep === 1 ? 'Enter Withdrawal Wallet' : 'Confirm Withdrawal'}
            </DialogTitle>
            <DialogDescription>
              {claimStep === 1 
                ? 'Enter your BSC wallet address to receive CAMLY tokens'
                : 'Please confirm your withdrawal details'
              }
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {claimStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 py-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[hsl(var(--cosmic-cyan))]">Wallet Address</label>
                  <Input
                    placeholder="0x..."
                    value={inputWallet}
                    onChange={(e) => setInputWallet(e.target.value)}
                    className="bg-black/50 border-[hsl(var(--cosmic-cyan)/0.5)] font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports: BSC, Polygon, Ethereum
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 py-4"
              >
                <div className="p-4 rounded-lg bg-[hsl(var(--cosmic-gold)/0.1)] border border-[hsl(var(--cosmic-gold)/0.3)]">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-[hsl(var(--cosmic-gold))]">
                      {claimableBalance.toLocaleString()} CAMLY
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-mono text-sm">
                      {inputWallet.slice(0, 10)}...{inputWallet.slice(-6)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span className="text-sm text-amber-400">
                    Tokens will be sent within 24 hours
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            {claimStep === 2 && (
              <Button variant="outline" onClick={() => setClaimStep(1)} className="flex-1">
                Back
              </Button>
            )}
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="flex-1 bg-gradient-to-r from-[hsl(var(--cosmic-gold))] to-[hsl(var(--cosmic-cyan))] text-black font-bold"
            >
              {claiming ? 'Processing...' : claimStep === 1 ? 'Continue' : 'Confirm Withdrawal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
