import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, UserCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AvatarVerificationGateProps {
  onClose: () => void;
}

export function AvatarVerificationGate({ onClose }: AvatarVerificationGateProps) {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    onClose();
    navigate("/settings");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6"
    >
      {/* Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-gold)/0.2)] to-[hsl(var(--cosmic-cyan)/0.2)] flex items-center justify-center">
          <UserCircle className="w-10 h-10 text-[hsl(var(--cosmic-gold))]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-background">
          <ShieldAlert className="w-4 h-4 text-destructive" />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2 max-w-sm">
        <h3 className="text-lg font-bold">Xác minh ảnh đại diện 📸</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Để bảo vệ cộng đồng, FUN Play yêu cầu bạn sử dụng ảnh chân dung thật
          làm ảnh đại diện trước khi tải video lên.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Angel AI sẽ xác minh tự động — chỉ cần vài giây! ✨
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={handleGoToSettings}
          className="w-full min-h-[48px] bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white font-semibold"
        >
          Đi đến Cài đặt hồ sơ
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full min-h-[44px] text-muted-foreground"
        >
          Để sau
        </Button>
      </div>
    </motion.div>
  );
}
