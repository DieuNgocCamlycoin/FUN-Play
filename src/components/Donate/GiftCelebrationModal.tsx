import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, Copy, ExternalLink, X, Sparkles, Wallet, Download, MessageCircle, Play, Pause, Send, Upload, Volume2, VolumeX } from "lucide-react";
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
];

const shortenAddress = (addr: string) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");

const CopyBtn = ({ text, label }: { text: string; label?: string }) => (
  <button
    type="button"
    onClick={() => { navigator.clipboard.writeText(text); toast({ title: label || "Đã copy! 📋" }); }}
    className="p-1 hover:bg-black/20 rounded transition-colors inline-flex"
  >
    <Copy className="h-3.5 w-3.5 text-white/70" />
  </button>
);

// Convert all <img> inside a container to base64 data URLs for html2canvas
const preloadImagesToBase64 = async (container: HTMLElement) => {
  const imgs = container.querySelectorAll("img");
  const originals: { img: HTMLImageElement; src: string }[] = [];
  await Promise.all(
    Array.from(imgs).map(async (img) => {
      if (!img.src || img.src.startsWith("data:")) return;
      originals.push({ img, src: img.src });
      try {
        const res = await fetch(img.src, { mode: "cors" });
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch {
        // keep original src if fetch fails
      }
    })
  );
  return originals;
};

// ======================== FULLSCREEN COIN SHOWER (15s) — 160 coins ========================
const FullscreenCoinShower = () => {
  // 80 coins falling from top
  const fallingCoins = Array.from({ length: 80 }, (_, i) => ({
    id: `fall-${i}`,
    src: i % 2 === 0 ? "/images/camly-coin.png" : "/images/fun-money-coin.png",
    left: Math.random() * 100,
    delay: Math.random() * 12,
    duration: 3 + Math.random() * 4,
    size: 18 + Math.random() * 26,
  }));
  // 80 coins rising from bottom
  const risingCoins = Array.from({ length: 80 }, (_, i) => ({
    id: `rise-${i}`,
    src: i % 2 === 0 ? "/images/fun-money-coin.png" : "/images/camly-coin.png",
    left: Math.random() * 100,
    delay: Math.random() * 12,
    duration: 3 + Math.random() * 4,
    size: 18 + Math.random() * 26,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {fallingCoins.map((coin) => (
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
      {risingCoins.map((coin) => (
        <img
          key={coin.id}
          src={coin.src}
          alt=""
          className="absolute animate-coin-rise"
          style={{
            left: `${coin.left}%`,
            bottom: "-30px",
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

// ======================== CARD INTERNAL EFFECTS (loop forever) — 72 coins + 40 sparkles ========================
const CardInternalEffects = () => {
  // 36 coins floating up
  const coinsUp = Array.from({ length: 36 }, (_, i) => ({
    id: `up-${i}`,
    src: i % 2 === 0 ? "/images/camly-coin.png" : "/images/fun-money-coin.png",
    left: 2 + Math.random() * 96,
    delay: Math.random() * 8,
    duration: 2.5 + Math.random() * 3,
    size: 10 + Math.random() * 14,
  }));
  // 36 coins floating down
  const coinsDown = Array.from({ length: 36 }, (_, i) => ({
    id: `down-${i}`,
    src: i % 2 === 0 ? "/images/fun-money-coin.png" : "/images/camly-coin.png",
    left: 2 + Math.random() * 96,
    delay: Math.random() * 8,
    duration: 2.5 + Math.random() * 3,
    size: 10 + Math.random() * 14,
  }));

  const sparkles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: 5 + Math.random() * 90,
    top: 5 + Math.random() * 90,
    delay: Math.random() * 6,
    duration: 1.5 + Math.random() * 2.5,
    size: 3 + Math.random() * 6,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      {coinsUp.map((coin) => (
        <img
          key={`coin-${coin.id}`}
          src={coin.src}
          alt=""
          className="absolute animate-coin-float-up"
          style={{
            left: `${coin.left}%`,
            bottom: "-20px",
            width: `${coin.size}px`,
            height: `${coin.size}px`,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${coin.duration}s`,
          }}
        />
      ))}
      {coinsDown.map((coin) => (
        <img
          key={`coin-${coin.id}`}
          src={coin.src}
          alt=""
          className="absolute animate-coin-float-down"
          style={{
            left: `${coin.left}%`,
            top: "-20px",
            width: `${coin.size}px`,
            height: `${coin.size}px`,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${coin.duration}s`,
          }}
        />
      ))}
      {sparkles.map((s) => (
        <div
          key={`sparkle-${s.id}`}
          className="absolute animate-sparkle-float rounded-full bg-amber-300"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow: "0 0 6px 2px rgba(255, 215, 0, 0.6)",
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
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [selectedMusic, setSelectedMusic] = useState("rich-celebration");
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [showEffects, setShowEffects] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTheme = DONATION_THEMES.find(t => t.id === selectedTheme) || DONATION_THEMES[0];
  const backgrounds = THEME_BACKGROUNDS[selectedTheme] || THEME_BACKGROUNDS.celebration;
  const activeBg = customBgUrl || selectedBg;

  // Play celebration effects on mount (confetti 15s + music loop continuously)
  useEffect(() => {
    const audioSrc = MUSIC_OPTIONS.find(m => m.id === selectedMusic)?.src || MUSIC_OPTIONS[0].src;
    try {
      const audio = new Audio(audioSrc);
      audio.volume = 0.6;
      audio.loop = true;
      audio.play().catch(() => {});
      audioRef.current = audio;
    } catch {}

    // Fire confetti every 1.5s for 15 seconds
    const colors = ["#FFD700", "#FF00E5", "#00E7FF", "#7A2BFF", "#FFA500"];
    let counter = 0;
    const fireConfetti = () => {
      const origins = [
        { x: 0.5, y: 0.6 },
        { x: 0.2, y: 0.65 },
        { x: 0.8, y: 0.65 },
      ];
      const origin = origins[counter % 3];
      counter++;
      confetti({ particleCount: 150, spread: 80, origin, colors });
      confetti({ particleCount: 50, spread: 360, startVelocity: 20, ticks: 80, origin: { x: 0.5, y: 0.4 }, shapes: ["star"], colors: ["#FFD700", "#FFA500"] });
    };
    fireConfetti();
    const intervalId = setInterval(fireConfetti, 1500);
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setShowEffects(false); // auto-hide fullscreen shower after 15s
    }, 15000);

    return () => {
      audioRef.current?.pause();
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
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

  // When theme changes, pick first background + clear custom
  useEffect(() => {
    const bgs = THEME_BACKGROUNDS[selectedTheme] || THEME_BACKGROUNDS.celebration;
    setSelectedBg(bgs[0]);
    setCustomBgUrl(null);
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

  // ======================== CUSTOM BG UPLOAD ========================
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Chỉ chấp nhận file ảnh", variant: "destructive" });
      return;
    }
    setIsUploadingBg(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `celebration-bg/${sender.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
      setCustomBgUrl(urlData.publicUrl);
      toast({ title: "Đã tải ảnh nền! 🖼️" });
    } catch {
      toast({ title: "Không thể tải ảnh", variant: "destructive" });
    } finally {
      setIsUploadingBg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
      // Pre-convert all images to base64 to avoid CORS issues with html2canvas
      const originals = await preloadImagesToBase64(cardRef.current);
      const canvas = await html2canvas(cardRef.current, { useCORS: true, allowTaint: true, backgroundColor: null, scale: 2 });
      // Restore original src
      originals.forEach(({ img, src }) => { img.src = src; });
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

  // ======================== "LƯU & GỬI" — MAIN ACTION ========================
  const handleSaveAndSend = async () => {
    if (isSending || hasSent) return;
    setIsSending(true);
    try {
      // 1. Lưu metadata celebration card vào donation_transactions
      if (transaction.id) {
        await supabase.from("donation_transactions").update({
          metadata: {
            theme: selectedTheme,
            background: activeBg,
            music: selectedMusic,
            custom_bg: !!customBgUrl,
          },
        }).eq("id", transaction.id);
      }

      // 2. Đăng bài lên Profile
      const { data: channel } = await supabase.from("channels").select("id").eq("user_id", sender.id).single();
      if (channel) {
        const receiptUrl = `${window.location.origin}/receipt/${transaction.receipt_public_id}`;
        const postContent = `${currentTheme.emoji} ${sender.name} vừa tặng ${transaction.amount} ${token.symbol} cho @${receiver.username}${message ? ` với lời nhắn: "${message}"` : ""} 💖\n\nChủ đề: ${currentTheme.label}\n🎁 Xem biên nhận: ${receiptUrl}\n\n#FUNGift #FUNPlay #LanToaYeuThuong`;
        await supabase.from("posts").insert({
          user_id: sender.id,
          channel_id: channel.id,
          content: postContent,
          post_type: "donation",
          is_public: true,
          donation_transaction_id: transaction.id || null,
        });
      }

      // 3. Gửi tin nhắn cho người nhận
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
      if (chatId) {
        const msgContent = `🎁 ${sender.name} đã tặng bạn ${transaction.amount} ${token.symbol}!${message ? ` Lời nhắn: "${message}"` : ""} 💖`;
        await supabase.from("chat_messages").insert({
          chat_id: chatId,
          sender_id: sender.id,
          message_type: "donation",
          content: msgContent,
          donation_transaction_id: transaction.id || null,
          deep_link: `/receipt/${transaction.receipt_public_id}`,
        });
      }

      // 4. Gửi thông báo cho người nhận với lựa chọn chia sẻ
      await supabase.from("notifications").insert({
        user_id: receiver.id,
        type: "gift_received",
        title: `🎁 ${sender.name} đã tặng bạn ${transaction.amount} ${token.symbol}!`,
        message: "Bạn có muốn chia sẻ Celebration Card lên trang cá nhân không?",
        link: `/receipt/${transaction.receipt_public_id}`,
        actor_id: sender.id,
        action_type: "share_celebration",
        action_status: "pending",
        metadata: {
          transaction_id: transaction.id,
          receipt_public_id: transaction.receipt_public_id,
          theme: selectedTheme,
          background: activeBg,
          music: selectedMusic,
          amount: transaction.amount,
          token_symbol: token.symbol,
        },
      });

      setHasSent(true);
      toast({ title: "🎉 Đã lưu & gửi thành công!" });

      // Confetti ăn mừng lần nữa
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ["#FFD700", "#FF00E5", "#00E7FF"] });
    } catch (err) {
      console.error("Lưu & Gửi error:", err);
      toast({ title: "Có lỗi xảy ra, vui lòng thử lại", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="space-y-3 py-2 relative"
    >
      {/* Fullscreen Coin Shower (15s) */}
      {showEffects && <FullscreenCoinShower />}

      {/* Top bar: Volume (audio) + X (effects) — prominent buttons */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsMuted(m => {
              const next = !m;
              if (audioRef.current) { next ? audioRef.current.pause() : audioRef.current.play().catch(() => {}); }
              return next;
            });
          }}
          className="h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center transition-all"
          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
        </button>
        <button
          type="button"
          onClick={() => setShowEffects(false)}
          className="h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center transition-all"
          title="Tắt hiệu ứng hình ảnh"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Header */}
      <div className="text-center relative z-10">
        {showEffects && (
          <motion.div animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-2 left-1/2 -translate-x-1/2">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </motion.div>
        )}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
          <CheckCircle2 className="h-7 w-7 text-white" />
        </motion.div>
        <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-sm font-bold mt-1.5 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
          🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉
        </motion.h3>
      </div>

      {/* ======================== CELEBRATION CARD ======================== */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden rounded-2xl z-10 aspect-[4/5]"
        style={{
          backgroundImage: `url(${activeBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        {/* Card internal coin/sparkle effects - loops forever until X */}
        {showEffects && <CardInternalEffects />}
        <div className="relative h-full flex flex-col justify-between p-5 text-white">
          {/* TOP: Title + Avatars + Amount */}
          <div className="space-y-3">
            {/* Title INSIDE card */}
            <p className="text-sm font-bold tracking-wide text-center drop-shadow-lg">
              🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉
            </p>

            {/* Sender → Amount → Receiver */}
            <div className="flex items-center justify-between gap-2">
              <a href={`/user/${sender.id}`} className="flex flex-col items-center gap-1 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12 ring-2 ring-white/30">
                  <AvatarImage src={sender.avatar || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">{sender.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold truncate max-w-full drop-shadow">{sender.name}</p>
                <p className="text-xs text-white/70">@{sender.username}</p>
                {sender.wallet && (
                  <div className="flex items-center gap-0.5">
                    <span className="text-[11px] font-mono text-white/60">{shortenAddress(sender.wallet)}</span>
                    <CopyBtn text={sender.wallet} />
                  </div>
                )}
              </a>

              <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-2">
                <div className="flex items-center gap-1.5 text-xl font-bold">
                  {token.icon_url && <img src={token.icon_url} alt="" className="h-5 w-5" />}
                  <span className="text-amber-300 drop-shadow-lg">{transaction.amount.toLocaleString()}</span>
                </div>
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-xl">→</motion.div>
                <span className="text-sm font-medium text-white/80">{token.symbol}</span>
              </div>

              <a href={`/user/${receiver.id}`} className="flex flex-col items-center gap-1 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12 ring-2 ring-amber-400/30">
                  <AvatarImage src={receiver.avatar || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm">{receiver.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold truncate max-w-full drop-shadow">{receiver.name}</p>
                <p className="text-xs text-white/70">@{receiver.username}</p>
                {receiver.wallet && (
                  <div className="flex items-center gap-0.5">
                    <span className="text-[11px] font-mono text-white/60">{shortenAddress(receiver.wallet)}</span>
                    <CopyBtn text={receiver.wallet} />
                  </div>
                )}
              </a>
            </div>
          </div>

          {/* MIDDLE: Details */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-white/60">Trạng thái</span><span className="text-green-400 font-medium">✅ Thành công</span></div>
            {message && (
              <div>
                <span className="text-white/60">Lời nhắn</span>
                <p className="italic mt-0.5 p-2 bg-white/10 rounded-lg text-sm">"{message}"</p>
              </div>
            )}
            <div className="flex justify-between"><span className="text-white/60">Thời gian</span><span>{new Date().toLocaleString("vi-VN")}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Chain</span><span>{token.chain === "internal" ? "Nội bộ" : "BSC"}</span></div>
            {transaction.tx_hash && (
              <div className="flex justify-between items-center">
                <span className="text-white/60">TX Hash</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">{transaction.tx_hash.substring(0, 10)}…</span>
                  <button type="button" onClick={handleCopyTx} className="p-0.5 hover:bg-white/20 rounded"><Copy className="h-3.5 w-3.5 text-white/70" /></button>
                  <a href={transaction.explorer_url || `https://bscscan.com/tx/${transaction.tx_hash}`} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:bg-white/20 rounded">
                    <ExternalLink className="h-3.5 w-3.5 text-white/70" />
                  </a>
                </div>
              </div>
            )}
            <div className="flex justify-between"><span className="text-white/60">Mã biên nhận</span><span className="font-mono text-xs">#{transaction.receipt_public_id}</span></div>
          </div>

          {/* BOTTOM: Wallet info */}
          <div className="text-center">
            <p className="text-xs text-white/50">FUN PLAY • Tặng & Thưởng</p>
          </div>
        </div>
      </motion.div>

      {/* ======================== THEME SELECTION ======================== */}
      <div className="space-y-1.5 relative z-10">
        <label className="text-xs font-medium">Chủ đề ✨</label>
        <div className="grid grid-cols-6 gap-1.5">
          {DONATION_THEMES.map((theme) => (
            <button key={theme.id} type="button" onClick={() => setSelectedTheme(theme.id)}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl border transition-all ${
                selectedTheme === theme.id
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}>
              <span className="text-lg">{theme.emoji}</span>
              <span className="text-[9px] leading-tight text-center">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ======================== BACKGROUND SELECTION ======================== */}
      <div className="space-y-1.5 relative z-10">
        <label className="text-xs font-medium">Ảnh nền 🖼️</label>
        <div className="grid grid-cols-4 gap-1.5">
          {backgrounds.map((bg, i) => (
            <button key={bg} type="button" onClick={() => { setSelectedBg(bg); setCustomBgUrl(null); }}
              className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                !customBgUrl && selectedBg === bg ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              }`}>
              <img src={bg} alt={`Nền ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
          {/* Upload custom bg */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingBg}
            className={`aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-all ${
              customBgUrl ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">{isUploadingBg ? "Đang tải..." : "Tải lên"}</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
        </div>
      </div>

      {/* ======================== MUSIC SELECTION ======================== */}
      <div className="space-y-1.5 relative z-10">
        <label className="text-xs font-medium">Nhạc 🎵</label>
        <div className="space-y-1">
          {MUSIC_OPTIONS.map((opt) => (
            <div key={opt.id} onClick={() => setSelectedMusic(opt.id)}
              className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                selectedMusic === opt.id ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}>
              <button type="button" onClick={(e) => { e.stopPropagation(); togglePreview(opt.id); }}
                className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  playingMusicId === opt.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted-foreground/20"
                }`}>
                {playingMusicId === opt.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground">{opt.description}</p>
              </div>
              {selectedMusic === opt.id && <span className="text-xs text-primary font-medium">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ======================== ACTION BUTTONS ======================== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-2 relative z-10">
        {/* PRIMARY: Lưu & Gửi */}
        <Button
          onClick={handleSaveAndSend}
          disabled={isSending || hasSent}
          className="w-full h-11 text-sm font-bold"
          style={{
            background: hasSent
              ? "linear-gradient(to right, hsl(142, 71%, 45%), hsl(142, 71%, 35%))"
              : "linear-gradient(to right, hsl(45, 100%, 50%), hsl(30, 100%, 50%))",
            color: hasSent ? "white" : "#7C5800",
          }}
        >
          {hasSent ? (
            <><CheckCircle2 className="h-4 w-4 mr-2" />Đã lưu & gửi thành công!</>
          ) : isSending ? (
            <><span className="animate-spin mr-2">⏳</span>Đang gửi...</>
          ) : (
            <><Send className="h-4 w-4 mr-2" />Lưu & Gửi</>
          )}
        </Button>

        {/* SECONDARY actions */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleSaveImage} disabled={isSavingImage}>
            <Download className="h-3.5 w-3.5 mr-1" />{isSavingImage ? "Đang lưu..." : "Lưu hình ảnh"}
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleCopyLink}>
            <Copy className="h-3.5 w-3.5 mr-1" />Chia sẻ link
          </Button>
          {transaction.tx_hash && (
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleCopyTx}>
              <Copy className="h-3.5 w-3.5 mr-1" />Copy TX Hash
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>
            <X className="h-3.5 w-3.5 mr-1" />Đóng
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GiftCelebrationModal;
