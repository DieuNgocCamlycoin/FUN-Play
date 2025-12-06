import { motion } from "framer-motion";
import { Video, Share2, Wallet, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ProfileActionButtonsShinyProps {
  onClaimClick?: () => void;
  username?: string;
}

export const ProfileActionButtonsShiny = ({ onClaimClick, username }: ProfileActionButtonsShinyProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShareReferral = () => {
    const referralLink = `${window.location.origin}/referral?ref=${username || 'user'}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const buttons = [
    {
      label: "Upload Video",
      icon: Video,
      gradient: "from-violet-500 via-purple-500 to-indigo-500",
      shadowColor: "rgba(139,92,246,0.5)",
      onClick: () => navigate("/upload"),
    },
    {
      label: "Share Referral",
      icon: Share2,
      gradient: "from-cyan-500 via-teal-500 to-emerald-500",
      shadowColor: "rgba(6,182,212,0.5)",
      onClick: handleShareReferral,
    },
    {
      label: "Claim Rewards",
      icon: Wallet,
      gradient: "from-yellow-400 via-amber-500 to-orange-500",
      shadowColor: "rgba(251,191,36,0.6)",
      onClick: onClaimClick,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {buttons.map((button, index) => {
        const Icon = button.icon;
        return (
          <motion.button
            key={button.label}
            onClick={button.onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4, type: "spring" }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            className="relative group"
          >
            {/* Rainbow breathing outer glow */}
            <motion.div
              className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-300"
              style={{
                background: `linear-gradient(90deg, 
                  #ff0080, #ff8c00, #ffd700, #00ff00, #00e7ff, #7a2bff, #ff00e5, #ff0080
                )`,
                backgroundSize: '400% 100%',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Button glow */}
            <div 
              className="absolute -inset-1 rounded-2xl opacity-60 blur-lg group-hover:opacity-80 transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${button.gradient.split(' ')[0].replace('from-', '')} 0%, ${button.gradient.split(' ')[2].replace('to-', '')} 100%)`.replace(/-/g, ''),
                boxShadow: `0 0 40px ${button.shadowColor}`,
              }}
            />

            {/* Button body */}
            <div 
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${button.gradient} p-5 flex flex-col items-center gap-3`}
              style={{
                boxShadow: `
                  0 10px 40px ${button.shadowColor},
                  inset 0 2px 10px rgba(255,255,255,0.3),
                  inset 0 -2px 10px rgba(0,0,0,0.2)
                `,
              }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none" />
              
              {/* Moving shine */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
              >
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]" />
              </motion.div>

              {/* Icon with glow */}
              <motion.div
                className="relative"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
              >
                <Icon className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                
                {/* Orbiting sparkle */}
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: 360, scale: [0.8, 1.2, 0.8] }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1.5, repeat: Infinity }
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white/80" />
                </motion.div>
              </motion.div>

              {/* Label */}
              <span 
                className="text-lg font-bold text-white tracking-wide"
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {button.label}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
