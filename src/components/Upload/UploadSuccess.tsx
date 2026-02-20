import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Copy, ExternalLink, Plus, Sparkles, Check, Share2, MessageCircle, Twitter } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PRODUCTION_URL } from "@/lib/shareUtils";
import { getVideoPath } from "@/lib/videoNavigation";

interface UploadSuccessProps {
  videoId: string;
  onViewVideo: () => void;
  onUploadAnother: () => void;
  onClose: () => void;
}

export function UploadSuccess({ videoId, onViewVideo, onUploadAnother, onClose }: UploadSuccessProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(`${PRODUCTION_URL}/watch/${videoId}`);

  useEffect(() => {
    getVideoPath(videoId).then(path => {
      setShareUrl(`${PRODUCTION_URL}${path}`);
    });
  }, [videoId]);

  useEffect(() => {
    // Celebration confetti with aurora colors
    const duration = 4000;
    const end = Date.now() + duration;

    const colors = ["#00E7FF", "#7A2BFF", "#FF00E5", "#FFD700", "#FFFFFF"];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Extra burst in the middle
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors,
      });
    }, 500);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const shareToX = () => {
    const text = `Xem video mới của tôi trên FUN PLAY! ✨ ${shareUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = `Xem video mới của tôi! ✨`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-6 sm:py-8 space-y-6"
    >
      {/* Success Icon with rainbow sparkle effect */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative"
      >
        {/* Rainbow glow */}
        <div className="absolute inset-0 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-50 blur-xl animate-pulse" />
        
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
          <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
        </div>
        
        {/* Orbiting sparkles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 rounded-full border-2 border-dashed border-[hsl(var(--cosmic-cyan)/0.5)]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-6 rounded-full border border-dashed border-[hsl(var(--cosmic-magenta)/0.3)]"
        />
      </motion.div>

      {/* Success Message */}
      <div className="space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl font-bold"
        >
          <span className="bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] bg-clip-text text-transparent">
            Chúc mừng! Video đã được đăng! 🎉
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground max-w-md text-sm sm:text-base"
        >
          Cảm ơn bạn đã chia sẻ ánh sáng và lan tỏa năng lượng tích cực đến cộng đồng FUN PLAY! ✨
        </motion.p>
      </div>

      {/* Video Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-md space-y-3"
      >
        <p className="text-sm font-semibold">Đường liên kết video</p>
        <div className="flex gap-2">
          <Input 
            value={shareUrl} 
            readOnly
            className="text-center font-mono text-sm bg-muted/50 border-[hsl(var(--cosmic-cyan)/0.3)]" 
          />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleCopy}
            className={cn(
              "min-w-[48px] transition-all",
              copied && "bg-green-500/20 border-green-500 text-green-500"
            )}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </motion.div>

      {/* Share Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="space-y-3"
      >
        <p className="text-sm font-semibold flex items-center justify-center gap-2">
          <Share2 className="w-4 h-4" />
          Chia sẻ đến bạn bè
        </p>
        <div className="flex gap-3 justify-center">
          {/* X (Twitter) */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareToX}
            className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <Twitter className="w-5 h-5" />
          </motion.button>
          
          {/* Facebook */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareToFacebook}
            className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </motion.button>
          
          {/* Telegram */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareToTelegram}
            className="w-12 h-12 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Light economy message */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-muted-foreground flex items-center justify-center gap-1"
      >
        <Sparkles className="w-3 h-3 text-[hsl(var(--cosmic-gold))]" />
        Chia sẻ link này để lan tỏa ánh sáng nhé!
        <Sparkles className="w-3 h-3 text-[hsl(var(--cosmic-gold))]" />
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        <Button 
          onClick={onViewVideo} 
          className="flex-1 gap-2 min-h-[52px] bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] hover:from-[hsl(var(--cosmic-cyan)/0.9)] hover:to-[hsl(var(--cosmic-magenta)/0.9)] text-white shadow-lg"
        >
          <ExternalLink className="w-4 h-4" />
          Xem video
        </Button>
        <Button 
          variant="outline" 
          onClick={onUploadAnother} 
          className="flex-1 gap-2 min-h-[52px] border-[hsl(var(--cosmic-cyan)/0.3)] hover:border-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan)/0.1)]"
        >
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
