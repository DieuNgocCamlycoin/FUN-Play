import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Gift, ExternalLink, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const THEME_LABELS: Record<string, { emoji: string; label: string }> = {
  celebration: { emoji: "🎉", label: "Chúc mừng" },
  birthday: { emoji: "🎂", label: "Sinh nhật" },
  gratitude: { emoji: "🙏", label: "Tri ân" },
  love: { emoji: "❤️", label: "Tình yêu" },
  newyear: { emoji: "🎊", label: "Năm mới" },
  family: { emoji: "👨‍👩‍👧‍👦", label: "Gia đình" },
};

const DEFAULT_BG = "/images/celebration-bg/celebration-1.png";

const shortenAddress = (addr: string) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

interface DonationData {
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
  theme: string;
  background: string;
  message: string | null;
  receipt_public_id: string;
  tx_hash: string | null;
  chain: string;
  created_at: string;
  explorer_url: string | null;
}

interface DonationCelebrationCardProps {
  donationTransactionId?: string | null;
  postContent?: string;
}

export const DonationCelebrationCard = ({
  donationTransactionId,
}: DonationCelebrationCardProps) => {
  const navigate = useNavigate();
  const [data, setData] = useState<DonationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!donationTransactionId) {
        setLoading(false);
        return;
      }

      try {
        const { data: tx, error } = await supabase
          .from("donation_transactions")
          .select(`
            amount, message, receipt_public_id, metadata, tx_hash, chain, created_at, explorer_url,
            token:donate_tokens(symbol, icon_url),
            sender:profiles!donation_transactions_sender_id_fkey(display_name, username, avatar_url, wallet_address),
            receiver:profiles!donation_transactions_receiver_id_fkey(display_name, username, avatar_url, wallet_address)
          `)
          .eq("id", donationTransactionId)
          .single();

        if (error || !tx) {
          setLoading(false);
          return;
        }

        const tokenData = tx.token as any;
        const senderData = tx.sender as any;
        const receiverData = tx.receiver as any;
        const metadata = tx.metadata as any;

        // Read metadata — support both flat and nested structures
        const theme =
          metadata?.theme ||
          metadata?.celebration?.theme ||
          "celebration";
        const background =
          metadata?.background ||
          metadata?.celebration?.background ||
          DEFAULT_BG;

        setData({
          amount: tx.amount,
          token_symbol: tokenData?.symbol || "TOKEN",
          token_icon: tokenData?.icon_url || undefined,
          sender_name:
            senderData?.display_name || senderData?.username || "Người gửi",
          sender_username: senderData?.username || "",
          sender_avatar: senderData?.avatar_url || null,
          sender_wallet: senderData?.wallet_address || null,
          receiver_name:
            receiverData?.display_name ||
            receiverData?.username ||
            "Người nhận",
          receiver_username: receiverData?.username || "",
          receiver_avatar: receiverData?.avatar_url || null,
          receiver_wallet: receiverData?.wallet_address || null,
          theme,
          background,
          message: tx.message,
          receipt_public_id: tx.receipt_public_id,
          tx_hash: tx.tx_hash,
          chain: tx.chain,
          created_at: tx.created_at,
          explorer_url: tx.explorer_url,
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [donationTransactionId]);

  if (loading) {
    return (
      <div className="mt-3 rounded-xl border border-border bg-muted/30 animate-pulse aspect-[4/5] max-w-[360px]" />
    );
  }

  if (!data) return null;

  const themeInfo = THEME_LABELS[data.theme] || THEME_LABELS.celebration;
  const formattedTime = (() => {
    try {
      return format(new Date(data.created_at), "HH:mm dd/MM/yyyy", {
        locale: vi,
      });
    } catch {
      return data.created_at;
    }
  })();

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Đã copy ${label}! 📋` });
  };

  return (
    <div
      className="mt-3 rounded-2xl overflow-hidden relative max-w-[360px] aspect-[4/5]"
      style={{
        backgroundImage: `url(${data.background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative h-full flex flex-col justify-between p-5 text-white">
        {/* TOP: Title + Avatars */}
        <div className="space-y-3">
          <p className="text-sm font-bold tracking-wide text-center drop-shadow-lg">
            🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉
          </p>

          <div className="flex items-center justify-between gap-2">
            <div
              className="flex flex-col items-center gap-1 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/u/${data.sender_username}`)}
            >
              <Avatar className="h-12 w-12 ring-2 ring-white/30">
                <AvatarImage src={data.sender_avatar || ""} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                  {data.sender_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate max-w-full drop-shadow">{data.sender_name}</p>
              <p className="text-xs text-white/70">@{data.sender_username}</p>
              {data.sender_wallet && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[11px] font-mono text-white/60">{shortenAddress(data.sender_wallet)}</span>
                  <button onClick={(e) => { e.stopPropagation(); copyText(data.sender_wallet!, "ví"); }} className="p-0.5 hover:bg-white/20 rounded">
                    <Copy className="h-3.5 w-3.5 text-white/60" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-2">
              <div className="flex items-center gap-1.5 text-xl font-bold">
                {data.token_icon && <img src={data.token_icon} alt="" className="h-5 w-5" />}
                <span className="text-amber-300 drop-shadow-lg">{data.amount.toLocaleString()}</span>
              </div>
              <span className="text-xl">→</span>
              <span className="text-sm font-medium text-white/80">{data.token_symbol}</span>
            </div>

            <div
              className="flex flex-col items-center gap-1 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/u/${data.receiver_username}`)}
            >
              <Avatar className="h-12 w-12 ring-2 ring-amber-400/30">
                <AvatarImage src={data.receiver_avatar || ""} />
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm">
                  {data.receiver_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate max-w-full drop-shadow">{data.receiver_name}</p>
              <p className="text-xs text-white/70">@{data.receiver_username}</p>
              {data.receiver_wallet && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[11px] font-mono text-white/60">{shortenAddress(data.receiver_wallet)}</span>
                  <button onClick={(e) => { e.stopPropagation(); copyText(data.receiver_wallet!, "ví"); }} className="p-0.5 hover:bg-white/20 rounded">
                    <Copy className="h-3.5 w-3.5 text-white/60" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE: Details */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Trạng thái</span>
            <span className="text-green-400 font-medium">✅ Thành công</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Chủ đề</span>
            <span>{themeInfo.emoji} {themeInfo.label}</span>
          </div>
          {data.message && (
            <div>
              <span className="text-white/60">Lời nhắn</span>
              <p className="italic mt-0.5 p-2 bg-white/10 rounded-lg text-sm">"{data.message}"</p>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-white/60">Thời gian</span>
            <span>{formattedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Chain</span>
            <span>{data.chain === "internal" ? "Nội bộ" : "BSC"}</span>
          </div>
          {data.tx_hash && (
            <div className="flex justify-between items-center">
              <span className="text-white/60">TX Hash</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs">{data.tx_hash.substring(0, 10)}…</span>
                <button onClick={() => copyText(data.tx_hash!, "TX Hash")} className="p-0.5 hover:bg-white/20 rounded">
                  <Copy className="h-3.5 w-3.5 text-white/60" />
                </button>
                <a href={data.explorer_url || `https://bscscan.com/tx/${data.tx_hash}`} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:bg-white/20 rounded">
                  <ExternalLink className="h-3.5 w-3.5 text-white/60" />
                </a>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-white/60">Mã biên nhận</span>
            <span className="font-mono text-xs">#{data.receipt_public_id}</span>
          </div>
        </div>

        {/* BOTTOM */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-sm border-white/30 text-white hover:bg-white/20 bg-white/10"
          onClick={() => navigate(`/receipt/${data.receipt_public_id}`)}
        >
          <Gift className="h-3.5 w-3.5 mr-1.5" />
          Xem Celebration Card
        </Button>
      </div>
    </div>
  );
};
