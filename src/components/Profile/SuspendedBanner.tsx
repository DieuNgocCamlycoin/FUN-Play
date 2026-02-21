import { ShieldBan } from "lucide-react";
import { motion } from "framer-motion";

interface SuspendedBannerProps {
  banned?: boolean | null;
}

export const SuspendedBanner = ({ banned }: SuspendedBannerProps) => {
  if (!banned) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto px-4 lg:px-6 mt-4"
    >
      <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 backdrop-blur-sm">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
          <ShieldBan className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-destructive text-sm">
            Kênh này đã bị đình chỉ
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nội dung được bảo lưu để minh bạch. Kênh không còn hoạt động.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
