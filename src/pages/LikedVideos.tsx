import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { VideoCard } from "@/components/Video/VideoCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  view_count: number | null;
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

  const fetchLikedVideos = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get liked video IDs
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

      // Fetch video details
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          thumbnail_url,
          video_url,
          view_count,
          created_at,
          user_id,
          channels (
            name,
            id
          )
        `)
        .in("id", videoIds)
        .eq("is_public", true);

      if (videosError) throw videosError;

      if (videosData && videosData.length > 0) {
        // Fetch profiles for wallet_address and avatar
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

  // Not logged in state
  if (!authLoading && !user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Đăng nhập để xem video đã thích</h2>
          <p className="text-muted-foreground text-center mb-4">
            Bạn cần đăng nhập để lưu và xem lại các video yêu thích
          </p>
          <Button onClick={() => navigate("/auth")}>
            Đăng nhập
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-pink-500">
            <Heart className="h-6 w-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Video đã thích</h1>
            <p className="text-muted-foreground">
              {videos.length} video
            </p>
          </div>
        </div>

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
                thumbnail={video.thumbnail_url || "/placeholder.svg"}
                channel={video.channels?.name || "Unknown"}
                channelId={video.channels?.id}
                views={String(video.view_count || 0)}
                timestamp={video.created_at}
                userId={video.user_id}
                avatarUrl={video.profiles?.avatar_url || undefined}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LikedVideos;
