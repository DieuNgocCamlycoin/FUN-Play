import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WatchHistoryVideo {
  id: string;
  video_id: string;
  last_position_seconds: number;
  watch_time_seconds: number;
  completed: boolean;
  watched_at: string;
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

export const useWatchHistory = () => {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryVideo[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchHistoryVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWatchHistory = useCallback(async () => {
    if (!user) {
      setWatchHistory([]);
      setContinueWatching([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select(`
          id,
          video_id,
          last_position_seconds,
          watch_time_seconds,
          completed,
          watched_at,
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
        .order('watched_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching watch history:', error);
        return;
      }

      const formattedData = (data || []).map(item => ({
        id: item.id,
        video_id: item.video_id,
        last_position_seconds: item.last_position_seconds,
        watch_time_seconds: item.watch_time_seconds,
        completed: item.completed,
        watched_at: item.watched_at,
        video: item.videos as any,
      })).filter(item => item.video);

      setWatchHistory(formattedData);

      // Continue watching: videos not completed (< 90% watched)
      const continueList = formattedData.filter(item => {
        if (!item.video?.duration || item.video.duration === 0) return false;
        const watchPercentage = (item.last_position_seconds / item.video.duration) * 100;
        return !item.completed && watchPercentage > 5 && watchPercentage < 90;
      });
      setContinueWatching(continueList);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchHistory();
  }, [fetchWatchHistory]);

  const updateWatchProgress = useCallback(async (
    videoId: string,
    positionSeconds: number,
    durationSeconds: number
  ) => {
    if (!user) return false;

    const watchPercentage = durationSeconds > 0 ? (positionSeconds / durationSeconds) * 100 : 0;
    const completed = watchPercentage >= 90;

    try {
      const { error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          last_position_seconds: Math.floor(positionSeconds),
          watch_time_seconds: Math.floor(positionSeconds),
          completed,
          watched_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,video_id',
        });

      if (error) {
        console.error('Error updating watch progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  }, [user]);

  const getLastPosition = useCallback((videoId: string): number => {
    const historyItem = watchHistory.find(item => item.video_id === videoId);
    return historyItem?.last_position_seconds || 0;
  }, [watchHistory]);

  const removeFromHistory = useCallback(async (videoId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) throw error;

      setWatchHistory(prev => prev.filter(item => item.video_id !== videoId));
      setContinueWatching(prev => prev.filter(item => item.video_id !== videoId));
      
      toast({
        title: 'Đã xóa khỏi lịch sử',
        description: 'Video đã được xóa khỏi lịch sử xem',
      });
      return true;
    } catch (error) {
      console.error('Error removing from history:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa video khỏi lịch sử',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  const clearAllHistory = useCallback(async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setWatchHistory([]);
      setContinueWatching([]);
      
      toast({
        title: 'Đã xóa toàn bộ lịch sử',
        description: 'Lịch sử xem video đã được xóa',
      });
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa lịch sử xem',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  return {
    watchHistory,
    continueWatching,
    loading,
    updateWatchProgress,
    getLastPosition,
    removeFromHistory,
    clearAllHistory,
    refetch: fetchWatchHistory,
  };
};
