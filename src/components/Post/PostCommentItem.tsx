import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Reply, Trash2, MessageSquare, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PostCommentInput } from './PostCommentInput';
import { PostComment } from '@/hooks/usePostComments';
import { cn } from '@/lib/utils';
import { CommentLikesList } from './CommentLikesList';
import { CommentEmojiReaction } from './CommentEmojiReaction';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';

interface PostCommentItemProps {
  comment: PostComment;
  onReply: (content: string, parentId: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onToggleLike: (commentId: string, emoji?: string) => Promise<void>;
  isLiked: boolean;
  likedEmoji?: string;
  likedCommentIds: Set<string>;
  likedCommentEmojis: Map<string, string>;
  submitting?: boolean;
  isReply?: boolean;
}

export const PostCommentItem: React.FC<PostCommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  onToggleLike,
  isLiked,
  likedEmoji,
  likedCommentIds,
  likedCommentEmojis,
  submitting = false,
  isReply = false
}) => {
  const { user } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  const handleLikeClick = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await onToggleLike(comment.id);
    setIsLiking(false);
  };

  const handleEmojiReaction = async (emoji: string) => {
    if (isLiking) return;
    setIsLiking(true);
    await onToggleLike(comment.id, emoji);
    setIsLiking(false);
  };

  const isOwner = user?.id === comment.user_id;
  const displayName = comment.profiles?.display_name || comment.profiles?.username || 'Người dùng';
  const avatarUrl = comment.profiles?.avatar_url;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReply = async (content: string) => {
    const success = await onReply(content, comment.id);
    if (success) {
      setShowReplyInput(false);
    }
    return success;
  };

  // Render deleted comment placeholder
  if (comment.is_deleted) {
    return (
      <div className={cn(
        "flex gap-3 py-3",
        isReply && "ml-12"
      )}>
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground italic text-sm">
            Bình luận này đã bị xóa
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group",
        isReply && "ml-12"
      )}
    >
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-xs bg-primary/20 text-primary">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: vi
              })}
            </span>
          </div>

          <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2">
            {/* Like button */}
            <CommentLikesList commentId={comment.id} likeCount={comment.like_count}>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs transition-colors",
                    isLiked 
                      ? "text-red-500 hover:text-red-600" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={handleLikeClick}
                  disabled={isLiking}
                >
                  <motion.div
                    animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isLiked && likedEmoji ? (
                      <span className="text-sm mr-1">{likedEmoji}</span>
                    ) : (
                      <Heart 
                        className={cn(
                          "h-3.5 w-3.5 mr-1 transition-all",
                          isLiked && "fill-current"
                        )} 
                      />
                    )}
                  </motion.div>
                  {comment.like_count > 0 && (
                    <span className={cn(
                      "tabular-nums cursor-pointer hover:underline",
                      isLiked && "text-red-500"
                    )}>
                      {comment.like_count}
                    </span>
                  )}
                </Button>
              </motion.div>
            </CommentLikesList>

            {/* Emoji reaction picker */}
            <CommentEmojiReaction
              onEmojiSelect={handleEmojiReaction}
              selectedEmoji={isLiked ? likedEmoji : undefined}
            />

            {!isReply && user && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                <Reply className="h-3.5 w-3.5 mr-1" />
                Trả lời
              </Button>
            )}

            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Xóa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa bình luận?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bình luận sẽ được ẩn đi và hiển thị là "Bình luận này đã bị xóa".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(comment.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 overflow-hidden"
              >
                <PostCommentInput
                  onSubmit={handleReply}
                  submitting={submitting}
                  placeholder={`Trả lời ${displayName}...`}
                  autoFocus
                  showCancelButton
                  onCancel={() => setShowReplyInput(false)}
                  compact
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Replies */}
      {hasReplies && (
        <div className="ml-0">
          {comment.replies!.length > 2 && !showReplies && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-11 text-xs text-primary"
              onClick={() => setShowReplies(true)}
            >
              Xem {comment.replies!.length} phản hồi
            </Button>
          )}
          
          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {comment.replies!.map((reply) => (
                  <PostCommentItem
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    onDelete={onDelete}
                    onToggleLike={onToggleLike}
                    isLiked={likedCommentIds.has(reply.id)}
                    likedEmoji={likedCommentEmojis.get(reply.id)}
                    likedCommentIds={likedCommentIds}
                    likedCommentEmojis={likedCommentEmojis}
                    submitting={submitting}
                    isReply
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
