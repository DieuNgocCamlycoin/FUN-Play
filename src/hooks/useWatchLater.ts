import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WatchLaterVideo {
  id: string;
  video_id: string;
  added_at: string;
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    video_url: string;
    view_count: number | null;
    duration: number | null;
    created_at: string;
    channels: {
      id: string;
      name: string;
      is_verified?: boolean;
    };
  };
}

export const useWatchLater = () => {
  const [watchLaterList, setWatchLaterList] = useState<WatchLaterVideo[]>([]);
  const [watchLaterIds, setWatchLaterIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWatchLater = useCallback(async () => {
    if (!user) {
      setWatchLaterList([]);
      setWatchLaterIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('watch_later')
        .select(`
          id,
          video_id,
          added_at,
          videos (
            id,
            title,
            thumbnail_url,
            video_url,
            view_count,
            duration,
            created_at,
            channels (
              id,
              name,
              is_verified
            )
          )
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error fetching watch later:', error);
        return;
      }

      const formattedData = (data || []).map(item => ({
        id: item.id,
        video_id: item.video_id,
        added_at: item.added_at,
        video: item.videos as any,
      })).filter(item => item.video);

      setWatchLaterList(formattedData);
      setWatchLaterIds(new Set(formattedData.map(item => item.video_id)));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchLater();
  }, [fetchWatchLater]);

  const addToWatchLater = useCallback(async (videoId: string) => {
    if (!user) {
      toast({
        title: 'Vui lòng đăng nhập',
        description: 'Bạn cần đăng nhập để thêm video vào Watch Later',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('watch_later')
        .insert({
          user_id: user.id,
          video_id: videoId,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Đã có trong danh sách',
            description: 'Video này đã được thêm vào Watch Later',
          });
          return false;
        }
        throw error;
      }

      setWatchLaterIds(prev => new Set([...prev, videoId]));
      toast({
        title: 'Đã thêm vào Watch Later',
        description: 'Video đã được lưu để xem sau',
      });
      fetchWatchLater();
      return true;
    } catch (error) {
      console.error('Error adding to watch later:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm video vào Watch Later',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, fetchWatchLater]);

  const removeFromWatchLater = useCallback(async (videoId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('watch_later')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) throw error;

      setWatchLaterIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
      setWatchLaterList(prev => prev.filter(item => item.video_id !== videoId));
      
      toast({
        title: 'Đã xóa khỏi Watch Later',
        description: 'Video đã được xóa khỏi danh sách',
      });
      return true;
    } catch (error) {
      console.error('Error removing from watch later:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa video khỏi Watch Later',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  const toggleWatchLater = useCallback(async (videoId: string) => {
    if (watchLaterIds.has(videoId)) {
      return removeFromWatchLater(videoId);
    } else {
      return addToWatchLater(videoId);
    }
  }, [watchLaterIds, addToWatchLater, removeFromWatchLater]);

  const isInWatchLater = useCallback((videoId: string) => {
    return watchLaterIds.has(videoId);
  }, [watchLaterIds]);

  return {
    watchLaterList,
    watchLaterIds,
    loading,
    addToWatchLater,
    removeFromWatchLater,
    toggleWatchLater,
    isInWatchLater,
    refetch: fetchWatchLater,
  };
};
