import { useState, useEffect } from "react";
import { Gift, ExternalLink, Copy, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const DEFAULT_BG = "/images/celebration-bg/celebration-1.png";

const THEME_LABELS: Record<string, { emoji: string; label: string }> = {
  celebration: { emoji: "🎉", label: "Chúc mừng" },
  birthday: { emoji: "🎂", label: "Sinh nhật" },
  gratitude: { emoji: "🙏", label: "Tri ân" },
  love: { emoji: "❤️", label: "Tình yêu" },
  newyear: { emoji: "🎊", label: "Năm mới" },
  family: { emoji: "👨‍👩‍👧‍👦", label: "Gia đình" },
};

const shortenAddress = (addr: string) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

interface ChatDonationCardProps {
  content: string | null;
  deepLink: string | null;
  donationTransactionId: string | null;
  isMe: boolean;
}

interface FullCardData {
  amount: number;
  token_symbol: string;
  token_icon?: string;
  sender_name: string;
  sender_username: string;
  sender_avatar: string | null;
  sender_wallet: string | null;
  receiver_name: string;
  receiver_username: string;
  receiver_avatar: string | null;
  receiver_wallet: string | null;
  background: string;
  receipt_public_id: string;
  theme: string;
  message: string | null;
  tx_hash: string | null;
  chain: string;
  created_at: string;
  explorer_url: string | null;
  context_type: string;
}

export const ChatDonationCard = ({
  content,
  deepLink,
  donationTransactionId,
  isMe,
}: ChatDonationCardProps) => {
  const navigate = useNavigate();
  const [cardData, setCardData] = useState<FullCardData | null>(null);

  useEffect(() => {
    if (!donationTransactionId) return;

    const fetchCard = async () => {
      try {
        const { data: tx } = await supabase
          .from("donation_transactions")
          .select(`
            amount, receipt_public_id, metadata, message, tx_hash, chain, created_at, explorer_url, context_type,
            token:donate_tokens(symbol, icon_url),
            sender:profiles!donation_transactions_sender_id_fkey(display_name, username, avatar_url, wallet_address),
            receiver:profiles!donation_transactions_receiver_id_fkey(display_name, username, avatar_url, wallet_address)
          `)
          .eq("id", donationTransactionId)
          .single();

        if (!tx) return;

        const tokenData = tx.token as any;
        const senderData = tx.sender as any;
        const receiverData = tx.receiver as any;
        const metadata = tx.metadata as any;

        const background =
          metadata?.background ||
          metadata?.celebration?.background ||
          DEFAULT_BG;
        const theme =
          metadata?.theme ||
          metadata?.celebration?.theme ||
          "celebration";

        setCardData({
          amount: tx.amount,
          token_symbol: tokenData?.symbol || "TOKEN",
          token_icon: tokenData?.icon_url || undefined,
          sender_name: senderData?.display_name || senderData?.username || "Người gửi",
          sender_username: senderData?.username || "",
          sender_avatar: senderData?.avatar_url || null,
          sender_wallet: senderData?.wallet_address || null,
          receiver_name: receiverData?.display_name || receiverData?.username || "Người nhận",
          receiver_username: receiverData?.username || "",
          receiver_avatar: receiverData?.avatar_url || null,
          receiver_wallet: receiverData?.wallet_address || null,
          background,
          receipt_public_id: tx.receipt_public_id,
          theme,
          message: tx.message,
          tx_hash: tx.tx_hash,
          chain: tx.chain,
          created_at: tx.created_at,
          explorer_url: tx.explorer_url,
          context_type: (tx as any).context_type || "global",
        });
      } catch {
        // silently fail — fallback to text
      }
    };

    fetchCard();
  }, [donationTransactionId]);

  const handleViewCard = () => {
    if (cardData) {
      navigate(`/receipt/${cardData.receipt_public_id}`);
    } else if (deepLink) {
      navigate(deepLink);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Đã copy ${label}! 📋` });
  };

  const themeInfo = cardData ? (THEME_LABELS[cardData.theme] || THEME_LABELS.celebration) : THEME_LABELS.celebration;

  const formattedTime = (() => {
    if (!cardData) return "";
    try {
      return format(new Date(cardData.created_at), "HH:mm dd/MM/yyyy", { locale: vi });
    } catch {
      return cardData.created_at;
    }
  })();

  // If we have card data, render full celebration card
  if (cardData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-[280px] sm:max-w-[320px] ${isMe ? "ml-auto" : "mr-auto"}`}
      >
        <div
          className="relative rounded-2xl overflow-hidden aspect-[4/5] chat-celebration-card"
          style={{
            backgroundImage: `url(${cardData.background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative h-full flex flex-col justify-between p-4 text-white">
            {/* TOP: Title + Avatars */}
            <div className="space-y-2">
              <p className="text-xs font-bold tracking-wide text-center drop-shadow-lg">
                {cardData.context_type === "claim"
                  ? "💰 CLAIM CAMLY THÀNH CÔNG 💰"
                  : "🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉"}
              </p>

              <div className="flex items-center justify-between gap-2">
                <div
                  className="flex flex-col items-center gap-0.5 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/c/${cardData.sender_username}`)}
                >
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white/30">
                    <AvatarImage src={cardData.sender_avatar || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                      {cardData.sender_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold truncate max-w-full drop-shadow">{cardData.sender_name}</p>
                  <p className="text-[11px] text-white/70">@{cardData.sender_username}</p>
                  {cardData.sender_wallet && (
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] font-mono text-white/60">{shortenAddress(cardData.sender_wallet)}</span>
                      <button onClick={(e) => { e.stopPropagation(); copyText(cardData.sender_wallet!, "ví"); }} className="p-0.5 hover:bg-white/20 rounded">
                        <Copy className="h-3 w-3 text-white/60" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-1">
                  <div className="flex items-center gap-1 text-base sm:text-lg font-bold">
                    {cardData.token_icon && <img src={cardData.token_icon} alt="" className="h-4 w-4" />}
                    <span className="text-amber-300 drop-shadow-lg">{cardData.amount.toLocaleString()}</span>
                  </div>
                  <span className="text-lg">→</span>
                  <span className="text-xs font-medium text-white/80">{cardData.token_symbol}</span>
                </div>

                <div
                  className="flex flex-col items-center gap-0.5 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/c/${cardData.receiver_username}`)}
                >
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-amber-400/30">
                    <AvatarImage src={cardData.receiver_avatar || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm">
                      {cardData.receiver_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold truncate max-w-full drop-shadow">{cardData.receiver_name}</p>
                  <p className="text-[11px] text-white/70">@{cardData.receiver_username}</p>
                  {cardData.receiver_wallet && (
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] font-mono text-white/60">{shortenAddress(cardData.receiver_wallet)}</span>
                      <button onClick={(e) => { e.stopPropagation(); copyText(cardData.receiver_wallet!, "ví"); }} className="p-0.5 hover:bg-white/20 rounded">
                        <Copy className="h-3 w-3 text-white/60" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MIDDLE: Details (no dark frame) */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-white/60">Trạng thái</span><span className="text-green-400 font-medium">✅ Thành công</span></div>
              
              {cardData.message && (
                <div>
                  <span className="text-white/60">Lời nhắn</span>
                  <p className="italic mt-0.5 p-1.5 bg-white/10 rounded-lg text-xs">"{cardData.message}"</p>
                </div>
              )}
              <div className="flex justify-between"><span className="text-white/60">Thời gian</span><span className="text-xs">{formattedTime}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Chain</span><span>{cardData.chain === "internal" ? "Nội bộ" : "BSC"}</span></div>
              {cardData.tx_hash && (
                <div className="flex justify-between items-center">
                  <span className="text-white/60">TX Hash</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px]">{cardData.tx_hash.substring(0, 10)}…</span>
                    <button onClick={() => copyText(cardData.tx_hash!, "TX Hash")} className="p-0.5 hover:bg-white/20 rounded">
                      <Copy className="h-3 w-3 text-white/60" />
                    </button>
                    <a href={cardData.explorer_url || `https://bscscan.com/tx/${cardData.tx_hash}`} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:bg-white/20 rounded">
                      <ExternalLink className="h-3 w-3 text-white/60" />
                    </a>
                  </div>
                </div>
              )}
              <div className="flex justify-between"><span className="text-white/60">Mã biên nhận</span><span className="font-mono text-[10px]">#{cardData.receipt_public_id}</span></div>
            </div>

            {/* BOTTOM */}
            <div className="flex justify-between">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const cardEl = e.currentTarget.closest('.chat-celebration-card') as HTMLElement;
                  if (!cardEl) return;
                  try {
                    const { default: html2canvas } = await import('html2canvas');
                    const canvas = await html2canvas(cardEl, { useCORS: true, allowTaint: true, backgroundColor: null, scale: 2 });
                    const link = document.createElement('a');
                    link.download = `celebration-card-${cardData.receipt_public_id}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    toast({ title: 'Đã lưu hình ảnh! 📥' });
                  } catch { toast({ title: 'Không thể lưu ảnh', variant: 'destructive' }); }
                }}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Lưu về thiết bị"
              >
                <Download className="h-3.5 w-3.5 text-white/80" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `${window.location.origin}/receipt/${cardData.receipt_public_id}`;
                  if (navigator.share) {
                    navigator.share({ title: 'Celebration Card', url }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(url);
                    toast({ title: 'Đã copy link Celebration Card! 📋' });
                  }
                }}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Chia sẻ"
              >
                <Share2 className="h-3.5 w-3.5 text-white/80" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Fallback: text-based card (when no transaction ID or fetch fails)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`max-w-[85%] ${isMe ? "ml-auto" : "mr-auto"}`}
    >
      <div className="relative p-4 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-pink-400 to-purple-400 opacity-30" />
        <div className="absolute inset-[1px] bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 dark:from-amber-950 dark:via-pink-950 dark:to-purple-950 rounded-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-full bg-gradient-to-br from-amber-400 to-pink-400">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-pink-600">
              Thưởng & Tặng
            </span>
          </div>

          {content && (
            <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">
              {content}
            </p>
          )}

          {deepLink && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewCard}
              className="gap-2 border-amber-300 hover:border-amber-400 hover:bg-amber-50 text-amber-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Xem Celebration Card
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
