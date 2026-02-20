import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Copy, ExternalLink, Share2, X, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DonationSuccessOverlayProps {
  transaction: {
    id?: string;
    receipt_public_id: string;
    amount: number;
    tx_hash?: string | null;
    explorer_url?: string | null;
  };
  sender: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    wallet?: string | null;
  };
  receiver: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    wallet?: string | null;
  };
  token: {
    symbol: string;
    name: string;
    icon_url?: string | null;
    chain?: string;
  };
  message?: string;
  theme?: string;
  music?: string;
  onClose: () => void;
}

const shortenAddress = (addr: string) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");

const CopyBtn = ({ text, label }: { text: string; label?: string }) => (
  <button
    type="button"
    onClick={() => { navigator.clipboard.writeText(text); toast({ title: label || "Đã copy! 📋" }); }}
    className="p-1 hover:bg-muted rounded transition-colors inline-flex"
  >
    <Copy className="h-3 w-3 text-muted-foreground" />
  </button>
);

const THEME_LABELS: Record<string, { emoji: string; label: string }> = {
  celebration: { emoji: "🎉", label: "Chúc mừng" },
  birthday: { emoji: "🎂", label: "Sinh nhật" },
  gratitude: { emoji: "🙏", label: "Tri ân" },
  love: { emoji: "❤️", label: "Tình yêu" },
  newyear: { emoji: "🎊", label: "Năm mới" },
  family: { emoji: "👨‍👩‍👧‍👦", label: "Gia đình" },
};

const THEME_STYLES: Record<string, { gradient: string; animation: string }> = {
  celebration: { gradient: "from-amber-400/20 via-pink-400/20 to-purple-500/20", animation: "animate-confetti-fall" },
  birthday: { gradient: "from-pink-400/20 via-yellow-300/20 to-cyan-400/20", animation: "animate-confetti-fall" },
  gratitude: { gradient: "from-emerald-400/20 via-teal-400/20 to-green-500/20", animation: "animate-gentle-glow" },
  love: { gradient: "from-red-400/20 via-pink-400/20 to-rose-400/20", animation: "animate-float-hearts" },
  newyear: { gradient: "from-red-500/20 via-amber-400/20 to-yellow-300/20", animation: "animate-fireworks" },
  family: { gradient: "from-blue-400/20 via-indigo-400/20 to-purple-400/20", animation: "animate-warm-rays" },
};

const THEME_BORDERS: Record<string, string> = {
  celebration: "border-amber-400/40",
  birthday: "border-pink-400/40",
  gratitude: "border-emerald-400/40",
  love: "border-red-400/40",
  newyear: "border-red-500/40",
  family: "border-blue-400/40",
};

// Music files mapping
const MUSIC_FILES: Record<string, string> = {
  "rich-celebration": "/audio/rich-celebration.mp3",
  "rich-2": "/audio/rich-2.mp3",
  "rich-3": "/audio/rich-3.mp3",
};

export const DonationSuccessOverlay = ({
  transaction,
  sender,
  receiver,
  token,
  message,
  theme = "celebration",
  music = "rich-celebration",
  onClose,
}: DonationSuccessOverlayProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const themeInfo = THEME_LABELS[theme] || THEME_LABELS.celebration;
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES.celebration;
  const themeBorder = THEME_BORDERS[theme] || THEME_BORDERS.celebration;

  // Play celebration effects on mount
  useEffect(() => {
    // Play selected music file
    const audioSrc = MUSIC_FILES[music] || MUSIC_FILES["rich-celebration"];
    try {
      const audio = new Audio(audioSrc);
      audio.volume = 0.6;
      audio.play().catch(() => {});
      audioRef.current = audio;
    } catch {}

    // Confetti bursts
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6, x: 0.5 }, colors: ["#FFD700", "#FF00E5", "#00E7FF", "#7A2BFF"] });
    setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0.2, y: 0.65 }, colors: ["#FFD700", "#FF00E5", "#00E7FF"] }), 150);
    setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 0.8, y: 0.65 }, colors: ["#FFD700", "#7A2BFF", "#00E7FF"] }), 300);
    setTimeout(() => confetti({ particleCount: 30, spread: 360, startVelocity: 20, ticks: 60, origin: { x: 0.5, y: 0.4 }, shapes: ["star"], colors: ["#FFD700", "#FFA500"] }), 500);

    return () => { audioRef.current?.pause(); };
  }, [music]);

  // Auto-share to profile
  useEffect(() => {
    if (!hasShared) {
      handleShareToProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/receipt/${transaction.receipt_public_id}`);
    toast({ title: "Đã copy link biên nhận! 📋" });
  };

  const handleCopyTx = () => {
    if (transaction.tx_hash) {
      navigator.clipboard.writeText(transaction.tx_hash);
      toast({ title: "Đã copy TX Hash! 📋" });
    }
  };

  const handleShareToProfile = async () => {
    setIsSharing(true);
    try {
      const { data: channel } = await supabase.from("channels").select("id").eq("user_id", sender.id).single();
      if (!channel) throw new Error("Không tìm thấy channel");

      const receiptUrl = `${window.location.origin}/receipt/${transaction.receipt_public_id}`;
      const postContent = `${themeInfo.emoji} ${sender.name} vừa tặng ${transaction.amount} ${token.symbol} cho @${receiver.username}${message ? ` với lời nhắn: "${message}"` : ""} 💖\n\nChủ đề: ${themeInfo.label}\n🎁 Xem biên nhận: ${receiptUrl}\n\n#FUNGift #FUNPlay #LanToaYeuThuong`;

      const { error } = await supabase.from("posts").insert({
        user_id: sender.id,
        channel_id: channel.id,
        content: postContent,
        post_type: "donation",
        is_public: true,
        donation_transaction_id: transaction.id || null,
      });

      if (error) throw error;
      toast({ title: "Đã chia sẻ lên Profile! 🎉", description: "Bài viết đã được đăng tự động" });
      setHasShared(true);
    } catch (error) {
      console.error("Share error:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="space-y-4 py-2"
    >
      {/* Close button */}
      <div className="absolute top-2 right-2">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><X className="h-4 w-4" /></Button>
      </div>

      {/* Celebration header */}
      <div className="text-center relative">
        <motion.div animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Sparkles className="h-6 w-6 text-amber-400" />
        </motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </motion.div>
        <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-lg font-bold mt-3 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
          🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉
        </motion.h3>
      </div>

      {/* Celebration Card — replaces GIF */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`relative overflow-hidden rounded-2xl border-2 ${themeBorder} bg-gradient-to-br ${themeStyle.gradient} p-4`}
      >
        {/* Theme animation overlay */}
        <div className={`absolute inset-0 pointer-events-none ${themeStyle.animation} opacity-30`} />

        {/* Sender → Amount → Receiver */}
        <div className="relative flex items-center justify-between gap-2">
          {/* Sender */}
          <a href={`/c/${sender.username || sender.id}`} className="flex flex-col items-center gap-1 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <Avatar className="h-11 w-11 ring-2 ring-purple-500/30">
              <AvatarImage src={sender.avatar || ""} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">{sender.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-xs font-medium truncate max-w-full">{sender.name}</p>
            <p className="text-[10px] text-muted-foreground">@{sender.username}</p>
            {sender.wallet && (
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">{shortenAddress(sender.wallet)}</span>
                <CopyBtn text={sender.wallet} />
              </div>
            )}
          </a>

          {/* Arrow + Amount */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 px-1">
            <div className="flex items-center gap-1 text-lg font-bold">
              {token.icon_url && <img src={token.icon_url} alt="" className="h-5 w-5" />}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{transaction.amount}</span>
            </div>
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-xl">→</motion.div>
            <span className="text-xs font-medium text-muted-foreground">{token.symbol}</span>
          </div>

          {/* Receiver */}
          <a href={`/c/${receiver.username || receiver.id}`} className="flex flex-col items-center gap-1 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <Avatar className="h-11 w-11 ring-2 ring-amber-500/30">
              <AvatarImage src={receiver.avatar || ""} />
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs">{receiver.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-xs font-medium truncate max-w-full">{receiver.name}</p>
            <p className="text-[10px] text-muted-foreground">@{receiver.username}</p>
            {receiver.wallet && (
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">{shortenAddress(receiver.wallet)}</span>
                <CopyBtn text={receiver.wallet} />
              </div>
            )}
          </a>
        </div>

        {/* Details grid */}
        <div className="relative space-y-1.5 text-xs border-t border-border/50 pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chủ đề</span>
            <span>{themeInfo.emoji} {themeInfo.label}</span>
          </div>
          {message && (
            <div>
              <span className="text-muted-foreground">Lời nhắn</span>
              <p className="italic mt-0.5 p-2 bg-background/50 rounded-lg text-xs">"{message}"</p>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thời gian</span>
            <span>{new Date().toLocaleString("vi-VN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chain</span>
            <span>{token.chain === "internal" ? "Nội bộ" : "BSC"}</span>
          </div>
          {transaction.tx_hash && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">TX Hash</span>
              <div className="flex items-center gap-1">
                <span className="font-mono">{transaction.tx_hash.substring(0, 10)}…</span>
                <button type="button" onClick={handleCopyTx} className="p-0.5 hover:bg-muted rounded"><Copy className="h-3 w-3 text-muted-foreground" /></button>
                <a href={transaction.explorer_url || `https://bscscan.com/tx/${transaction.tx_hash}`} target="_blank" rel="noopener noreferrer"
                  className="p-0.5 hover:bg-muted rounded text-primary"><ExternalLink className="h-3 w-3" /></a>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mã biên nhận</span>
            <span className="font-mono">#{transaction.receipt_public_id}</span>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-1.5" />Sao chép link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareToProfile}
            disabled={isSharing || hasShared}
          >
            {hasShared ? <><CheckCircle2 className="h-4 w-4 mr-1.5" />Đã chia sẻ</> : <><Share2 className="h-4 w-4 mr-1.5" />{isSharing ? "Đang..." : "Chia sẻ Profile"}</>}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DonationSuccessOverlay;
