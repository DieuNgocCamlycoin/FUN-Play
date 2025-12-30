import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileHeader } from "@/components/Layout/MobileHeader";
import { MobileBottomNav } from "@/components/Layout/MobileBottomNav";
import { MobileDrawer } from "@/components/Layout/MobileDrawer";
import { CategoryChips } from "@/components/Layout/CategoryChips";
import { VideoCard } from "@/components/Video/VideoCard";
import { ContinueWatching } from "@/components/Video/ContinueWatching";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import { PullToRefreshIndicator } from "@/components/Layout/PullToRefreshIndicator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultThumbnail } from "@/lib/defaultThumbnails";

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
    username: string | null;
  };
}

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [currentMusicUrl, setCurrentMusicUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { successFeedback } = useHapticFeedback();

  // Fetch videos function (extracted for pull-to-refresh)
  const fetchVideos = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const { data, error } = await supabase
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
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        console.error("Error fetching videos:", error);
        toast({
          title: "Lỗi tải video",
          description: "Không thể tải danh sách video",
          variant: "destructive",
        });
        return;
      }

      // Fetch wallet addresses and avatars for all users
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(v => v.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, wallet_address, avatar_url, username")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, { wallet_address: p.wallet_address, avatar_url: p.avatar_url, username: p.username }]) || []);

        const videosWithProfiles = data.map(video => ({
          ...video,
          profiles: {
            wallet_address: profilesMap.get(video.user_id)?.wallet_address || null,
            avatar_url: profilesMap.get(video.user_id)?.avatar_url || null,
            username: profilesMap.get(video.user_id)?.username || null,
          },
        }));

        setVideos(videosWithProfiles);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingVideos(false);
    }
  }, [toast]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    successFeedback();
    await fetchVideos();
    toast({
      title: "Đã làm mới",
      description: "Danh sách video đã được cập nhật",
    });
  }, [fetchVideos, successFeedback, toast]);

  // Pull-to-refresh hook
  const { isPulling, isRefreshing, pullProgress, pullDistance, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    enabled: isMobile,
  });

  // Initial fetch and subscriptions
  useEffect(() => {
    fetchVideos();

    // Real-time subscription for profile updates (avatars, etc.)
    const profileChannel = supabase
      .channel('profile-updates-homepage')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Profile updated in real-time:', payload);
          // Update the specific user's profile in videos
          setVideos(prevVideos => 
            prevVideos.map(video => 
              video.user_id === payload.new.id
                ? {
                    ...video,
                    profiles: {
                      wallet_address: payload.new.wallet_address,
                      avatar_url: payload.new.avatar_url,
                      username: payload.new.username,
                    }
                  }
                : video
            )
          );
        }
      )
      .subscribe();

    // Real-time subscription for video updates (view counts, likes, etc.)
    const videoChannel = supabase
      .channel('video-updates-homepage')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
        },
        (payload) => {
          console.log('Video updated in real-time:', payload);
          setVideos(prevVideos => 
            prevVideos.map(video => 
              video.id === payload.new.id
                ? { ...video, view_count: payload.new.view_count }
                : video
            )
          );
        }
      )
      .subscribe();

    // Listen for profile-updated event to refetch videos to get updated avatars
    const handleProfileUpdate = () => {
      fetchVideos();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(videoChannel);
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [toast]);

  const handlePlayVideo = (videoId: string) => {
    navigate(`/watch/${videoId}`);
  };

  const formatViews = (views: number | null) => {
    if (!views) return "0 lượt xem";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M lượt xem`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K lượt xem`;
    return `${views} lượt xem`;
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "1 ngày trước";
    if (diffDays < 30) return `${diffDays} ngày trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background relative"
      style={{
        backgroundImage: 'url("/images/homepage-background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        imageRendering: 'crisp-edges',
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-cyan-50/5 to-white/10 dark:from-background/30 dark:via-cyan-950/10 dark:to-background/30" />
      
      {/* Main container */}
      <div 
        className="min-h-screen relative z-10"
        {...(isMobile ? pullHandlers : {})}
      >
        {/* Pull-to-refresh indicator */}
        {isMobile && (
          <PullToRefreshIndicator
            isPulling={isPulling}
            isRefreshing={isRefreshing}
            pullProgress={pullProgress}
            pullDistance={pullDistance}
          />
        )}

        {/* Desktop Header & Sidebar */}
        <div className="hidden lg:block">
          <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Mobile Header & Drawer */}
        <div className="lg:hidden">
          <MobileHeader onMenuClick={() => setIsMobileDrawerOpen(true)} />
          <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
          <MobileBottomNav />
        </div>
        
        {/* Main content */}
        <main className="pt-14 pb-20 lg:pb-0 lg:pl-64">
          <CategoryChips />
          
          {!user && (
            <div className="bg-muted/50 mx-4 mt-4 rounded-xl border border-border p-4">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-foreground font-medium text-center sm:text-left">
                  Đăng nhập để nhận phần thưởng CAMLY khi xem video!
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-cosmic-cyan hover:bg-cosmic-cyan/90 text-white"
                >
                  Đăng nhập / Đăng ký
                </Button>
              </div>
            </div>
          )}

          {/* Continue Watching Section */}
          {user && <ContinueWatching />}

          <div className="p-4">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <VideoCard key={i} isLoading={true} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    videoId={video.id}
                    thumbnail={video.thumbnail_url || undefined}
                    title={video.title}
                    channel={video.channels?.name || video.profiles?.username || "Unknown"}
                    avatarUrl={video.profiles?.avatar_url || undefined}
                    channelId={video.channels?.id}
                    userId={video.user_id}
                    views={formatViews(video.view_count)}
                    timestamp={formatTimestamp(video.created_at)}
                    onPlay={handlePlayVideo}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Background Music Player */}
        {user && (
          <BackgroundMusicPlayer 
            musicUrl={currentMusicUrl} 
            autoPlay={true}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
