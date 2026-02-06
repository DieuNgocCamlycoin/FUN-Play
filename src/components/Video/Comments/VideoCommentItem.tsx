import { useState } from "react";
import { ThumbsUp, ThumbsDown, MoreVertical, ChevronDown, ChevronUp, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentContent } from "./CommentContent";
import { VideoCommentInput } from "./VideoCommentInput";
import type { VideoComment } from "@/hooks/useVideoComments";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VideoCommentItemProps {
  comment: VideoComment;
  isLiked: boolean;
  isDisliked: boolean;
  onLike: (commentId: string) => void;
  onDislike: (commentId: string) => void;
  onReply: (content: string, parentId: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onSeek?: (seconds: number) => void;
  isReply?: boolean;
  submitting?: boolean;
}

export function VideoCommentItem({
  comment,
  isLiked,
  isDisliked,
  onLike,
  onDislike,
  onReply,
  onDelete,
  onSeek,
  isReply = false,
  submitting = false,
}: VideoCommentItemProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === comment.user_id;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const handleProfileClick = async () => {
    try {
      const { data } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", comment.user_id)
        .maybeSingle();

      if (data) {
        navigate(`/channel/${data.id}`);
      }
    } catch (error) {
      console.error("Error navigating to channel:", error);
    }
  };

  const handleReplySubmit = async (content: string) => {
    const success = await onReply(content, comment.id);
    if (success) {
      setShowReplyInput(false);
    }
    return success;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(comment.id);
    setIsDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex gap-3", isReply && "pl-0")}
    >
      <Avatar className={cn("flex-shrink-0", isReply ? "h-6 w-6" : "h-10 w-10")}>
        <AvatarImage src={comment.profile.avatar_url || undefined} />
        <AvatarFallback className={cn("bg-primary text-primary-foreground", isReply && "text-xs")}>
          {(comment.profile.display_name || comment.profile.username)?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="font-semibold text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={handleProfileClick}
          >
            {comment.profile.display_name || comment.profile.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(comment.created_at)}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-xs text-muted-foreground">(đã chỉnh sửa)</span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-foreground mb-2">
          <CommentContent content={comment.content} onSeek={onSeek} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 gap-1 rounded-full",
              isLiked && "text-primary"
            )}
            onClick={() => onLike(comment.id)}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
            <span className="text-xs">{comment.like_count || 0}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 rounded-full",
              isDisliked && "text-destructive"
            )}
            onClick={() => onDislike(comment.id)}
          >
            <ThumbsDown className={cn("h-3.5 w-3.5", isDisliked && "fill-current")} />
          </Button>

          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs rounded-full"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              Phản hồi
            </Button>
          )}

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Reply Input */}
        <AnimatePresence>
          {showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <VideoCommentInput
                onSubmit={handleReplySubmit}
                placeholder={`Phản hồi @${comment.profile.username}...`}
                autoFocus
                onCancel={() => setShowReplyInput(false)}
                submitting={submitting}
                compact
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replies */}
        {hasReplies && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-primary hover:bg-primary/10 rounded-full"
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? (
                <ChevronUp className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1" />
              )}
              {comment.replies!.length} phản hồi
            </Button>

            <AnimatePresence>
              {showReplies && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-4 border-l-2 border-muted pl-3"
                >
                  {comment.replies!.map((reply) => (
                    <VideoCommentItem
                      key={reply.id}
                      comment={reply}
                      isLiked={false}
                      isDisliked={false}
                      onLike={onLike}
                      onDislike={onDislike}
                      onReply={onReply}
                      onDelete={onDelete}
                      onSeek={onSeek}
                      isReply
                      submitting={submitting}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
