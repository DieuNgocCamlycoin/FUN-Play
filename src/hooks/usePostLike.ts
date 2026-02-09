import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface UsePostLikeReturn {
  isLiked: boolean;
  likeCount: number;
  selectedEmoji: string | null;
  toggleLike: (emoji?: string) => Promise<void>;
  loading: boolean;
}

export const usePostLike = (postId: string, initialLikeCount?: number): UsePostLikeReturn => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount || 0);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !postId) return;
    const fetchLikeStatus = async () => {
      const { data } = await supabase
        .from('post_likes')
        .select('id, emoji')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setIsLiked(true);
        setSelectedEmoji(data.emoji);
      }
    };
    fetchLikeStatus();
  }, [user, postId]);

  useEffect(() => {
    if (initialLikeCount !== undefined) setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const toggleLike = useCallback(async (emoji: string = '❤️') => {
    if (!user) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để thích bài đăng",
        variant: "destructive"
      });
      return;
    }
    if (loading) return;
    setLoading(true);

    const wasLiked = isLiked;
    const prevEmoji = selectedEmoji;
    const prevCount = likeCount;

    // Optimistic update
    if (wasLiked && emoji === prevEmoji) {
      setIsLiked(false);
      setSelectedEmoji(null);
      setLikeCount(prev => Math.max(0, prev - 1));
    } else if (wasLiked && emoji !== prevEmoji) {
      setSelectedEmoji(emoji);
    } else {
      setIsLiked(true);
      setSelectedEmoji(emoji);
      setLikeCount(prev => prev + 1);
    }

    try {
      if (wasLiked && emoji === prevEmoji) {
        await supabase.from('post_likes').delete()
          .eq('post_id', postId).eq('user_id', user.id);
      } else if (wasLiked && emoji !== prevEmoji) {
        await supabase.from('post_likes').update({ emoji })
          .eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: user.id,
          emoji
        });
      }
    } catch (error) {
      setIsLiked(wasLiked);
      setSelectedEmoji(prevEmoji);
      setLikeCount(prevCount);
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  }, [user, postId, isLiked, selectedEmoji, likeCount, loading]);

  return { isLiked, likeCount, selectedEmoji, toggleLike, loading };
};
