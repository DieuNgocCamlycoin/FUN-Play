import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface PlaylistVideo {
  id: string;
  position: number;
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    video_url: string;
    duration: number | null;
    view_count: number | null;
    channel_id: string;
    channel_name?: string;
  };
}

export interface PlaylistWithVideos {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  videos: PlaylistVideo[];
  video_count: number;
  total_duration: number;
  owner?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function usePlaylistOperations() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch playlist with all videos
  const fetchPlaylist = useCallback(async (playlistId: string): Promise<PlaylistWithVideos | null> => {
    try {
      setLoading(true);
      
      // Fetch playlist info
      const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (playlistError) throw playlistError;

      // Fetch owner info
      const { data: owner } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", playlist.user_id)
        .single();

      // Fetch playlist videos with video details
      const { data: playlistVideos, error: videosError } = await supabase
        .from("playlist_videos")
        .select(`
          id,
          position,
          videos (
            id, title, thumbnail_url, video_url, duration, view_count, channel_id,
            channels (name)
          )
        `)
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      if (videosError) throw videosError;

      const videos: PlaylistVideo[] = (playlistVideos || [])
        .filter(pv => pv.videos)
        .map(pv => ({
          id: pv.id,
          position: pv.position,
          video: {
            id: (pv.videos as any).id,
            title: (pv.videos as any).title,
            thumbnail_url: (pv.videos as any).thumbnail_url,
            video_url: (pv.videos as any).video_url,
            duration: (pv.videos as any).duration,
            view_count: (pv.videos as any).view_count,
            channel_id: (pv.videos as any).channel_id,
            channel_name: (pv.videos as any).channels?.name,
          },
        }));

      const totalDuration = videos.reduce((sum, v) => sum + (v.video.duration || 0), 0);

      return {
        ...playlist,
        videos,
        video_count: videos.length,
        total_duration: totalDuration,
        owner: owner || undefined,
      };
    } catch (error: any) {
      console.error("Error fetching playlist:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phát",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Add video to playlist
  const addVideoToPlaylist = useCallback(async (playlistId: string, videoId: string): Promise<boolean> => {
    try {
      // Get max position
      const { data: maxPos } = await supabase
        .from("playlist_videos")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1)
        .single();

      const newPosition = (maxPos?.position || 0) + 1;

      const { error } = await supabase
        .from("playlist_videos")
        .insert({
          playlist_id: playlistId,
          video_id: videoId,
          position: newPosition,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Thông báo",
            description: "Video đã có trong danh sách phát",
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "Thành công",
        description: "Đã thêm video vào danh sách phát",
      });
      return true;
    } catch (error: any) {
      console.error("Error adding video to playlist:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm video vào danh sách phát",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Remove video from playlist
  const removeVideoFromPlaylist = useCallback(async (playlistId: string, videoId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("playlist_videos")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("video_id", videoId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa video khỏi danh sách phát",
      });
      return true;
    } catch (error: any) {
      console.error("Error removing video from playlist:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa video khỏi danh sách phát",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Reorder videos in playlist
  const reorderPlaylistVideos = useCallback(async (
    playlistId: string, 
    videos: { video_id: string; position: number }[]
  ): Promise<boolean> => {
    try {
      // Update all positions in a single transaction-like pattern
      for (const item of videos) {
        const { error } = await supabase
          .from("playlist_videos")
          .update({ position: item.position })
          .eq("playlist_id", playlistId)
          .eq("video_id", item.video_id);

        if (error) throw error;
      }

      return true;
    } catch (error: any) {
      console.error("Error reordering playlist:", error);
      toast({
        title: "Lỗi",
        description: "Không thể sắp xếp lại danh sách phát",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Fetch user's playlists (for Add to Playlist modal)
  const fetchUserPlaylists = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name, is_public")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching user playlists:", error);
      return [];
    }
  }, [user]);

  // Create playlist and optionally add video
  const createPlaylistWithVideo = useCallback(async (
    name: string, 
    videoId?: string,
    isPublic: boolean = true
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data: playlist, error: createError } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          name,
          is_public: isPublic,
        })
        .select("id")
        .single();

      if (createError) throw createError;

      if (videoId && playlist) {
        await addVideoToPlaylist(playlist.id, videoId);
      }

      toast({
        title: "Thành công",
        description: videoId ? "Đã tạo danh sách phát và thêm video" : "Đã tạo danh sách phát",
      });

      return playlist?.id || null;
    } catch (error: any) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo danh sách phát",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, addVideoToPlaylist]);

  return {
    loading,
    fetchPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    reorderPlaylistVideos,
    fetchUserPlaylists,
    createPlaylistWithVideo,
  };
}
