import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Heart, Pin, MoreVertical, ChevronDown, ChevronUp, Pencil, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentContent } from "./CommentContent";
import { VideoCommentInput } from "./VideoCommentInput";
import type { VideoComment } from "@/hooks/useVideoComments";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VideoCommentItemProps {
  comment: VideoComment;
  videoOwnerId?: string;
  channelName?: string;
  isVideoOwner: boolean;
  onLike: (commentId: string) => void;
  onDislike: (commentId: string) => void;
  onReply: (content: string, parentId: string) => Promise<boolean>;
  onEdit: (commentId: string, content: string) => Promise<boolean>;
  onDelete: (commentId: string) => void;
  onHeart: (commentId: string) => Promise<boolean>;
  onPin: (commentId: string) => Promise<boolean>;
  onTimestampClick?: (seconds: number) => void;
  submitting?: boolean;
  isReply?: boolean;
}

export function VideoCommentItem({
  comment,
  videoOwnerId,
  channelName,
  isVideoOwner,
  onLike,
  onDislike,
  onReply,
  onEdit,
  onDelete,
  onHeart,
  onPin,
  onTimestampClick,
  submitting = false,
  isReply = false,
}: VideoCommentItemProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = user?.id === comment.user_id;
  const isCreator = comment.user_id === videoOwnerId;
  const canDelete = isOwner || isVideoOwner;
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
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  const navigateToChannel = () => {
    if (comment.channel?.id) {
      navigate(`/channel/${comment.channel.id}`);
    }
  };

  const handleReply = async (content: string) => {
    const success = await onReply(content, comment.id);
    if (success) {
      setIsReplying(false);
      setShowReplies(true);
    }
    return success;
  };

  const handleEdit = async () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }
    const success = await onEdit(comment.id, editContent);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className={cn("flex gap-3", isReply && "pl-0")}>
      {/* Pinned badge */}
      {comment.is_pinned && !isReply && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 -mt-2 w-full">
          <Pin className="h-3 w-3" />
          <span>Đã ghim bởi {channelName || "Chủ kênh"}</span>
        </div>
      )}

      {/* Avatar */}
      <Avatar
        className={cn("flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity", isReply ? "h-6 w-6" : "h-10 w-10")}
        onClick={navigateToChannel}
      >
        <AvatarImage src={comment.profiles.avatar_url || undefined} />
        <AvatarFallback className={cn("bg-primary text-primary-foreground", isReply && "text-xs")}>
          {(comment.profiles.display_name || comment.profiles.username)?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Header: Name, Creator badge, Time */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="font-semibold text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={navigateToChannel}
          >
            @{comment.profiles.username || comment.profiles.display_name || "người dùng"}
          </span>
          {isCreator && (
            <Badge variant="secondary" className="text-xs h-5 bg-muted/80">
              {channelName || "Chủ kênh"}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(comment.created_at)}
          </span>
          {comment.is_edited && (
            <span className="text-xs text-muted-foreground">(đã chỉnh sửa)</span>
          )}
        </div>

        {/* Content or Edit mode */}
        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-transparent border border-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
            <div className="flex gap-2 mt-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleEdit}>
                Lưu
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-foreground mb-2">
            <CommentContent content={comment.content} onTimestampClick={onTimestampClick} />
          </div>
        )}

        {/* Hearted by creator */}
        {comment.is_hearted && (
          <div className="flex items-center gap-1 text-xs text-destructive mb-2">
            <Heart className="h-3 w-3 fill-current" />
            <span>❤ Được yêu thích bởi {channelName || "Chủ kênh"}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 gap-1 rounded-full",
              comment.hasLiked && "text-primary"
            )}
            onClick={() => onLike(comment.id)}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", comment.hasLiked && "fill-current")} />
            <span className="text-xs">{comment.like_count || 0}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 rounded-full",
              comment.hasDisliked && "text-destructive"
            )}
            onClick={() => onDislike(comment.id)}
          >
            <ThumbsDown className={cn("h-3.5 w-3.5", comment.hasDisliked && "fill-current")} />
          </Button>

          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs rounded-full"
              onClick={() => setIsReplying(!isReplying)}
            >
              Phản hồi
            </Button>
          )}

          {/* Heart button for video owner */}
          {isVideoOwner && !isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 px-2 rounded-full", comment.is_hearted && "text-destructive")}
              onClick={() => onHeart(comment.id)}
              title={comment.is_hearted ? "Bỏ thích" : "Thả tim"}
            >
              <Heart className={cn("h-3.5 w-3.5", comment.is_hearted && "fill-current")} />
            </Button>
          )}

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              )}
              {isVideoOwner && !comment.parent_comment_id && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onPin(comment.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {comment.is_pinned ? "Bỏ ghim" : "Ghim bình luận"}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Flag className="h-4 w-4 mr-2" />
                Báo cáo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Reply Input */}
        <AnimatePresence>
          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <VideoCommentInput
                onSubmit={handleReply}
                placeholder={`Phản hồi @${comment.profiles.username || comment.profiles.display_name || "người dùng"}...`}
                autoFocus
                showCancel
                onCancel={() => setIsReplying(false)}
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
                      videoOwnerId={videoOwnerId}
                      channelName={channelName}
                      isVideoOwner={isVideoOwner}
                      onLike={onLike}
                      onDislike={onDislike}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onHeart={onHeart}
                      onPin={onPin}
                      onTimestampClick={onTimestampClick}
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
    </div>
  );
}
