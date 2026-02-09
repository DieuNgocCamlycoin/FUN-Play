import React from 'react';
import { PostComment } from '@/hooks/usePostComments';
import { PostCommentItem } from './PostCommentItem';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostCommentListProps {
  comments: PostComment[];
  loading: boolean;
  onReply: (content: string, parentId: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onToggleLike: (commentId: string, emoji?: string) => Promise<void>;
  likedCommentIds: Set<string>;
  likedCommentEmojis: Map<string, string>;
  submitting?: boolean;
}

export const PostCommentList: React.FC<PostCommentListProps> = ({
  comments,
  loading,
  onReply,
  onDelete,
  onToggleLike,
  likedCommentIds,
  likedCommentEmojis,
  submitting = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Chưa có bình luận nào</p>
        <p className="text-xs mt-1">Hãy là người đầu tiên bình luận!</p>
      </motion.div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {comments.map((comment) => (
        <PostCommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onDelete={onDelete}
          onToggleLike={onToggleLike}
          isLiked={likedCommentIds.has(comment.id)}
          likedEmoji={likedCommentEmojis.get(comment.id)}
          likedCommentIds={likedCommentIds}
          likedCommentEmojis={likedCommentEmojis}
          submitting={submitting}
        />
      ))}
    </div>
  );
};
