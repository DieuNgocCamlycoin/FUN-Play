import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileNudgeBannerProps {
  username: string;
  avatarUrl: string | null;
  avatarVerified: boolean | null;
}

const DISMISS_KEY = "profile_nudge_dismissed_at";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const ProfileNudgeBanner = ({ username, avatarUrl, avatarVerified }: ProfileNudgeBannerProps) => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const hasSystemUsername = username?.startsWith("user_");
  const hasNoAvatar = !avatarUrl;
  const needsNudge = hasSystemUsername || hasNoAvatar;

  useEffect(() => {
    if (!needsNudge) {
      setVisible(false);
      return;
    }

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION_MS) {
        setVisible(false);
        return;
      }
    }

    setVisible(true);
  }, [needsNudge]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mx-4 mb-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 p-3.5 shadow-sm relative"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Đóng"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">
                Hoàn thiện hồ sơ để nhận thưởng CAMLY! 🎁
              </p>
              <p className="text-xs text-muted-foreground mb-2.5">
                {hasSystemUsername && "Chọn username đẹp thay vì mã hệ thống. "}
                {hasNoAvatar && "Thêm ảnh đại diện chân dung thật. "}
                Hồ sơ hoàn thiện giúp bạn nhận thưởng nhanh hơn!
              </p>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs gap-1.5"
                onClick={() => navigate("/settings")}
              >
                <UserCog className="h-3.5 w-3.5" />
                Cập nhật hồ sơ
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
