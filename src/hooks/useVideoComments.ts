import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface CommentProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  profile: CommentProfile;
  replies?: VideoComment[];
}

export type SortBy = "top" | "newest";

interface UseVideoCommentsReturn {
  comments: VideoComment[];
  loading: boolean;
  submitting: boolean;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  userLikes: Set<string>;
  userDislikes: Set<string>;
  totalCount: number;
  createComment: (content: string, parentId?: string) => Promise<boolean>;
  updateComment: (commentId: string, content: string) => Promise<boolean>;
  softDeleteComment: (commentId: string) => Promise<boolean>;
  toggleLike: (commentId: string) => Promise<void>;
  toggleDislike: (commentId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVideoComments(videoId: string | undefined): UseVideoCommentsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userDislikes, setUserDislikes] = useState<Set<string>>(new Set());

  // Fetch comments with nested structure
  const fetchComments = useCallback(async () => {
    if (!videoId) return;
    
    setLoading(true);
    try {
      // Fetch all comments for this video
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("video_id", videoId)
        .order(sortBy === "top" ? "like_count" : "created_at", { ascending: sortBy === "top" ? false : false });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all users
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map<string, CommentProfile>(
        profilesData?.map(p => [p.id, p]) || []
      );

      // Build nested structure
      const commentsMap = new Map<string, VideoComment>();
      const rootComments: VideoComment[] = [];

      // First pass: create all comment objects
      commentsData.forEach(comment => {
        const profile = profilesMap.get(comment.user_id) || {
          id: comment.user_id,
          username: "user",
          display_name: "User",
          avatar_url: null,
        };

        const commentObj: VideoComment = {
          ...comment,
          profile,
          replies: [],
        };
        commentsMap.set(comment.id, commentObj);
      });

      // Second pass: organize into tree structure
      commentsData.forEach(comment => {
        const commentObj = commentsMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      // Sort replies by created_at ascending
      rootComments.forEach(comment => {
        if (comment.replies) {
          comment.replies.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
      });

      setComments(rootComments);

      // Fetch user's likes/dislikes
      if (user) {
        const allCommentIds = commentsData.map(c => c.id);
        const { data: likesData } = await supabase
          .from("likes")
          .select("comment_id, is_dislike")
          .eq("user_id", user.id)
          .in("comment_id", allCommentIds);

        const likes = new Set<string>();
        const dislikes = new Set<string>();
        
        likesData?.forEach(like => {
          if (like.comment_id) {
            if (like.is_dislike) {
              dislikes.add(like.comment_id);
            } else {
              likes.add(like.comment_id);
            }
          }
        });

        setUserLikes(likes);
        setUserDislikes(dislikes);
      }
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Lỗi tải bình luận",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [videoId, sortBy, user, toast]);

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
          // Debounced refetch on any change
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId, fetchComments]);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Create comment
  const createComment = useCallback(async (content: string, parentId?: string): Promise<boolean> => {
    if (!user || !videoId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để bình luận",
        variant: "destructive",
      });
      return false;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        video_id: videoId,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parentId || null,
      });

      if (error) throw error;

      // Update video comment count
      if (!parentId) {
        await supabase.rpc('increment_comment_count', { vid: videoId }).catch(() => {
          // Fallback: manual update
          supabase
            .from("videos")
            .select("comment_count")
            .eq("id", videoId)
            .single()
            .then(({ data }) => {
              if (data) {
                supabase
                  .from("videos")
                  .update({ comment_count: (data.comment_count || 0) + 1 })
                  .eq("id", videoId);
              }
            });
        });
      }

      toast({
        title: "Thành công",
        description: parentId ? "Đã gửi phản hồi" : "Đã đăng bình luận",
      });

      return true;
    } catch (error: any) {
      console.error("Error creating comment:", error);
      toast({
        title: "Lỗi đăng bình luận",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, videoId, toast]);

  // Update comment
  const updateComment = useCallback(async (commentId: string, content: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("comments")
        .update({ content: content.trim(), updated_at: new Date().toISOString() })
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật bình luận",
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
  }, [user, toast]);

  // Soft delete (actually delete since we don't have is_deleted column for video comments)
  const softDeleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Đã xóa",
        description: "Bình luận đã được xóa",
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
  }, [user, toast]);

  // Toggle like with optimistic UI
  const toggleLike = useCallback(async (commentId: string) => {
    if (!user) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập",
        variant: "destructive",
      });
      return;
    }

    const isLiked = userLikes.has(commentId);
    const isDisliked = userDislikes.has(commentId);

    // Optimistic update
    setUserLikes(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });

    if (isDisliked) {
      setUserDislikes(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }

    // Update like_count optimistically
    setComments(prev => updateLikeCount(prev, commentId, isLiked ? -1 : 1));

    try {
      if (isLiked) {
        // Remove like
        await supabase
          .from("likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id)
          .eq("is_dislike", false);
      } else {
        // Remove dislike if exists
        if (isDisliked) {
          await supabase
            .from("likes")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", user.id)
            .eq("is_dislike", true);
        }

        // Add like
        await supabase.from("likes").insert({
          comment_id: commentId,
          user_id: user.id,
          is_dislike: false,
        });
      }

      // Update like_count in database
      const delta = isLiked ? -1 : (isDisliked ? 2 : 1);
      const comment = findComment(comments, commentId);
      if (comment) {
        await supabase
          .from("comments")
          .update({ like_count: Math.max(0, (comment.like_count || 0) + delta) })
          .eq("id", commentId);
      }
    } catch (error) {
      // Revert on error
      fetchComments();
    }
  }, [user, userLikes, userDislikes, comments, fetchComments, toast]);

  // Toggle dislike with optimistic UI
  const toggleDislike = useCallback(async (commentId: string) => {
    if (!user) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập",
        variant: "destructive",
      });
      return;
    }

    const isLiked = userLikes.has(commentId);
    const isDisliked = userDislikes.has(commentId);

    // Optimistic update
    setUserDislikes(prev => {
      const next = new Set(prev);
      if (isDisliked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });

    if (isLiked) {
      setUserLikes(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      // Update like_count (remove the like)
      setComments(prev => updateLikeCount(prev, commentId, -1));
    }

    try {
      if (isDisliked) {
        // Remove dislike
        await supabase
          .from("likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id)
          .eq("is_dislike", true);
      } else {
        // Remove like if exists
        if (isLiked) {
          await supabase
            .from("likes")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", user.id)
            .eq("is_dislike", false);

          // Update like_count in database
          const comment = findComment(comments, commentId);
          if (comment) {
            await supabase
              .from("comments")
              .update({ like_count: Math.max(0, (comment.like_count || 0) - 1) })
              .eq("id", commentId);
          }
        }

        // Add dislike
        await supabase.from("likes").insert({
          comment_id: commentId,
          user_id: user.id,
          is_dislike: true,
        });
      }
    } catch (error) {
      // Revert on error
      fetchComments();
    }
  }, [user, userLikes, userDislikes, comments, fetchComments, toast]);

  const totalCount = useMemo(() => {
    let count = comments.length;
    comments.forEach(c => {
      count += c.replies?.length || 0;
    });
    return count;
  }, [comments]);

  return {
    comments,
    loading,
    submitting,
    sortBy,
    setSortBy,
    userLikes,
    userDislikes,
    totalCount,
    createComment,
    updateComment,
    softDeleteComment,
    toggleLike,
    toggleDislike,
    refetch: fetchComments,
  };
}

// Helper functions
function findComment(comments: VideoComment[], id: string): VideoComment | undefined {
  for (const comment of comments) {
    if (comment.id === id) return comment;
    if (comment.replies) {
      const found = findComment(comment.replies, id);
      if (found) return found;
    }
  }
  return undefined;
}

function updateLikeCount(comments: VideoComment[], id: string, delta: number): VideoComment[] {
  return comments.map(comment => {
    if (comment.id === id) {
      return { ...comment, like_count: Math.max(0, (comment.like_count || 0) + delta) };
    }
    if (comment.replies) {
      return { ...comment, replies: updateLikeCount(comment.replies, id, delta) };
    }
    return comment;
  });
}
