import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Copy, ExternalLink, Plus, Sparkles, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

interface UploadSuccessProps {
  videoId: string;
  onViewVideo: () => void;
  onUploadAnother: () => void;
  onClose: () => void;
}

export function UploadSuccess({ videoId, onViewVideo, onUploadAnother, onClose }: UploadSuccessProps) {
  const [copied, setCopied] = useState(false);
  const videoUrl = `${window.location.origin}/watch/${videoId}`;
  const shortUrl = `${window.location.origin}/v/${videoId}`;

  useEffect(() => {
    // Celebration confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#00E7FF", "#7A2BFF", "#FF00E5", "#FFD700"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-8 space-y-6"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-2 rounded-full border-2 border-dashed border-green-300/50"
        />
      </motion.div>

      {/* Success Message */}
      <div className="space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold"
        >
          Chúc mừng! Video đã được đăng! 🎉
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground max-w-md"
        >
          Cảm ơn bạn đã chia sẻ ánh sáng và lan tỏa năng lượng tích cực đến cộng đồng FUN PLAY!
        </motion.p>
      </div>

      {/* Video Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-md space-y-3"
      >
        <p className="text-sm font-medium">Đường liên kết video</p>
        <div className="flex gap-2">
          <Input value={shortUrl} readOnly className="text-center font-mono text-sm" />
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          Share link này để lan tỏa ánh sáng nhé! 💕
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        <Button onClick={onViewVideo} className="flex-1 gap-2">
          <ExternalLink className="w-4 h-4" />
          Xem video
        </Button>
        <Button variant="outline" onClick={onUploadAnother} className="flex-1 gap-2">
          <Plus className="w-4 h-4" />
          Đăng video khác
        </Button>
      </motion.div>

      {/* Close hint */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onClose}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Nhấn để đóng
      </motion.button>
    </motion.div>
  );
}
