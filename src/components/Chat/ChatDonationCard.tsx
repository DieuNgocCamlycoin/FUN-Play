import { useState, useEffect } from "react";
import { Gift, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_BG = "/images/celebration-bg/celebration-1.png";

interface ChatDonationCardProps {
  content: string | null;
  deepLink: string | null;
  donationTransactionId: string | null;
  isMe: boolean;
}

interface MiniCardData {
  amount: number;
  token_symbol: string;
  token_icon?: string;
  sender_name: string;
  sender_avatar: string | null;
  receiver_name: string;
  receiver_avatar: string | null;
  background: string;
  receipt_public_id: string;
}

export const ChatDonationCard = ({
  content,
  deepLink,
  donationTransactionId,
  isMe,
}: ChatDonationCardProps) => {
  const navigate = useNavigate();
  const [cardData, setCardData] = useState<MiniCardData | null>(null);

  useEffect(() => {
    if (!donationTransactionId) return;

    const fetchCard = async () => {
      try {
        const { data: tx } = await supabase
          .from("donation_transactions")
          .select(`
            amount, receipt_public_id, metadata,
            token:donate_tokens(symbol, icon_url),
            sender:profiles!donation_transactions_sender_id_fkey(display_name, username, avatar_url),
            receiver:profiles!donation_transactions_receiver_id_fkey(display_name, username, avatar_url)
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

        setCardData({
          amount: tx.amount,
          token_symbol: tokenData?.symbol || "TOKEN",
          token_icon: tokenData?.icon_url || undefined,
          sender_name:
            senderData?.display_name || senderData?.username || "Người gửi",
          sender_avatar: senderData?.avatar_url || null,
          receiver_name:
            receiverData?.display_name ||
            receiverData?.username ||
            "Người nhận",
          receiver_avatar: receiverData?.avatar_url || null,
          background,
          receipt_public_id: tx.receipt_public_id,
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

  // If we have card data, render mini celebration card
  if (cardData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-[260px] ${isMe ? "ml-auto" : "mr-auto"}`}
      >
        <div
          className="relative rounded-2xl overflow-hidden aspect-[4/5]"
          style={{
            backgroundImage: `url(${cardData.background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative h-full flex flex-col items-center justify-center p-3 text-white text-center gap-2">
            {/* Title */}
            <p className="text-[9px] font-bold tracking-wide drop-shadow-lg">
              🎉 TẶNG THƯỞNG THÀNH CÔNG 🎉
            </p>

            {/* Avatars + Amount */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-white/30">
                <AvatarImage src={cardData.sender_avatar || ""} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[10px]">
                  {cardData.sender_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 font-bold text-sm">
                  {cardData.token_icon && (
                    <img
                      src={cardData.token_icon}
                      alt=""
                      className="h-3.5 w-3.5"
                    />
                  )}
                  <span className="text-amber-300 drop-shadow-lg">
                    {cardData.amount.toLocaleString()}
                  </span>
                </div>
                <span className="text-[9px] text-white/70">
                  {cardData.token_symbol}
                </span>
              </div>

              <Avatar className="h-8 w-8 ring-2 ring-amber-400/30">
                <AvatarImage src={cardData.receiver_avatar || ""} />
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[10px]">
                  {cardData.receiver_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Names */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="font-medium">{cardData.sender_name}</span>
              <span className="text-white/60">→</span>
              <span className="font-medium">{cardData.receiver_name}</span>
            </div>
          </div>
        </div>

        {/* View button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleViewCard}
          className="gap-1.5 mt-1.5 w-full text-[11px] h-7 border-amber-300/50 hover:border-amber-400 hover:bg-amber-50 text-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
        >
          <Gift className="w-3 h-3" />
          Xem Celebration Card
        </Button>
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
              Xem biên nhận
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
