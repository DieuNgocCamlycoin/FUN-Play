import { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostLike } from '@/hooks/usePostLike';
import { PostEmojiPicker } from './PostEmojiPicker';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PostReactionsProps {
  postId: string;
  initialLikeCount?: number;
  commentCount?: number;
  postContent?: string;
  onCommentToggle?: () => void;
  showCommentToggle?: boolean;
}

export const PostReactions = ({
  postId,
  initialLikeCount = 0,
  commentCount = 0,
  postContent,
  onCommentToggle,
  showCommentToggle = true
}: PostReactionsProps) => {
  const { isLiked, likeCount, selectedEmoji, toggleLike } = usePostLike(postId, initialLikeCount);
  const [justLiked, setJustLiked] = useState(false);

  const handleLike = async () => {
    if (!isLiked) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 600);
    }
    await toggleLike('❤️');
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (!isLiked || emoji !== selectedEmoji) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 600);
    }
    await toggleLike(emoji);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bài đăng trên FUN Play',
          text: postContent?.slice(0, 100) || '',
          url
        });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Đã sao chép",
        description: "Link bài đăng đã được sao chép"
      });
    }
  };

  return (
    <div className="flex items-center gap-1 pt-2 border-t border-border/50">
      {/* Like button */}
      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5 text-sm",
            isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={handleLike}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isLiked ? 'liked' : 'not-liked'}
              initial={justLiked ? { scale: 0.5 } : false}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {isLiked && selectedEmoji ? (
                <span className="text-base">{selectedEmoji}</span>
              ) : (
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              )}
            </motion.span>
          </AnimatePresence>
          {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
        </Button>
      </motion.div>

      {/* Emoji picker */}
      <PostEmojiPicker
        onEmojiSelect={handleEmojiSelect}
        selectedEmoji={isLiked ? selectedEmoji : null}
      />

      {/* Comment toggle */}
      {showCommentToggle && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          onClick={onCommentToggle}
        >
          <MessageCircle className="h-4 w-4" />
          {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
        </Button>
      )}

      {/* Share */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-sm text-muted-foreground hover:text-foreground ml-auto"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" />
        Chia sẻ
      </Button>
    </div>
  );
};
