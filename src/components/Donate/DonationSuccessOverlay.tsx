import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Share2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useEffect } from "react";

interface DonationSuccessOverlayProps {
  transaction: {
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
  };
  receiver: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  token: {
    symbol: string;
    name: string;
    icon_url?: string | null;
  };
  message?: string;
  onClose: () => void;
}

export const DonationSuccessOverlay = ({
  transaction,
  sender,
  receiver,
  token,
  message,
  onClose,
}: DonationSuccessOverlayProps) => {
  const { playCoinShower } = useSoundEffects();
  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  // Play celebration effects on mount
  useEffect(() => {
    // Play sound
    playCoinShower(8);

    // Multiple confetti bursts
    const fireConfetti = () => {
      // First burst - center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6, x: 0.5 },
        colors: ["#FFD700", "#FF00E5", "#00E7FF", "#7A2BFF"],
      });

      // Second burst - left
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0.2, y: 0.65 },
          colors: ["#FFD700", "#FF00E5", "#00E7FF"],
        });
      }, 150);

      // Third burst - right
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 0.8, y: 0.65 },
          colors: ["#FFD700", "#7A2BFF", "#00E7FF"],
        });
      }, 300);

      // Stars burst
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 360,
          startVelocity: 20,
          ticks: 60,
          origin: { x: 0.5, y: 0.4 },
          shapes: ["star"],
          colors: ["#FFD700", "#FFA500"],
        });
      }, 500);
    };

    fireConfetti();
  }, [playCoinShower]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/receipt/${transaction.receipt_public_id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Đã copy link biên nhận! 📋" });
  };

  // Celebration GIFs for donation posts
  const CELEBRATION_GIFS = [
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWZrOWJxaTN0d3NlMnJmMnVyOWZxOGtjcm9yY3JyemxqaXB2MWNsdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6Zt6cQPT8dpg4YkE/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHd1bTBoNWJkMm5wN2doaXk0Z295bHc4bHdyN2c5MnZtaHQ3bGNxaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KzDqC8LvVC4lshCsGJ/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3M5aHp6eGh5cGZocnBuaXM1aDZncW54MGZkcDV4czdnOGk1cnZ6aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tP4gFBQewkLnMv6/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjJ0MGN5MDg3NTN2dHFlNGF4dzR6dXZsMWR0NnpsMzE5cWNuOGY0byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXRxZ3UzMWVvbnEzbGd6NW5mdWFvazZ6eWhuOWlmcHEzMmFwcmM2aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7btNa0RUYa5E7iiQ/giphy.gif",
  ];

  const handleShareToProfile = async () => {
    setIsSharing(true);
    try {
      // Get user's channel
      const { data: channel } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", sender.id)
        .single();

      if (!channel) {
        throw new Error("Không tìm thấy channel");
      }

      // Pick a random celebration GIF
      const randomGif = CELEBRATION_GIFS[Math.floor(Math.random() * CELEBRATION_GIFS.length)];

      const receiptUrl = `${window.location.origin}/receipt/${transaction.receipt_public_id}`;
      const postContent = `✨ ${sender.name} vừa tặng ${transaction.amount} ${token.symbol} cho @${receiver.username}${message ? ` với lời nhắn: "${message}"` : ""} 💖\n\n🎁 Xem biên nhận: ${receiptUrl}\n\n#FUNGift #FUNPlay #LanToaYeuThuong`;

      const { error } = await supabase.from("posts").insert({
        user_id: sender.id,
        channel_id: channel.id,
        content: postContent,
        gif_url: randomGif,
        post_type: "donation",
        is_public: true,
      });

      if (error) throw error;

      toast({
        title: "Đã chia sẻ lên Profile! 🎉",
        description: "Bài viết đã được đăng với hiệu ứng lì xì",
      });
      setHasShared(true);
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể chia sẻ lên profile",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="space-y-6 text-center py-2"
    >
      {/* Close button */}
      <div className="absolute top-2 right-2">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Celebration header */}
      <div className="relative">
        {/* Animated sparkles */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-4 left-1/2 -translate-x-1/2"
        >
          <Sparkles className="h-8 w-8 text-amber-400" />
        </motion.div>

        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
        >
          <CheckCircle2 className="h-12 w-12 text-white" />
        </motion.div>
      </div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
          Tặng Thành Công! 🎉
        </h3>
        <p className="text-muted-foreground mt-2">
          Bạn đã lan tỏa{" "}
          <span className="font-bold text-foreground">
            {transaction.amount} {token.symbol}
          </span>{" "}
          đến @{receiver.username} 💖
        </p>
      </motion.div>

      {/* Transaction card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-500/20"
      >
        {/* Sender → Receiver */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <Avatar className="h-12 w-12 mx-auto ring-2 ring-purple-500/30">
              <AvatarImage src={sender.avatar || ""} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {sender.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs mt-1 text-muted-foreground">@{sender.username}</p>
          </div>

          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
          >
            →
          </motion.div>

          <div className="text-center">
            <Avatar className="h-12 w-12 mx-auto ring-2 ring-amber-500/30">
              <AvatarImage src={receiver.avatar || ""} />
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                {receiver.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs mt-1 text-muted-foreground">@{receiver.username}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-center gap-2 text-xl font-bold">
          {token.icon_url && (
            <img src={token.icon_url} alt={token.symbol} className="h-6 w-6" />
          )}
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            {transaction.amount} {token.symbol}
          </span>
        </div>

        {/* Message */}
        {message && (
          <div className="mt-3 p-3 bg-background/50 rounded-lg">
            <p className="text-sm italic">"{message}"</p>
          </div>
        )}

        {/* TX Hash */}
        {transaction.tx_hash && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>TX:</span>
            <a
              href={transaction.explorer_url || `https://bscscan.com/tx/${transaction.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {transaction.tx_hash.substring(0, 10)}...
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Receipt ID */}
        <div className="mt-2 text-xs text-muted-foreground">
          Mã biên nhận: <span className="font-mono">#{transaction.receipt_public_id}</span>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3"
      >
        <Button
          variant="outline"
          className="flex-1 hologram-input-trigger"
          onClick={handleCopyLink}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:opacity-90 text-white"
          onClick={handleShareToProfile}
          disabled={isSharing || hasShared}
        >
          {hasShared ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Đã chia sẻ
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              {isSharing ? "Đang chia sẻ..." : "Chia sẻ lên Profile"}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default DonationSuccessOverlay;
