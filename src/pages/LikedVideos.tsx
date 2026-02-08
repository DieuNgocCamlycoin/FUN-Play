import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { VideoCard } from "@/components/Video/VideoCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useVideoPlayback } from "@/contexts/VideoPlaybackContext";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Loader2, Play, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatViews, formatTimestamp } from "@/lib/formatters";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  view_count: number | null;
  duration: number | null;
  created_at: string;
  user_id: string;
  channels: {
    name: string;
    id: string;
  };
  profiles: {
    wallet_address: string | null;
    avatar_url: string | null;
  };
}

const LikedVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { createSession } = useVideoPlayback();

  const fetchLikedVideos = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("video_id")
        .eq("user_id", user.id)
        .eq("is_dislike", false)
        .not("video_id", "is", null);

      if (likesError) throw likesError;

      if (!likesData || likesData.length === 0) {
        setVideos([]);
        return;
      }

      const videoIds = likesData.map(l => l.video_id).filter(Boolean);

      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select(`
          id, title, thumbnail_url, video_url, view_count, duration, created_at, user_id,
          channels (name, id)
        `)
        .in("id", videoIds)
        .eq("is_public", true);

      if (videosError) throw videosError;

      if (videosData && videosData.length > 0) {
        const userIds = [...new Set(videosData.map(v => v.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, wallet_address, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.id, { wallet_address: p.wallet_address, avatar_url: p.avatar_url }]) || []
        );

        const videosWithProfiles = videosData.map(video => ({
          ...video,
          profiles: {
            wallet_address: profilesMap.get(video.user_id)?.wallet_address || null,
            avatar_url: profilesMap.get(video.user_id)?.avatar_url || null,
          },
        })) as Video[];

        setVideos(videosWithProfiles);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error("Error fetching liked videos:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách video đã thích",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchLikedVideos();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, fetchLikedVideos]);

  const handlePlayAll = async () => {
    if (videos.length === 0) return;
    await createSession(videos[0].id, 'HOME_FEED', undefined, videos);
    navigate(`/watch/${videos[0].id}`);
  };

  const handleShuffle = async () => {
    if (videos.length === 0) return;
    const shuffled = [...videos].sort(() => Math.random() - 0.5);
    await createSession(shuffled[0].id, 'HOME_FEED', undefined, shuffled);
    navigate(`/watch/${shuffled[0].id}`);
  };

  if (!authLoading && !user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Đăng nhập để xem video đã thích</h2>
          <p className="text-muted-foreground text-center mb-4">
            Bạn cần đăng nhập để lưu và xem lại các video yêu thích
          </p>
          <Button onClick={() => navigate("/auth")}>Đăng nhập</Button>
        </div>
      </MainLayout>
    );
  }

  const firstVideo = videos[0];

  return (
    <MainLayout>
      <div className="p-4 lg:p-6">
        {/* Hero Section */}
        {!loading && videos.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden mb-6">
            {/* Blurred background thumbnail */}
            <div className="absolute inset-0">
              {firstVideo?.thumbnail_url && (
                <img
                  src={firstVideo.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover blur-2xl scale-110 opacity-40"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/80 via-pink-500/60 to-purple-500/80" />
            </div>
            
            <div className="relative p-6 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-4 rounded-xl bg-white/20 backdrop-blur-sm">
                <Heart className="h-8 w-8 text-white" fill="white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Video đã thích</h1>
                <p className="text-white/80 mt-1">{videos.length} video</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handlePlayAll}
                  className="gap-2 bg-white text-black hover:bg-white/90 font-semibold"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Phát tất cả
                </Button>
                <Button
                  onClick={handleShuffle}
                  variant="outline"
                  className="gap-2 border-white/50 text-white hover:bg-white/20"
                >
                  <Shuffle className="h-4 w-4" />
                  Trộn bài
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Simple header for loading/empty */}
        {(loading || videos.length === 0) && (
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-pink-500">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Video đã thích</h1>
              <p className="text-muted-foreground">{videos.length} video</p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có video nào</h3>
            <p className="text-muted-foreground text-center">
              Bắt đầu thích các video để lưu lại và xem sau
            </p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Khám phá video
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                videoId={video.id}
                title={video.title}
                thumbnail={video.thumbnail_url || undefined}
                channel={video.channels?.name || "Kênh chưa xác định"}
                channelId={video.channels?.id}
                views={formatViews(video.view_count)}
                timestamp={formatTimestamp(video.created_at)}
                userId={video.user_id}
                avatarUrl={video.profiles?.avatar_url || undefined}
                duration={video.duration}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LikedVideos;
