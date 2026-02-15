import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { VideoCard } from "@/components/Video/VideoCard";
import { Video, Zap } from "lucide-react";
import { formatViews, formatTimestamp } from "@/lib/formatters";

interface ProfileVideosTabProps {
  userId: string;
  channelId?: string;
  type: "video" | "shorts";
}

interface VideoData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  view_count: number;
  created_at: string;
  duration: number | null;
  user_id: string;
  channel_id: string | null;
  channels: { name: string; id: string; is_verified?: boolean } | null;
  avatarUrl?: string | null;
}

export const ProfileVideosTab = ({ userId, channelId, type }: ProfileVideosTabProps) => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [userId, channelId, type]);

  const fetchVideos = async () => {
    try {
      let query = supabase
        .from("videos")
        .select("id, title, thumbnail_url, video_url, view_count, created_at, duration, user_id, channel_id, channels(name, id, is_verified)")
        .eq("is_public", true)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });

      // Filter by channel or user
      if (channelId) {
        query = query.eq("channel_id", channelId);
      } else {
        query = query.eq("user_id", userId);
      }

      // Filter by type (shorts are videos up to 180 seconds, duration-only)
      if (type === "shorts") {
        query = query.not('duration', 'is', null).lte('duration', 180);
      } else {
        query = query.or("duration.gt.180,duration.is.null");
      }

      const { data, error } = await query;
      if (error) throw error;

      // Batch-fetch profile avatars for video owners
      const userIds = [...new Set((data || []).map(v => v.user_id))];
      let avatarMap = new Map<string, string | null>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, avatar_url")
          .in("id", userIds);
        profiles?.forEach(p => avatarMap.set(p.id, p.avatar_url));
      }

      setVideos((data || []).map(v => ({ ...v, avatarUrl: avatarMap.get(v.user_id) || null })));
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-muted rounded-xl mb-2" />
            <div className="h-4 bg-muted rounded w-3/4 mb-1" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const Icon = type === "shorts" ? Zap : Video;
  const emptyTitle = type === "shorts" ? "Chưa có Shorts" : "Chưa có Video";
  const emptyDesc = type === "shorts" 
    ? "Chưa có video ngắn nào được đăng."
    : "Chưa có video nào được đăng.";

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/20 to-[hsl(var(--cosmic-magenta))]/20 flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground text-sm">{emptyDesc}</p>
      </div>
    );
  }

  // Shorts: YouTube-style compact vertical grid
  if (type === "shorts") {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {videos.map((video) => (
          <div
            key={video.id}
            className="cursor-pointer group"
            onClick={() => navigate(`/watch/${video.id}`)}
          >
            <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <p className="text-xs mt-1 line-clamp-1 text-foreground">{video.title}</p>
            <p className="text-xs text-muted-foreground">{formatViews(video.view_count)}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          videoId={video.id}
          title={video.title}
          thumbnail={video.thumbnail_url || ""}
          channel={video.channels?.name || undefined}
          channelId={video.channels?.id || video.channel_id || undefined}
          userId={video.user_id}
          views={formatViews(video.view_count)}
          timestamp={formatTimestamp(video.created_at)}
          duration={video.duration}
          videoUrl={video.video_url || undefined}
          isVerified={video.channels?.is_verified || false}
          avatarUrl={video.avatarUrl || undefined}
        />
      ))}
    </div>
  );
};
