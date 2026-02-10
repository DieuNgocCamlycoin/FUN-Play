import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Gift, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const THEME_LABELS: Record<string, { emoji: string; label: string }> = {
  celebration: { emoji: "🎉", label: "Chúc mừng" },
  wedding: { emoji: "💍", label: "Kết hôn" },
  birthday: { emoji: "🎂", label: "Sinh nhật" },
  gratitude: { emoji: "🙏", label: "Tri ân" },
  love: { emoji: "❤️", label: "Tình yêu" },
  family: { emoji: "👨‍👩‍👧‍👦", label: "Gia đình" },
  parents: { emoji: "🌱", label: "Cha mẹ" },
};

const THEME_GRADIENTS: Record<string, string> = {
  celebration: "from-amber-400/15 via-pink-400/15 to-purple-500/15",
  wedding: "from-rose-300/15 via-amber-200/15 to-yellow-300/15",
  birthday: "from-pink-400/15 via-yellow-300/15 to-cyan-400/15",
  gratitude: "from-emerald-400/15 via-teal-400/15 to-green-500/15",
  love: "from-red-400/15 via-pink-400/15 to-rose-400/15",
  family: "from-blue-400/15 via-indigo-400/15 to-purple-400/15",
  parents: "from-green-400/15 via-emerald-400/15 to-teal-400/15",
};

const THEME_BORDERS: Record<string, string> = {
  celebration: "border-amber-400/30",
  wedding: "border-rose-300/30",
  birthday: "border-pink-400/30",
  gratitude: "border-emerald-400/30",
  love: "border-red-400/30",
  family: "border-blue-400/30",
  parents: "border-green-400/30",
};

interface DonationData {
  amount: number;
  token_symbol: string;
  token_icon?: string;
  sender_name: string;
  sender_username: string;
  sender_avatar: string | null;
  receiver_name: string;
  receiver_username: string;
  receiver_avatar: string | null;
  theme: string;
  message: string | null;
  receipt_public_id: string;
}

interface DonationCelebrationCardProps {
  donationTransactionId?: string | null;
  postContent?: string;
}

export const DonationCelebrationCard = ({ donationTransactionId, postContent }: DonationCelebrationCardProps) => {
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
            amount, message, receipt_public_id, metadata,
            token:donate_tokens(symbol, icon_url),
            sender:profiles!donation_transactions_sender_id_fkey(display_name, username, avatar_url),
            receiver:profiles!donation_transactions_receiver_id_fkey(display_name, username, avatar_url)
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

        setData({
          amount: tx.amount,
          token_symbol: tokenData?.symbol || "TOKEN",
          token_icon: tokenData?.icon_url || undefined,
          sender_name: senderData?.display_name || senderData?.username || "Người gửi",
          sender_username: senderData?.username || "",
          sender_avatar: senderData?.avatar_url || null,
          receiver_name: receiverData?.display_name || receiverData?.username || "Người nhận",
          receiver_username: receiverData?.username || "",
          receiver_avatar: receiverData?.avatar_url || null,
          theme: metadata?.theme || "celebration",
          message: tx.message,
          receipt_public_id: tx.receipt_public_id,
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
      <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4 animate-pulse">
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  if (!data) return null;

  const themeInfo = THEME_LABELS[data.theme] || THEME_LABELS.celebration;
  const gradient = THEME_GRADIENTS[data.theme] || THEME_GRADIENTS.celebration;
  const border = THEME_BORDERS[data.theme] || THEME_BORDERS.celebration;

  return (
    <div className={`mt-3 rounded-xl border ${border} bg-gradient-to-br ${gradient} p-4 space-y-3`}>
      {/* Title */}
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Gift className="h-4 w-4 text-amber-500" />
        <span>{themeInfo.emoji} Tặng thưởng thành công</span>
      </div>

      {/* Sender → Amount → Receiver */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex flex-col items-center gap-1 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/u/${data.sender_username}`)}
        >
          <Avatar className="h-9 w-9 ring-2 ring-purple-500/20">
            <AvatarImage src={data.sender_avatar || ""} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
              {data.sender_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs font-medium truncate max-w-full">{data.sender_name}</p>
        </div>

        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-1">
          <div className="flex items-center gap-1 font-bold text-sm">
            {data.token_icon && <img src={data.token_icon} alt="" className="h-4 w-4" />}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{data.amount}</span>
          </div>
          <span className="text-lg">→</span>
          <span className="text-[10px] text-muted-foreground">{data.token_symbol}</span>
        </div>

        <div
          className="flex flex-col items-center gap-1 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/u/${data.receiver_username}`)}
        >
          <Avatar className="h-9 w-9 ring-2 ring-amber-500/20">
            <AvatarImage src={data.receiver_avatar || ""} />
            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs">
              {data.receiver_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs font-medium truncate max-w-full">{data.receiver_name}</p>
        </div>
      </div>

      {/* Message */}
      {data.message && (
        <p className="text-xs italic text-muted-foreground p-2 bg-background/50 rounded-lg">"{data.message}"</p>
      )}

      {/* View receipt button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => navigate(`/receipt/${data.receipt_public_id}`)}
      >
        <ExternalLink className="h-3 w-3 mr-1.5" />
        Xem biên nhận
      </Button>
    </div>
  );
};
