import { VideoCommentItem } from "./VideoCommentItem";
import { VideoCommentInput } from "./VideoCommentInput";
import { CommentSortDropdown } from "./CommentSortDropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import type { VideoComment, SortType } from "@/hooks/useVideoComments";
import { useVideoComments } from "@/hooks/useVideoComments";
import { motion } from "framer-motion";

interface VideoCommentListProps {
  // New props-driven API
  comments?: VideoComment[];
  loading?: boolean;
  sortBy?: SortType;
  onSortChange?: (sort: SortType) => void;
  totalCount?: number;
  videoOwnerId?: string;
  channelName?: string;
  isVideoOwner?: boolean;
  onAddComment?: (content: string) => Promise<boolean>;
  onLike?: (commentId: string) => void;
  onDislike?: (commentId: string) => void;
  onReply?: (content: string, parentId: string) => Promise<boolean>;
  onEdit?: (commentId: string, content: string) => Promise<boolean>;
  onDelete?: (commentId: string) => void;
  onHeart?: (commentId: string) => Promise<boolean>;
  onPin?: (commentId: string) => Promise<boolean>;
  onTimestampClick?: (seconds: number) => void;
  submitting?: boolean;
  // Legacy API - just pass videoId and hook runs internally
  videoId?: string;
  onSeek?: (seconds: number) => void;
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function VideoCommentList(props: VideoCommentListProps) {
  // If only videoId is passed (legacy), use internal hook
  const internalHook = useVideoComments(
    props.videoId && !props.comments
      ? { videoId: props.videoId, videoOwnerId: props.videoOwnerId }
      : { videoId: "" }
  );

  const isLegacy = !!props.videoId && !props.comments;

  const comments = isLegacy ? internalHook.comments : (props.comments || []);
  const loading = isLegacy ? internalHook.loading : (props.loading || false);
  const sortBy = isLegacy ? internalHook.sortBy : (props.sortBy || "top");
  const onSortChange = isLegacy ? internalHook.setSortBy : props.onSortChange;
  const totalCount = isLegacy ? internalHook.totalCount : (props.totalCount || 0);
  const submitting = isLegacy ? internalHook.submitting : (props.submitting || false);
  const isVideoOwner = isLegacy ? internalHook.isVideoOwner : (props.isVideoOwner || false);
  const videoOwnerId = props.videoOwnerId;
  const channelName = props.channelName;

  const onAddComment = isLegacy ? internalHook.addComment : props.onAddComment;
  const onLike = isLegacy ? internalHook.toggleLike : props.onLike;
  const onDislike = isLegacy ? internalHook.toggleDislike : props.onDislike;
  const onReply = isLegacy
    ? (content: string, parentId: string) => internalHook.addComment(content, parentId)
    : props.onReply;
  const onEdit = isLegacy ? internalHook.editComment : props.onEdit;
  const onDelete = isLegacy
    ? (id: string) => { internalHook.deleteComment(id); }
    : props.onDelete;
  const onHeart = isLegacy ? internalHook.heartComment : props.onHeart;
  const onPin = isLegacy ? internalHook.pinComment : props.onPin;
  const onTimestampClick = props.onTimestampClick || props.onSeek;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with count and sort */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">
          {totalCount} bình luận
        </h2>
        {onSortChange && (
          <CommentSortDropdown
            sortBy={sortBy}
            onSortChange={onSortChange}
            commentCount={totalCount}
          />
        )}
      </div>

      {/* Add comment input */}
      {onAddComment && (
        <VideoCommentInput
          onSubmit={onAddComment}
          placeholder="Viết bình luận..."
          submitting={submitting}
        />
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">
            Chưa có bình luận nào
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Hãy là người đầu tiên bình luận về video này!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <VideoCommentItem
                comment={comment}
                videoOwnerId={videoOwnerId}
                channelName={channelName}
                isVideoOwner={isVideoOwner}
                onLike={onLike || (() => {})}
                onDislike={onDislike || (() => {})}
                onReply={onReply || (async () => false)}
                onEdit={onEdit || (async () => false)}
                onDelete={onDelete || (() => {})}
                onHeart={onHeart || (async () => false)}
                onPin={onPin || (async () => false)}
                onTimestampClick={onTimestampClick}
                submitting={submitting}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
