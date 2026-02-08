import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { CollapsibleSidebar } from "@/components/Layout/CollapsibleSidebar";
import { HonoboardRightSidebar } from "@/components/Layout/HonoboardRightSidebar";
import { MobileHeader } from "@/components/Layout/MobileHeader";
import { MobileBottomNav } from "@/components/Layout/MobileBottomNav";
import { MobileDrawer } from "@/components/Layout/MobileDrawer";
import { MobileHonoboardCard } from "@/components/Layout/MobileHonoboardCard";
import { MobileTopRankingCard } from "@/components/Layout/MobileTopRankingCard";
import { MobileTopSponsorsCard } from "@/components/Layout/MobileTopSponsorsCard";
import { CategoryChips } from "@/components/Layout/CategoryChips";
import { VideoCard } from "@/components/Video/VideoCard";
import { ContinueWatching } from "@/components/Video/ContinueWatching";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import { PullToRefreshIndicator } from "@/components/Layout/PullToRefreshIndicator";
import { HonobarDetailModal } from "@/components/Layout/HonobarDetailModal";
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
  duration: number | null;
  category: string | null;
  created_at: string;
  user_id: string;
  channels: {
    name: string;
    id: string;
    is_verified: boolean;
  };
  profiles: {
    wallet_address: string | null;
    avatar_url: string | null;
  };
}

const Index = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showHonobarDetail, setShowHonobarDetail] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [currentMusicUrl, setCurrentMusicUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { successFeedback } = useHapticFeedback();

  // Toggle sidebar expanded/collapsed
  const handleMenuClick = () => {
    if (isMobile) {
      setIsMobileDrawerOpen(true);
    } else {
      setIsSidebarExpanded(!isSidebarExpanded);
    }
  };

  // Fetch videos function
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
          duration,
          category,
          created_at,
          user_id,
          channels (
            name,
            id,
            is_verified
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

    const profileChannel = supabase
      .channel('profile-updates-homepage')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
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

    const videoChannel = supabase
      .channel('video-updates-homepage')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'videos' },
        (payload) => {
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

    const handleProfileUpdate = () => {
      fetchVideos();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(videoChannel);
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [fetchVideos, toast]);

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
      {/* Honor Board Detail Modal */}
      <HonobarDetailModal 
        isOpen={showHonobarDetail} 
        onClose={() => setShowHonobarDetail(false)} 
      />

      {/* Pull-to-refresh indicator */}
      {isMobile && (
        <PullToRefreshIndicator
          isPulling={isPulling}
          isRefreshing={isRefreshing}
          pullProgress={pullProgress}
          pullDistance={pullDistance}
        />
      )}

      {/* Desktop Header & Collapsible Sidebar */}
      <div className="hidden lg:block">
        <Header onMenuClick={handleMenuClick} />
        <CollapsibleSidebar isExpanded={isSidebarExpanded} />
      </div>

      {/* Mobile Header & Drawer */}
      <div className="lg:hidden">
        <MobileHeader onMenuClick={() => setIsMobileDrawerOpen(true)} />
        <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
        <MobileBottomNav />
      </div>
      
      {/* Main content - 3 column layout with fixed right sidebar */}
      <main className={`pt-12 lg:pt-14 pb-20 lg:pb-0 transition-all duration-300 ${
        isSidebarExpanded ? 'lg:pl-60' : 'lg:pl-16'
      } lg:pr-[260px]`}>
        {/* Center content area - SCROLLABLE */}
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto lg:h-auto lg:overflow-visible">
          <CategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />
          
          {/* Mobile 3-Card Layout */}
          <div className="lg:hidden px-4 mb-4 space-y-3">
            <MobileHonoboardCard onClick={() => setShowHonobarDetail(true)} />
            <MobileTopRankingCard />
            <MobileTopSponsorsCard />
          </div>

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
          
          <div className="p-4 lg:p-6">
            {/* Continue Watching Section */}
            {user && <ContinueWatching />}
            
            {loadingVideos ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {[...Array(6)].map((_, i) => (
                  <VideoCard key={`skeleton-${i}`} isLoading={true} />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl mx-auto max-w-2xl shadow-[0_0_60px_rgba(0,102,255,0.5)]">
                <p className="text-foreground text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta">Chưa có video nào</p>
                <p className="text-sm text-muted-foreground mt-2">Hãy tải video đầu tiên lên và khám phá vũ trụ âm nhạc đầy năng lượng tình yêu!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {videos
                  .filter((video) => {
                    if (selectedCategory === "Tất cả") return true;
                    const categoryMap: Record<string, string[]> = {
                      "Âm nhạc": ["music"],
                      "Thiền": ["light_meditation", "sound_therapy", "mantra"],
                      "Podcast": ["podcast"],
                      "Trò chơi": ["gaming"],
                      "Tin tức": ["news"],
                      "Thiên nhiên": ["nature"],
                      "Mới tải lên gần đây": [],
                      "Đề xuất mới": [],
                    };
                    const cats = categoryMap[selectedCategory];
                    if (!cats) return true;
                    if (cats.length === 0) return true; // special filters
                    return cats.includes(video.category || "");
                  })
                  .map((video) => (
                  <VideoCard
                    key={video.id}
                    videoId={video.id}
                    userId={video.user_id}
                    channelId={video.channels?.id}
                    thumbnail={video.thumbnail_url || undefined}
                    title={video.title}
                    channel={video.channels?.name || "Unknown Channel"}
                    avatarUrl={video.profiles?.avatar_url || undefined}
                    duration={video.duration}
                    isVerified={video.channels?.is_verified}
                    views={formatViews(video.view_count)}
                    timestamp={formatTimestamp(video.created_at)}
                    onPlay={handlePlayVideo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right sidebar - Honor Board (desktop only) - FIXED POSITION */}
      <HonoboardRightSidebar />

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
