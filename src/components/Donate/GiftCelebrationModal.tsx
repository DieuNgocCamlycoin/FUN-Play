import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, Copy, ExternalLink, Share2, X, Sparkles, Wallet, Download, MessageCircle, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ======================== TYPES ========================
interface GiftCelebrationModalProps {
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
  onClose: () => void;
}

// ======================== CONSTANTS ========================
const DONATION_THEMES = [
  { id: "celebration", emoji: "🎉", label: "Chúc mừng" },
  { id: "gratitude", emoji: "🙏", label: "Tri ân" },
  { id: "birthday", emoji: "🎂", label: "Sinh nhật" },
  { id: "love", emoji: "❤️", label: "Tình yêu" },
  { id: "newyear", emoji: "🎊", label: "Năm mới" },
  { id: "family", emoji: "👨‍👩‍👧‍👦", label: "Gia đình" },
];

const THEME_BACKGROUNDS: Record<string, string[]> = {
  celebration: ["/images/celebration-bg/celebration-1.png", "/images/celebration-bg/celebration-2.png", "/images/celebration-bg/celebration-3.png"],
  gratitude: ["/images/celebration-bg/gratitude-1.png", "/images/celebration-bg/gratitude-2.png", "/images/celebration-bg/gratitude-3.png"],
  birthday: ["/images/celebration-bg/birthday-1.png", "/images/celebration-bg/birthday-2.png", "/images/celebration-bg/birthday-3.png"],
  love: ["/images/celebration-bg/love-1.png", "/images/celebration-bg/love-2.png", "/images/celebration-bg/love-3.png"],
  newyear: ["/images/celebration-bg/newyear-1.png", "/images/celebration-bg/newyear-2.png", "/images/celebration-bg/newyear-3.png"],
  family: ["/images/celebration-bg/family-1.png", "/images/celebration-bg/family-2.png", "/images/celebration-bg/family-3.png"],
};

const MUSIC_OPTIONS = [
  { id: "rich-celebration", label: "Rich! Rich! Rich!", description: "Mặc định", src: "/audio/rich-celebration.mp3" },
  { id: "rich-2", label: "Rich Vibe", description: "Năng lượng tích cực", src: "/audio/rich-2.mp3" },
  { id: "rich-3", label: "Rich Energy", description: "Giàu có & yêu thương", src: "/audio/rich-3.mp3" },
];

const shortenAddress = (addr: string) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");

const CopyBtn = ({ text, label }: { text: string; label?: string }) => (
  <button
    type="button"
    onClick={() => { navigator.clipboard.writeText(text); toast({ title: label || "Đã copy! 📋" }); }}
    className="p-1 hover:bg-black/20 rounded transition-colors inline-flex"
  >
    <Copy className="h-3 w-3 text-white/70" />
  </button>
);

// ======================== COIN SHOWER EFFECT ========================
const CoinShowerEffect = () => {
  const coins = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    src: i % 2 === 0 ? "/images/camly-coin.png" : "/images/fun-money-coin.png",
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    size: 16 + Math.random() * 20,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {coins.map((coin) => (
        <img
          key={coin.id}
          src={coin.src}
          alt=""
          className="absolute animate-coin-fall"
          style={{
            left: `${coin.left}%`,
            top: "-30px",
            width: `${coin.size}px`,
            height: `${coin.size}px`,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${coin.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

// ======================== MAIN COMPONENT ========================
export const GiftCelebrationModal = ({
  transaction, sender, receiver, token, message, onClose,
}: GiftCelebrationModalProps) => {
  const [selectedTheme, setSelectedTheme] = useState("celebration");
  const [selectedBg, setSelectedBg] = useState(THEME_BACKGROUNDS.celebration[0]);
  const [selectedMusic, setSelectedMusic] = useState("rich-celebration");
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentTheme = DONATION_THEMES.find(t => t.id === selectedTheme) || DONATION_THEMES[0];
  const backgrounds = THEME_BACKGROUNDS[selectedTheme] || THEME_BACKGROUNDS.celebration;

  // Play celebration on mount
  useEffect(() => {
    const audioSrc = MUSIC_OPTIONS.find(m => m.id === selectedMusic)?.src || MUSIC_OPTIONS[0].src;
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
  }, []);

  // Auto-share to profile on mount
  useEffect(() => {
    if (!hasShared) handleShareToProfile();
  }, []);

  // Auto-send message on mount
  useEffect(() => {
    if (!hasSentMessage) handleSendMessage();
  }, []);

  // Update music when selection changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      const newSrc = MUSIC_OPTIONS.find(m => m.id === selectedMusic)?.src || MUSIC_OPTIONS[0].src;
      const audio = new Audio(newSrc);
      audio.volume = 0.6;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  }, [selectedMusic]);

  // When theme changes, pick first background
  useEffect(() => {
    const bgs = THEME_BACKGROUNDS[selectedTheme] || THEME_BACKGROUNDS.celebration;
    setSelectedBg(bgs[0]);
  }, [selectedTheme]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      previewAudioRef.current?.pause();
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, []);

  const stopPreview = useCallback(() => {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    setPlayingMusicId(null);
  }, []);

  const togglePreview = useCallback((musicId: string) => {
    if (playingMusicId === musicId) { stopPreview(); return; }
    stopPreview();
    const option = MUSIC_OPTIONS.find(m => m.id === musicId);
    if (!option) return;
    const audio = new Audio(option.src);
    audio.volume = 0.5;
    audio.play().catch(() => {});
    previewAudioRef.current = audio;
    setPlayingMusicId(musicId);
    previewTimeoutRef.current = setTimeout(stopPreview, 5000);
    audio.onended = stopPreview;
  }, [playingMusicId, stopPreview]);

  // ======================== ACTIONS ========================
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

  const handleSaveImage = async () => {
    if (!cardRef.current || isSavingImage) return;
    setIsSavingImage(true);
    try {
      const canvas = await html2canvas(cardRef.current, { useCORS: true, backgroundColor: null, scale: 2 });
      const link = document.createElement("a");
      link.download = `celebration-card-${transaction.receipt_public_id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Đã lưu hình ảnh! 📥" });
    } catch {
      toast({ title: "Không thể lưu ảnh", variant: "destructive" });
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleShareToProfile = async () => {
    setIsSharing(true);
    try {
      const { data: channel } = await supabase.from("channels").select("id").eq("user_id", sender.id).single();
      if (!channel) throw new Error("Không tìm thấy channel");
      const receiptUrl = `${window.location.origin}/receipt/${transaction.receipt_public_id}`;
      const postContent = `${currentTheme.emoji} ${sender.name} vừa tặng ${transaction.amount} ${token.symbol} cho @${receiver.username}${message ? ` với lời nhắn: "${message}"` : ""} 💖\n\nChủ đề: ${currentTheme.label}\n🎁 Xem biên nhận: ${receiptUrl}\n\n#FUNGift #FUNPlay #LanToaYeuThuong`;
      const { error } = await supabase.from("posts").insert({
        user_id: sender.id, channel_id: channel.id, content: postContent,
        post_type: "donation", is_public: true, donation_transaction_id: transaction.id || null,
      });
      if (error) throw error;
      toast({ title: "Đã chia sẻ lên Profile! 🎉" });
      setHasShared(true);
    } catch (err) {
      console.error("Share error:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      // Find or create chat
      const { data: existingChat } = await supabase
        .from("user_chats")
        .select("id")
        .or(`and(user1_id.eq.${sender.id},user2_id.eq.${receiver.id}),and(user1_id.eq.${receiver.id},user2_id.eq.${sender.id})`)
        .single();

      let chatId = existingChat?.id;
      if (!chatId) {
        const { data: newChat } = await supabase
          .from("user_chats")
          .insert({ user1_id: sender.id, user2_id: receiver.id })
          .select("id")
          .single();
        chatId = newChat?.id;
      }
      if (!chatId) return;

      const msgContent = `🎁 ${sender.name} đã tặng bạn ${transaction.amount} ${token.symbol}!${message ? ` Lời nhắn: "${message}"` : ""} 💖`;
      await supabase.from("chat_messages").insert({
        chat_id: chatId,
        sender_id: sender.id,
        message_type: "donation",
        content: msgContent,
        donation_transaction_id: transaction.id || null,
        deep_link: `/receipt/${transaction.receipt_public_id}`,
      });
      setHasSentMessage(true);
    } catch (err) {
      console.error("Auto message error:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="space-y-4 py-2 relative"
    >
      {/* Coin Shower */}
      <CoinShowerEffect />

      {/* Close button */}
      <div className="absolute top-2 right-2 z-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><X className="h-4 w-4" /></Button>
      </div>

      {/* Header */}
      <div className="text-center relative z-10">
        <motion.div animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Sparkles className="h-6 w-6 text-amber-400" />
        </motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
          <CheckCircle2 className="h-9 w-9 text-white" />
        </motion.div>
        <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-base font-bold mt-2 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
          🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉
        </motion.h3>
      </div>

      {/* ======================== CELEBRATION CARD ======================== */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden rounded-2xl z-10"
        style={{
          backgroundImage: `url(${selectedBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        <div className="relative p-4 text-white">
          {/* Sender → Amount → Receiver */}
          <div className="flex items-center justify-between gap-2">
            <a href={`/user/${sender.id}`} className="flex flex-col items-center gap-1 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <Avatar className="h-11 w-11 ring-2 ring-white/30">
                <AvatarImage src={sender.avatar || ""} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">{sender.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-xs font-medium truncate max-w-full">{sender.name}</p>
              <p className="text-[10px] text-white/70">@{sender.username}</p>
              {sender.wallet && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] font-mono text-white/60">{shortenAddress(sender.wallet)}</span>
                  <CopyBtn text={sender.wallet} />
                </div>
              )}
            </a>

            <div className="flex flex-col items-center gap-1 flex-shrink-0 px-1">
              <div className="flex items-center gap-1 text-lg font-bold">
                {token.icon_url && <img src={token.icon_url} alt="" className="h-5 w-5" />}
                <span className="text-amber-300 drop-shadow-lg">{transaction.amount}</span>
              </div>
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-xl">→</motion.div>
              <span className="text-xs font-medium text-white/80">{token.symbol}</span>
            </div>

            <a href={`/user/${receiver.id}`} className="flex flex-col items-center gap-1 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <Avatar className="h-11 w-11 ring-2 ring-amber-400/30">
                <AvatarImage src={receiver.avatar || ""} />
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs">{receiver.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-xs font-medium truncate max-w-full">{receiver.name}</p>
              <p className="text-[10px] text-white/70">@{receiver.username}</p>
              {receiver.wallet && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] font-mono text-white/60">{shortenAddress(receiver.wallet)}</span>
                  <CopyBtn text={receiver.wallet} />
                </div>
              )}
            </a>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-xs border-t border-white/20 pt-3 mt-3">
            <div className="flex justify-between">
              <span className="text-white/60">Chủ đề</span>
              <span>{currentTheme.emoji} {currentTheme.label}</span>
            </div>
            {message && (
              <div>
                <span className="text-white/60">Lời nhắn</span>
                <p className="italic mt-0.5 p-2 bg-white/10 rounded-lg text-xs">"{message}"</p>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/60">Thời gian</span>
              <span>{new Date().toLocaleString("vi-VN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Chain</span>
              <span>{token.chain === "internal" ? "Nội bộ" : "BSC"}</span>
            </div>
            {transaction.tx_hash && (
              <div className="flex justify-between items-center">
                <span className="text-white/60">TX Hash</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{transaction.tx_hash.substring(0, 10)}…</span>
                  <button type="button" onClick={handleCopyTx} className="p-0.5 hover:bg-white/20 rounded"><Copy className="h-3 w-3 text-white/70" /></button>
                  <a href={transaction.explorer_url || `https://bscscan.com/tx/${transaction.tx_hash}`} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:bg-white/20 rounded">
                    <ExternalLink className="h-3 w-3 text-white/70" />
                  </a>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/60">Mã biên nhận</span>
              <span className="font-mono">#{transaction.receipt_public_id}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ======================== THEME SELECTION ======================== */}
      <div className="space-y-2 relative z-10">
        <label className="text-sm font-medium">Chủ đề ✨</label>
        <div className="grid grid-cols-3 gap-2">
          {DONATION_THEMES.map((theme) => (
            <button key={theme.id} type="button" onClick={() => setSelectedTheme(theme.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                selectedTheme === theme.id
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}>
              <span className="text-xl">{theme.emoji}</span>
              <span className="text-[10px] leading-tight text-center">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ======================== BACKGROUND SELECTION ======================== */}
      <div className="space-y-2 relative z-10">
        <label className="text-sm font-medium">Chọn ảnh nền 🖼️</label>
        <div className="grid grid-cols-3 gap-2">
          {backgrounds.map((bg, i) => (
            <button key={bg} type="button" onClick={() => setSelectedBg(bg)}
              className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                selectedBg === bg ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              }`}>
              <img src={bg} alt={`Nền ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* ======================== MUSIC SELECTION ======================== */}
      <div className="space-y-2 relative z-10">
        <label className="text-sm font-medium">Chọn nhạc 🎵</label>
        <div className="space-y-1.5">
          {MUSIC_OPTIONS.map((opt) => (
            <div key={opt.id} onClick={() => setSelectedMusic(opt.id)}
              className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                selectedMusic === opt.id ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}>
              <button type="button" onClick={(e) => { e.stopPropagation(); togglePreview(opt.id); }}
                className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  playingMusicId === opt.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted-foreground/20"
                }`}>
                {playingMusicId === opt.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              {selectedMusic === opt.id && <span className="text-xs text-primary font-medium">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ======================== ACTION BUTTONS ======================== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-2 relative z-10">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveImage} disabled={isSavingImage}>
            <Download className="h-4 w-4 mr-1.5" />{isSavingImage ? "Đang lưu..." : "Lưu hình ảnh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-1.5" />Chia sẻ link
          </Button>
          {transaction.tx_hash && (
            <Button variant="outline" size="sm" onClick={handleCopyTx}>
              <Copy className="h-4 w-4 mr-1.5" />Copy TX Hash
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleShareToProfile} disabled={isSharing || hasShared}>
            {hasShared ? <><CheckCircle2 className="h-4 w-4 mr-1.5" />Đã đăng</> : <><Share2 className="h-4 w-4 mr-1.5" />{isSharing ? "Đang..." : "Đăng Profile"}</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendMessage} disabled={hasSentMessage}>
            {hasSentMessage ? <><CheckCircle2 className="h-4 w-4 mr-1.5" />Đã gửi</> : <><MessageCircle className="h-4 w-4 mr-1.5" />Gửi tin nhắn</>}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1.5" />Đóng
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GiftCelebrationModal;
