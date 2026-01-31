import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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
  fetchComments: () => Promise<void>;
  createComment: (content: string, parentId?: string | null) => Promise<boolean>;
  softDeleteComment: (commentId: string) => Promise<boolean>;
}

export const usePostComments = (postId: string): UsePostCommentsReturn => {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all comments for the post
  const fetchComments = useCallback(async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      
      // Fetch comments
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

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      // Fetch profiles for all commenters
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create profiles lookup map
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      // Attach profiles to comments
      const commentsWithProfiles: PostComment[] = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || undefined
      }));

      // Organize into root comments and replies
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

      // Attach replies to their parent comments
      const commentsWithReplies = rootComments.map(comment => ({
        ...comment,
        replies: repliesMap[comment.id] || []
      }));

      setComments(commentsWithReplies);
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
  }, [postId]);

  // Create a new comment
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

      // Refresh comments after successful insert
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

  // Soft delete a comment
  const softDeleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh comments
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

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription
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
          // Refetch on any change
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  return {
    comments,
    loading,
    submitting,
    fetchComments,
    createComment,
    softDeleteComment
  };
};
