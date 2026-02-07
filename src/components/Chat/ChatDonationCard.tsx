import { Gift, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface ChatDonationCardProps {
  content: string | null;
  deepLink: string | null;
  isMe: boolean;
}

export const ChatDonationCard = ({
  content,
  deepLink,
  isMe,
}: ChatDonationCardProps) => {
  const navigate = useNavigate();

  const handleViewReceipt = () => {
    if (deepLink) {
      navigate(deepLink);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`max-w-[85%] ${isMe ? "ml-auto" : "mr-auto"}`}
    >
      <div className="relative p-4 rounded-2xl overflow-hidden">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-pink-400 to-purple-400 opacity-30" />
        <div className="absolute inset-[1px] bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 rounded-2xl" />
        
        {/* Content */}
        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-full bg-gradient-to-br from-amber-400 to-pink-400">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-pink-600">
              Thưởng & Tặng
            </span>
          </div>

          {/* Message content */}
          {content && (
            <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">
              {content}
            </p>
          )}

          {/* View receipt button */}
          {deepLink && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewReceipt}
              className="gap-2 border-amber-300 hover:border-amber-400 hover:bg-amber-50 text-amber-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Xem biên nhận
            </Button>
          )}
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
      </div>
    </motion.div>
  );
};
