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
import { EnhancedHonobar } from "@/components/Layout/EnhancedHonobar";
import { MobileHonobar } from "@/components/Layout/MobileHonobar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";


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
        .eq("approval_status", "approved")
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
          .select("id, wallet_address, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, { wallet_address: p.wallet_address, avatar_url: p.avatar_url }]) || []);

        const videosWithProfiles = data.map(video => ({
          ...video,
          profiles: {
            wallet_address: profilesMap.get(video.user_id)?.wallet_address || null,
            avatar_url: profilesMap.get(video.user_id)?.avatar_url || null,
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
    if (!views) return "0 views";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
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
      className="min-h-screen bg-background relative overflow-hidden"
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
      <main className="pt-14 pb-20 lg:pb-0 lg:pl-64 relative z-10">
        {/* Honor Board - Desktop */}
        {!isMobile && <EnhancedHonobar />}
        
        {/* Honor Board - Mobile */}
        {isMobile && <MobileHonobar />}
        
        <CategoryChips />
        {!user && (
          <div className="glass-card mx-4 mt-4 rounded-xl border border-cosmic-magenta/50 p-4 shadow-[0_0_50px_rgba(217,0,255,0.5)]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-foreground font-medium text-center sm:text-left">
                Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta font-bold">FUN Play</span> to upload videos, subscribe to channels, and tip creators!
              </p>
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta hover:shadow-[0_0_70px_rgba(0,255,255,1)] transition-all duration-500 border border-glow-cyan"
              >
                Sign In / Sign Up
              </Button>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {/* Continue Watching Section */}
          {user && <ContinueWatching />}
          {loadingVideos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <VideoCard key={`skeleton-${i}`} isLoading={true} />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-2xl mx-auto max-w-2xl shadow-[0_0_60px_rgba(0,102,255,0.5)]">
              <p className="text-foreground text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta">Chưa có video nào</p>
              <p className="text-sm text-muted-foreground mt-2">Hãy tải video đầu tiên lên và khám phá vũ trụ âm nhạc đầy năng lượng tình yêu!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  videoId={video.id}
                  userId={video.user_id}
                  channelId={video.channels?.id}
                  thumbnail={video.thumbnail_url || undefined}
                  title={video.title}
                  channel={video.channels?.name || "Unknown Channel"}
                  avatarUrl={video.profiles?.avatar_url || undefined}
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
  );
};

export default Index;
