import { motion } from "framer-motion";
import { Shield, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KYCButtonProps {
  isVerified: boolean;
  onClick: () => void;
}

export const KYCButton = ({ isVerified, onClick }: KYCButtonProps) => {
  if (isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ShieldCheck className="w-5 h-5 text-green-400" />
        </motion.div>
        <span className="text-sm font-bold text-green-400">KYC Verified</span>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={onClick}
        className="relative overflow-hidden rounded-full px-5 py-2 h-auto bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 text-white font-bold shadow-[0_0_20px_rgba(255,165,0,0.4)]"
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <span className="relative z-10 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          KYC Now
          <ChevronRight className="w-4 h-4" />
        </span>
      </Button>
    </motion.div>
  );
};
