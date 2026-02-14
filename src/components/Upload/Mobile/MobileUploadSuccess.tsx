import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ExternalLink, Home, Sparkles, Share2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { getShareUrl, copyToClipboard } from "@/lib/shareUtils";
import confetti from "canvas-confetti";

interface MobileUploadSuccessProps {
  videoId: string | null;
  onViewVideo: () => void;
  onClose: () => void;
}

export function MobileUploadSuccess({ videoId, onViewVideo, onClose }: MobileUploadSuccessProps) {
  const { toast } = useToast();
  const { heavyTap, mediumTap } = useHapticFeedback();

  // Trigger confetti on mount
  useEffect(() => {
    heavyTap();

    // Burst of confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#00E7FF", "#7A2BFF", "#FF00E5", "#FFD700"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#00E7FF", "#7A2BFF", "#FF00E5", "#FFD700"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, [heavyTap]);

  const handleCopyLink = async () => {
    if (videoId) {
      const url = getShareUrl(`/watch/${videoId}`);
      mediumTap();
      const success = await copyToClipboard(url);
      toast({
        title: success ? "Đã sao chép!" : "Lỗi",
        description: success ? "Link video đã được sao chép vào clipboard 📋" : "Không thể sao chép link",
        variant: success ? "default" : "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (videoId && navigator.share) {
      mediumTap();
      try {
        await navigator.share({
          title: "Xem video mới của tôi!",
          text: "Xem video mới của tôi trên FUN PLAY! 🎬✨",
          url: getShareUrl(`/watch/${videoId}`),
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-center">
      {/* Success Icon with Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan)/0.3)] via-[hsl(var(--cosmic-magenta)/0.3)] to-[hsl(var(--cosmic-gold)/0.3)] flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        {/* Sparkle decorations */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <Sparkles className="absolute -top-2 right-2 w-6 h-6 text-[hsl(var(--cosmic-gold))]" />
          <Sparkles className="absolute bottom-0 -left-2 w-5 h-5 text-[hsl(var(--cosmic-cyan))]" />
          <Sparkles className="absolute top-1/2 -right-4 w-4 h-4 text-[hsl(var(--cosmic-magenta))]" />
        </motion.div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-2">Tải lên thành công! 🎉</h2>
        <p className="text-muted-foreground mb-8">
          Video của bạn đã sẵn sàng lan tỏa ánh sáng! ✨
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full space-y-3"
      >
        {/* View Video Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewVideo}
          className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 min-h-[56px] bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] shadow-lg"
        >
          <ExternalLink className="w-5 h-5" />
          Xem video
        </motion.button>

        {/* Share Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 min-h-[56px] border-2 border-[hsl(var(--cosmic-magenta)/0.3)] text-[hsl(var(--cosmic-magenta))] hover:bg-[hsl(var(--cosmic-magenta)/0.1)] transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Chia sẻ video
        </motion.button>

        {/* Copy Link Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCopyLink}
          className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[48px] text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Sao chép link
        </motion.button>

        {/* Back to Home */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[48px] text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Về trang chủ
        </motion.button>
      </motion.div>
    </div>
  );
}
