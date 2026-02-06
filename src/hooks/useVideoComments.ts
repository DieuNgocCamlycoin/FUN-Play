import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAutoReward } from "@/hooks/useAutoReward";

export type SortType = "top" | "newest";

export interface VideoComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  dislike_count: number;
  user_id: string;
  video_id: string;
  parent_comment_id: string | null;
  is_pinned: boolean;
  is_hearted: boolean;
  hearted_by: string | null;
  hearted_at: string | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string;
  };
  channel?: {
    id: string;
    name: string;
  };
  replies?: VideoComment[];
  replyCount?: number;
  hasLiked?: boolean;
  hasDisliked?: boolean;
}

// Keep backward compat alias
export type SortBy = SortType;

interface UseVideoCommentsOptions {
  videoId: string;
  videoOwnerId?: string;
  onCommentCountChange?: (count: number) => void;
}

export function useVideoComments(optionsOrVideoId: UseVideoCommentsOptions | string | undefined) {
  // Support both old (string) and new (object) API
  const options: UseVideoCommentsOptions = typeof optionsOrVideoId === "string"
    ? { videoId: optionsOrVideoId }
    : optionsOrVideoId || { videoId: "" };

  const { videoId, videoOwnerId, onCommentCountChange } = options;

  const { user } = useAuth();
  const { toast } = useToast();
  const { awardCommentReward } = useAutoReward();

  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortType>("top");
  const [totalCount, setTotalCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments with profiles
  const fetchComments = useCallback(async () => {
    if (!videoId) return;

    setLoading(true);
    try {
      // Fetch parent comments
      let query = supabase
        .from("comments")
        .select("*")
        .eq("video_id", videoId)
        .is("parent_comment_id", null)
        .eq("is_deleted", false);

      if (sortBy === "top") {
        query = query
          .order("is_pinned", { ascending: false })
          .order("like_count", { ascending: false })
          .order("created_at", { ascending: false });
      } else {
        query = query
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });
      }

      const { data: parentComments, error } = await query;
      if (error) throw error;

      if (!parentComments || parentComments.length === 0) {
        setComments([]);
        setTotalCount(0);
        onCommentCountChange?.(0);
        setLoading(false);
        return;
      }

      // Get all user IDs
      const userIds = [...new Set(parentComments.map(c => c.user_id))];

      // Fetch all replies
      const { data: allReplies } = await supabase
        .from("comments")
        .select("*")
        .eq("video_id", videoId)
        .not("parent_comment_id", "is", null)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      // Get reply user IDs
      const replyUserIds = [...new Set(allReplies?.map(r => r.user_id) || [])];
      const allUserIds = [...new Set([...userIds, ...replyUserIds])];

      // Fetch profiles for all users
      const { data: allProfilesData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", allUserIds);

      const allProfilesMap = new Map(allProfilesData?.map(p => [p.id, p]) || []);

      // Fetch channels for all users
      const { data: allChannelsData } = await supabase
        .from("channels")
        .select("id, name, user_id")
        .in("user_id", allUserIds);

      const allChannelsByUserId = new Map(allChannelsData?.map(c => [c.user_id, c]) || []);

      // Fetch user's likes if logged in
      let userLikes = new Map<string, { isDislike: boolean }>();
      if (user) {
        const allCommentIds = [
          ...parentComments.map(c => c.id),
          ...(allReplies?.map(r => r.id) || [])
        ];

        if (allCommentIds.length > 0) {
          const { data: likesData } = await supabase
            .from("comment_likes")
            .select("comment_id, is_dislike")
            .eq("user_id", user.id)
            .in("comment_id", allCommentIds);

          userLikes = new Map(likesData?.map(l => [l.comment_id, { isDislike: l.is_dislike }]) || []);
        }
      }

      // Build comments with replies
      const commentsWithReplies: VideoComment[] = parentComments.map(comment => {
        const userLike = userLikes.get(comment.id);
        const userChannel = allChannelsByUserId.get(comment.user_id);

        const replies = (allReplies || [])
          .filter(r => r.parent_comment_id === comment.id)
          .map(reply => {
            const replyUserLike = userLikes.get(reply.id);
            const replyUserChannel = allChannelsByUserId.get(reply.user_id);

            return {
              ...reply,
              profiles: allProfilesMap.get(reply.user_id) || {
                id: reply.user_id,
                display_name: "User",
                avatar_url: null,
                username: "user"
              },
              channel: replyUserChannel ? {
                id: replyUserChannel.id,
                name: replyUserChannel.name
              } : undefined,
              hasLiked: replyUserLike ? !replyUserLike.isDislike : false,
              hasDisliked: replyUserLike?.isDislike || false,
            } as VideoComment;
          });

        return {
          ...comment,
          profiles: allProfilesMap.get(comment.user_id) || {
            id: comment.user_id,
            display_name: "User",
            avatar_url: null,
            username: "user"
          },
          channel: userChannel ? {
            id: userChannel.id,
            name: userChannel.name
          } : undefined,
          replies,
          replyCount: replies.length,
          hasLiked: userLike ? !userLike.isDislike : false,
          hasDisliked: userLike?.isDislike || false,
        } as VideoComment;
      });

      setComments(commentsWithReplies);

      // Calculate total count
      const total = commentsWithReplies.reduce((acc, c) => acc + 1 + (c.replyCount || 0), 0);
      setTotalCount(total);
      onCommentCountChange?.(total);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [videoId, sortBy, user, onCommentCountChange]);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription
  useEffect(() => {
    if (!videoId) return;

    const channel = supabase
      .channel(`video-comments-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `video_id=eq.${videoId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId, fetchComments]);

  // Add comment
  const addComment = async (content: string, parentId?: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để bình luận",
        variant: "destructive",
      });
      return false;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) return false;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        video_id: videoId,
        user_id: user.id,
        content: trimmedContent,
        parent_comment_id: parentId ?? null,
      });

      if (error) throw error;

      // Award CAMLY for parent comments only (min 5 words)
      if (!parentId) {
        const wordCount = trimmedContent.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount >= 5) {
          await awardCommentReward(videoId, trimmedContent);
        }
      }

      await fetchComments();
      return true;
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const editComment = async (commentId: string, newContent: string): Promise<boolean> => {
    if (!user) return false;

    const trimmedContent = newContent.trim();
    if (!trimmedContent) return false;

    try {
      const { error } = await supabase
        .from("comments")
        .update({
          content: trimmedContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchComments();
      toast({ title: "Đã cập nhật bình luận" });
      return true;
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete comment (soft delete)
  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const comment = comments.find(c => c.id === commentId) ||
        comments.flatMap(c => c.replies || []).find(r => r.id === commentId);

      const canDelete = comment?.user_id === user.id || videoOwnerId === user.id;
      if (!canDelete) {
        toast({
          title: "Không có quyền",
          description: "Bạn không thể xóa bình luận này",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from("comments")
        .update({ is_deleted: true })
        .eq("id", commentId);

      if (error) throw error;

      await fetchComments();
      toast({ title: "Đã xóa bình luận" });
      return true;
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle like with optimistic UI
  const toggleLike = async (commentId: string): Promise<void> => {
    if (!user) {
      toast({ title: "Vui lòng đăng nhập", variant: "destructive" });
      return;
    }

    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const wasLiked = c.hasLiked;
        const wasDisliked = c.hasDisliked;
        return {
          ...c,
          hasLiked: !wasLiked,
          hasDisliked: false,
          like_count: wasLiked ? c.like_count - 1 : c.like_count + 1,
          dislike_count: wasDisliked ? c.dislike_count - 1 : c.dislike_count,
        };
      }
      if (c.replies) {
        return {
          ...c,
          replies: c.replies.map(r => {
            if (r.id === commentId) {
              const wasLiked = r.hasLiked;
              const wasDisliked = r.hasDisliked;
              return {
                ...r,
                hasLiked: !wasLiked,
                hasDisliked: false,
                like_count: wasLiked ? r.like_count - 1 : r.like_count + 1,
                dislike_count: wasDisliked ? r.dislike_count - 1 : r.dislike_count,
              };
            }
            return r;
          }),
        };
      }
      return c;
    }));

    try {
      const { data: existing } = await supabase
        .from("comment_likes")
        .select("id, is_dislike")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        if (!existing.is_dislike) {
          // Remove like
          await supabase.from("comment_likes").delete().eq("id", existing.id);
        } else {
          // Change dislike to like
          await supabase.from("comment_likes").update({ is_dislike: false }).eq("id", existing.id);
        }
      } else {
        // Add like
        await supabase.from("comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
          is_dislike: false,
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      await fetchComments();
    }
  };

  // Toggle dislike with optimistic UI
  const toggleDislike = async (commentId: string): Promise<void> => {
    if (!user) {
      toast({ title: "Vui lòng đăng nhập", variant: "destructive" });
      return;
    }

    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const wasLiked = c.hasLiked;
        const wasDisliked = c.hasDisliked;
        return {
          ...c,
          hasLiked: false,
          hasDisliked: !wasDisliked,
          like_count: wasLiked ? c.like_count - 1 : c.like_count,
          dislike_count: wasDisliked ? c.dislike_count - 1 : c.dislike_count + 1,
        };
      }
      if (c.replies) {
        return {
          ...c,
          replies: c.replies.map(r => {
            if (r.id === commentId) {
              const wasLiked = r.hasLiked;
              const wasDisliked = r.hasDisliked;
              return {
                ...r,
                hasLiked: false,
                hasDisliked: !wasDisliked,
                like_count: wasLiked ? r.like_count - 1 : r.like_count,
                dislike_count: wasDisliked ? r.dislike_count - 1 : r.dislike_count + 1,
              };
            }
            return r;
          }),
        };
      }
      return c;
    }));

    try {
      const { data: existing } = await supabase
        .from("comment_likes")
        .select("id, is_dislike")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        if (existing.is_dislike) {
          await supabase.from("comment_likes").delete().eq("id", existing.id);
        } else {
          await supabase.from("comment_likes").update({ is_dislike: true }).eq("id", existing.id);
        }
      } else {
        await supabase.from("comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
          is_dislike: true,
        });
      }
    } catch (error) {
      console.error("Error toggling dislike:", error);
      await fetchComments();
    }
  };

  // Heart comment (creator only)
  const heartComment = async (commentId: string): Promise<boolean> => {
    if (!user || user.id !== videoOwnerId) {
      toast({
        title: "Không có quyền",
        description: "Chỉ chủ kênh mới có thể thả tim bình luận",
        variant: "destructive",
      });
      return false;
    }

    try {
      const comment = comments.find(c => c.id === commentId) ||
        comments.flatMap(c => c.replies || []).find(r => r.id === commentId);

      if (!comment) return false;

      const { error } = await supabase
        .from("comments")
        .update({
          is_hearted: !comment.is_hearted,
          hearted_by: !comment.is_hearted ? user.id : null,
          hearted_at: !comment.is_hearted ? new Date().toISOString() : null,
        })
        .eq("id", commentId);

      if (error) throw error;

      await fetchComments();
      return true;
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Pin comment (creator only)
  const pinComment = async (commentId: string): Promise<boolean> => {
    if (!user || user.id !== videoOwnerId) {
      toast({
        title: "Không có quyền",
        description: "Chỉ chủ kênh mới có thể ghim bình luận",
        variant: "destructive",
      });
      return false;
    }

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment || comment.parent_comment_id) {
        toast({
          title: "Không thể ghim",
          description: "Chỉ có thể ghim bình luận gốc",
          variant: "destructive",
        });
        return false;
      }

      // Unpin all other comments first
      if (!comment.is_pinned) {
        await supabase
          .from("comments")
          .update({ is_pinned: false })
          .eq("video_id", videoId)
          .eq("is_pinned", true);
      }

      const { error } = await supabase
        .from("comments")
        .update({ is_pinned: !comment.is_pinned })
        .eq("id", commentId);

      if (error) throw error;

      await fetchComments();
      toast({
        title: comment.is_pinned ? "Đã bỏ ghim bình luận" : "Đã ghim bình luận",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    comments,
    loading,
    sortBy,
    setSortBy,
    totalCount,
    submitting,
    addComment,
    // Keep backward compat
    createComment: addComment,
    editComment,
    deleteComment,
    softDeleteComment: deleteComment,
    toggleLike,
    toggleDislike,
    heartComment,
    pinComment,
    refetch: fetchComments,
    isVideoOwner: user?.id === videoOwnerId,
    // Backward compat - empty sets (new system uses hasLiked/hasDisliked on each comment)
    userLikes: new Set<string>(),
    userDislikes: new Set<string>(),
  };
}
