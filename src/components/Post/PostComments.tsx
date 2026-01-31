import React, { useEffect } from 'react';
import { usePostComments } from '@/hooks/usePostComments';
import { PostCommentList } from './PostCommentList';
import { PostCommentInput } from './PostCommentInput';
import { MessageCircle } from 'lucide-react';

interface PostCommentsProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export const PostComments: React.FC<PostCommentsProps> = ({
  postId,
  onCommentCountChange
}) => {
  const {
    comments,
    loading,
    submitting,
    likedCommentIds,
    createComment,
    softDeleteComment,
    toggleLike
  } = usePostComments(postId);

  // Calculate total comment count (including replies)
  const totalCount = comments.reduce((acc, comment) => {
    const replyCount = comment.replies?.filter(r => !r.is_deleted).length || 0;
    return acc + (comment.is_deleted ? 0 : 1) + replyCount;
  }, 0);

  // Notify parent of count changes
  useEffect(() => {
    onCommentCountChange?.(totalCount);
  }, [totalCount, onCommentCountChange]);

  const handleCreateComment = async (content: string) => {
    return await createComment(content);
  };

  const handleReply = async (content: string, parentId: string) => {
    return await createComment(content, parentId);
  };

  const handleDelete = async (commentId: string) => {
    return await softDeleteComment(commentId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">
          Bình luận
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({totalCount})
            </span>
          )}
        </h3>
      </div>

      {/* Comment Input */}
      <PostCommentInput
        onSubmit={handleCreateComment}
        submitting={submitting}
        placeholder="Viết bình luận của bạn..."
      />

      {/* Comment List */}
      <PostCommentList
        comments={comments}
        loading={loading}
        onReply={handleReply}
        onDelete={handleDelete}
        onToggleLike={toggleLike}
        likedCommentIds={likedCommentIds}
        submitting={submitting}
      />
    </div>
  );
};
