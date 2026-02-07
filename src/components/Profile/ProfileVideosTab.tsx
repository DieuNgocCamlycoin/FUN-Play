import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { VideoCard } from "@/components/Video/VideoCard";
import { Video, Zap } from "lucide-react";

interface ProfileVideosTabProps {
  userId: string;
  channelId?: string;
  type: "video" | "shorts";
}

interface VideoData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
  duration: number | null;
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
        .select("id, title, thumbnail_url, view_count, created_at, duration")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      // Filter by channel or user
      if (channelId) {
        query = query.eq("channel_id", channelId);
      } else {
        query = query.eq("user_id", userId);
      }

      // Filter by type (shorts are typically under 60 seconds)
      if (type === "shorts") {
        query = query.lt("duration", 60);
      } else {
        query = query.or("duration.gte.60,duration.is.null");
      }

      const { data, error } = await query;
      if (error) throw error;
      setVideos(data || []);
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          videoId={video.id}
          title={video.title}
          thumbnail={video.thumbnail_url || ""}
          views={`${(video.view_count || 0).toLocaleString()} lượt xem`}
          timestamp={video.created_at}
        />
      ))}
    </div>
  );
};
