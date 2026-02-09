import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  replies?: PostComment[];
}

interface UsePostCommentsReturn {
  comments: PostComment[];
  loading: boolean;
  submitting: boolean;
  likedCommentIds: Set<string>;
  likedCommentEmojis: Map<string, string>;
  fetchComments: () => Promise<void>;
  createComment: (content: string, parentId?: string | null) => Promise<boolean>;
  softDeleteComment: (commentId: string) => Promise<boolean>;
  toggleLike: (commentId: string, emoji?: string) => Promise<void>;
}

export const usePostComments = (postId: string): UsePostCommentsReturn => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [likedCommentEmojis, setLikedCommentEmojis] = useState<Map<string, string>>(new Map());
  const [likingCommentIds, setLikingCommentIds] = useState<Set<string>>(new Set());

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      const commentsWithProfiles: PostComment[] = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || undefined
      }));

      const rootComments: PostComment[] = [];
      const repliesMap: Record<string, PostComment[]> = {};

      commentsWithProfiles.forEach((comment) => {
        if (comment.parent_id) {
          if (!repliesMap[comment.parent_id]) {
            repliesMap[comment.parent_id] = [];
          }
          repliesMap[comment.parent_id].push(comment);
        } else {
          rootComments.push(comment);
        }
      });

      const commentsWithReplies = rootComments.map(comment => ({
        ...comment,
        replies: repliesMap[comment.id] || []
      }));

      setComments(commentsWithReplies);

      // Fetch user likes with emoji
      if (user) {
        const allCommentIds = commentsWithReplies.flatMap(c => [
          c.id,
          ...(c.replies?.map(r => r.id) || [])
        ]);
        
        if (allCommentIds.length > 0) {
          const { data: likesData } = await supabase
            .from('post_comment_likes')
            .select('comment_id, emoji')
            .eq('user_id', user.id)
            .in('comment_id', allCommentIds);
          
          if (likesData) {
            setLikedCommentIds(new Set(likesData.map(l => l.comment_id)));
            setLikedCommentEmojis(new Map(likesData.map(l => [l.comment_id, l.emoji || '❤️'])));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching post comments:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải bình luận",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  const createComment = useCallback(async (content: string, parentId?: string | null): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để bình luận",
        variant: "destructive"
      });
      return false;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast({
        title: "Lỗi",
        description: "Nội dung bình luận không được để trống",
        variant: "destructive"
      });
      return false;
    }

    if (trimmedContent.length > 1000) {
      toast({
        title: "Lỗi",
        description: "Bình luận không được vượt quá 1000 ký tự",
        variant: "destructive"
      });
      return false;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          parent_id: parentId || null,
          content: trimmedContent
        });

      if (error) throw error;

      await fetchComments();
      
      toast({
        title: "Thành công",
        description: "Đã đăng bình luận"
      });

      return true;
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: "Lỗi",
        description: "Không thể đăng bình luận",
        variant: "destructive"
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, postId, fetchComments]);

  const softDeleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchComments();
      
      toast({
        title: "Đã xóa",
        description: "Bình luận đã được xóa"
      });

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bình luận",
        variant: "destructive"
      });
      return false;
    }
  }, [user, fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  // Toggle like with emoji
  const toggleLike = useCallback(async (commentId: string, emoji: string = '❤️'): Promise<void> => {
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để thích bình luận",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (likingCommentIds.has(commentId)) return;

    const isLiked = likedCommentIds.has(commentId);
    
    // Optimistic UI update
    setLikedCommentIds(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    setLikedCommentEmojis(prev => {
      const newMap = new Map(prev);
      if (isLiked) {
        newMap.delete(commentId);
      } else {
        newMap.set(commentId, emoji);
      }
      return newMap;
    });

    const updateLikeCount = (cmts: PostComment[], delta: number): PostComment[] => {
      return cmts.map(c => {
        if (c.id === commentId) {
          return { ...c, like_count: Math.max(0, c.like_count + delta) };
        }
        if (c.replies) {
          return { ...c, replies: updateLikeCount(c.replies, delta) };
        }
        return c;
      });
    };
    
    setComments(prev => updateLikeCount(prev, isLiked ? -1 : 1));
    setLikingCommentIds(prev => new Set(prev).add(commentId));

    try {
      if (isLiked) {
        await supabase
          .from('post_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_comment_likes')
          .insert({ comment_id: commentId, user_id: user.id, emoji });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Rollback optimistic updates
      setLikedCommentIds(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(commentId);
        } else {
          newSet.delete(commentId);
        }
        return newSet;
      });
      setLikedCommentEmojis(prev => {
        const newMap = new Map(prev);
        if (isLiked) {
          newMap.set(commentId, emoji);
        } else {
          newMap.delete(commentId);
        }
        return newMap;
      });
      setComments(prev => updateLikeCount(prev, isLiked ? 1 : -1));
      
      toast({
        title: "Lỗi",
        description: "Không thể thực hiện thao tác này",
        variant: "destructive"
      });
    } finally {
      setLikingCommentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  }, [user, likedCommentIds, likingCommentIds, comments, navigate]);

  return {
    comments,
    loading,
    submitting,
    likedCommentIds,
    likedCommentEmojis,
    fetchComments,
    createComment,
    softDeleteComment,
    toggleLike
  };
};
