import { Skeleton } from "@/components/ui/skeleton";
import { VideoCommentItem } from "./VideoCommentItem";
import { VideoCommentInput } from "./VideoCommentInput";
import { CommentSortDropdown } from "./CommentSortDropdown";
import { useVideoComments } from "@/hooks/useVideoComments";
import { useAutoReward } from "@/hooks/useAutoReward";

interface VideoCommentListProps {
  videoId: string;
  onSeek?: (seconds: number) => void;
}

export function VideoCommentList({ videoId, onSeek }: VideoCommentListProps) {
  const {
    comments,
    loading,
    submitting,
    sortBy,
    setSortBy,
    userLikes,
    userDislikes,
    totalCount,
    createComment,
    softDeleteComment,
    toggleLike,
    toggleDislike,
  } = useVideoComments(videoId);

  const { awardCommentReward } = useAutoReward();

  const handleSubmitComment = async (content: string) => {
    const success = await createComment(content);
    if (success) {
      // Award CAMLY for commenting
      await awardCommentReward(videoId, content);
    }
    return success;
  };

  const handleReply = async (content: string, parentId: string) => {
    return createComment(content, parentId);
  };

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
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">
          {totalCount} bình luận
        </h2>
        <CommentSortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      {/* Input */}
      <VideoCommentInput 
        onSubmit={handleSubmitComment} 
        submitting={submitting}
      />

      {/* Comments */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <VideoCommentItem
              key={comment.id}
              comment={comment}
              isLiked={userLikes.has(comment.id)}
              isDisliked={userDislikes.has(comment.id)}
              onLike={toggleLike}
              onDislike={toggleDislike}
              onReply={handleReply}
              onDelete={softDeleteComment}
              onSeek={onSeek}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
