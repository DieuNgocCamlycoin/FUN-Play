import { motion } from "framer-motion";
import { Upload, Share2, Wallet, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ProfileActionButtonsProps {
  isKYCVerified: boolean;
  onKYCClick: () => void;
  referralCode: string;
}

export const ProfileActionButtons = ({ 
  isKYCVerified, 
  onKYCClick,
  referralCode,
}: ProfileActionButtonsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const shareReferral = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Referral Link Copied! 🎉",
      description: "Share this link to earn 100,000 CAMLY + 5% lifetime earnings!",
    });
  };

  const buttons = [
    {
      label: "Upload Video",
      icon: Upload,
      onClick: () => navigate('/upload'),
      gradient: "from-violet-500 to-purple-600",
      glow: "#8b5cf6",
    },
    {
      label: "Share Referral",
      icon: Share2,
      onClick: shareReferral,
      gradient: "from-pink-500 to-rose-600",
      glow: "#ec4899",
    },
    {
      label: "Claim Rewards",
      icon: Wallet,
      onClick: () => document.getElementById('reward-zone')?.scrollIntoView({ behavior: 'smooth' }),
      gradient: "from-yellow-400 to-amber-500",
      glow: "#fbbf24",
    },
  ];

  return (
    <div className="space-y-4">
      {/* KYC Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onKYCClick}
          className={`w-full h-12 font-bold relative overflow-hidden ${
            isKYCVerified 
              ? 'bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/30' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
          }`}
          variant={isKYCVerified ? "outline" : "default"}
        >
          {!isKYCVerified && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {isKYCVerified ? (
              <>
                <CheckCircle className="w-5 h-5" />
                KYC Verified
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                KYC Now to Claim Rewards
              </>
            )}
          </span>
        </Button>
      </motion.div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {buttons.map((button, index) => (
          <motion.div
            key={button.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={button.onClick}
              className={`w-full h-auto py-4 flex-col gap-2 bg-gradient-to-br ${button.gradient} text-white border-0 relative overflow-hidden`}
              style={{
                boxShadow: `0 4px 20px ${button.glow}40`,
              }}
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
              />
              <button.icon className="w-6 h-6 relative z-10" />
              <span className="text-xs font-bold relative z-10">{button.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
