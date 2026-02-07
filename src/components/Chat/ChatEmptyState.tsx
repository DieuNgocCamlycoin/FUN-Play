import { MessageCircle, Heart } from "lucide-react";
import { motion } from "framer-motion";

export const ChatEmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-cyan-50/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8"
      >
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 opacity-20 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-200/50 flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-purple-500" />
            <Heart className="absolute -bottom-1 -right-1 w-6 h-6 text-pink-500 fill-pink-500" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          Tin nhắn yêu thương
        </h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Chọn một cuộc trò chuyện để bắt đầu nhắn tin hoặc tặng thưởng cho bạn bè
        </p>
      </motion.div>
    </div>
  );
};
