import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { CollapsibleSidebar } from "@/components/Layout/CollapsibleSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Gift, Bookmark, Flag, EyeOff, RectangleHorizontal } from "lucide-react";
import { DonateModal } from "@/components/Donate/DonateModal";
import { ShareModal } from "@/components/Video/ShareModal";
import { MiniProfileCard } from "@/components/Video/MiniProfileCard";

import { useAutoReward } from "@/hooks/useAutoReward";
import { RewardNotification } from "@/components/Rewards/RewardNotification";
import { useVideoPlayback } from "@/contexts/VideoPlaybackContext";
import { UpNextSidebar } from "@/components/Video/UpNextSidebar";
import { EnhancedVideoPlayer } from "@/components/Video/EnhancedVideoPlayer";
import MiniPlayer from "@/components/Video/MiniPlayer";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { DynamicMeta } from "@/components/SEO/DynamicMeta";
import { setGlobalVideoState, setGlobalPlayingState } from "@/components/Video/GlobalVideoPlayer";
import { MobileWatchView } from "@/components/Video/Mobile/MobileWatchView";
import { VideoCommentList } from "@/components/Video/Comments/VideoCommentList";
import { AddToPlaylistModal } from "@/components/Playlist/AddToPlaylistModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatViews, formatTimestamp } from "@/lib/formatters";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  dislike_count: number;
  created_at: string;
  user_id: string;
  channels: {
    id: string;
    name: string;
    subscriber_count: number;
  };
}

interface RecommendedVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number | null;
  created_at: string;
  channels: {
    name: string;
  };
}

export default function Watch() {
  const { id } = useParams();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [channelAvatarUrl, setChannelAvatarUrl] = useState<string | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<RecommendedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [rewardNotif, setRewardNotif] = useState<{ amount: number; type: "VIEW" | "LIKE" | "COMMENT" | "SHARE"; show: boolean }>({ 
    amount: 0, 
    type: "VIEW", 
    show: false 
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showMiniProfile, setShowMiniProfile] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { createSession, nextVideo, previousVideo, isAutoplayEnabled, session, getUpNext } = useVideoPlayback();
  const { awardCommentReward, awardLikeReward } = useAutoReward();

  // Swipe navigation for mobile
  const handleSwipeLeft = () => {
    const next = nextVideo();
    if (next) {
      navigate(`/watch/${next.id}`);
      toast({ title: "Video tiếp theo", description: next.title });
    }
  };

  const handleSwipeRight = () => {
    const prev = previousVideo();
    if (prev) {
      navigate(`/watch/${prev.id}`);
      toast({ title: "Video trước", description: prev.title });
    }
  };

  const { handlers: swipeHandlers } = useSwipeNavigation({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 80,
    enabled: isMobile,
  });

  // Intersection observer for mini player
  useEffect(() => {
    if (!isMobile || !videoPlayerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setShowMiniPlayer(!entry.isIntersecting && isPlaying);
      },
      { threshold: 0.3 }
    );

    observer.observe(videoPlayerRef.current);

    return () => observer.disconnect();
  }, [isMobile, isPlaying]);

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchRecommendedVideos();
    }
  }, [id]);

  useEffect(() => {
    if (user && video) {
      checkSubscription();
      checkLikeStatus();
      checkDislikeStatus();
    }
  }, [user, video]);

  // Real-time subscription for view count and subscriber updates
  useEffect(() => {
    if (!video) return;

    const videoChannel = supabase
      .channel(`video-${video.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `id=eq.${video.id}`,
        },
        (payload) => {
          console.log('Video updated:', payload);
          setVideo(prev => prev ? { ...prev, ...payload.new as any } : null);
        }
      )
      .subscribe();

    const channelChannel = supabase
      .channel(`channel-${video.channels.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'channels',
          filter: `id=eq.${video.channels.id}`,
        },
        (payload) => {
          console.log('Channel updated:', payload);
          setVideo(prev => prev ? {
            ...prev,
            channels: { ...prev.channels, ...payload.new as any }
          } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(videoChannel);
      supabase.removeChannel(channelChannel);
    };
  }, [video?.id, video?.channels.id]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          *,
          channels (
            id,
            name,
            subscriber_count
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setVideo(data);

      // Fetch channel owner's avatar
      if (data?.user_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", data.user_id)
          .maybeSingle();
        if (profileData?.avatar_url) {
          setChannelAvatarUrl(profileData.avatar_url);
        }
      }

      // Increment view count
      await supabase
        .from("videos")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", id);

      // View reward is now handled in EnhancedVideoPlayer based on watch time policy
    } catch (error: any) {
      toast({
        title: "Lỗi tải video",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          thumbnail_url,
          view_count,
          created_at,
          channels (
            name
          )
        `)
        .eq("is_public", true)
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecommendedVideos(data || []);
    } catch (error: any) {
      console.error("Error loading recommended videos:", error);
    }
  };

  const handleVideoEnd = () => {
    if (!isAutoplayEnabled) return;
    
    const next = nextVideo();
    if (next) {
      navigate(`/watch/${next.id}`);
      toast({
        title: "Đang phát video tiếp theo",
        description: next.title,
      });
    }
  };

  // Initialize playback session when video loads
  useEffect(() => {
    if (video && id && !session) {
      createSession(id, "RELATED", video.channels?.id);
    }
  }, [video?.id]);

  // Enable global playback when navigating away while video is playing
  useEffect(() => {
    // When component unmounts (navigating away), dispatch event to start global playback
    return () => {
      if (video && isPlaying && currentTime > 0) {
        const globalState = {
          videoId: video.id,
          videoUrl: video.video_url,
          title: video.title,
          thumbnailUrl: video.thumbnail_url,
          channelName: video.channels.name,
          channelId: video.channels.id,
          currentTime: currentTime,
          duration: duration,
        };
        
        // Set global state directly for faster access
        setGlobalVideoState(globalState);
        setGlobalPlayingState(true);
        
        // Also dispatch event for the GlobalVideoPlayer component
        window.dispatchEvent(new CustomEvent('startGlobalPlayback', { detail: globalState }));
      }
    };
  }, [video, isPlaying, currentTime, duration]);

  // Listen for global player closed event to stop local playback reference
  useEffect(() => {
    const handleGlobalPlayerClosed = () => {
      // Global player was closed, clear any related state if needed
      console.log('Global player closed');
    };

    window.addEventListener('globalPlayerClosed', handleGlobalPlayerClosed);
    return () => window.removeEventListener('globalPlayerClosed', handleGlobalPlayerClosed);
  }, []);

  // formatViews and formatTimestamp imported from @/lib/formatters

  const checkSubscription = async () => {
    if (!user || !video) return;

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("channel_id", video.channels.id)
        .eq("subscriber_id", user.id)
        .maybeSingle();

      setIsSubscribed(!!data);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user || !id) return;
    try {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("video_id", id)
        .eq("user_id", user.id)
        .eq("is_dislike", false)
        .maybeSingle();
      setHasLiked(!!data);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const checkDislikeStatus = async () => {
    if (!user || !id) return;
    try {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("video_id", id)
        .eq("user_id", user.id)
        .eq("is_dislike", true)
        .maybeSingle();
      setHasDisliked(!!data);
    } catch (error) {
      console.error("Error checking dislike status:", error);
    }
  };

  const handleDislike = async () => {
    if (!user) { navigate("/auth"); return; }
    try {
      if (hasDisliked) {
        // Un-dislike
        await supabase.from("likes").delete()
          .eq("video_id", id).eq("user_id", user.id).eq("is_dislike", true);
        await supabase.from("videos")
          .update({ dislike_count: Math.max(0, (video?.dislike_count || 1) - 1) })
          .eq("id", id);
        setHasDisliked(false);
      } else {
        // Remove like if exists
        if (hasLiked) {
          await supabase.from("likes").delete()
            .eq("video_id", id).eq("user_id", user.id).eq("is_dislike", false);
          await supabase.from("videos")
            .update({ like_count: Math.max(0, (video?.like_count || 1) - 1) })
            .eq("id", id);
          setHasLiked(false);
        }
        // Add dislike
        await supabase.from("likes").insert({ video_id: id, user_id: user.id, is_dislike: true });
        await supabase.from("videos")
          .update({ dislike_count: (video?.dislike_count || 0) + 1 })
          .eq("id", id);
        setHasDisliked(true);
      }
      fetchVideo();
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!video) return;

    try {
      if (isSubscribed) {
        await supabase
          .from("subscriptions")
          .delete()
          .eq("channel_id", video.channels.id)
          .eq("subscriber_id", user.id);

        // subscriber_count is updated automatically by database trigger

        setIsSubscribed(false);
        toast({
          title: "Đã hủy đăng ký",
          description: "Bạn đã hủy đăng ký kênh này",
        });
      } else {
        await supabase.from("subscriptions").insert({
          channel_id: video.channels.id,
          subscriber_id: user.id,
        });

        // subscriber_count is updated automatically by database trigger

        setIsSubscribed(true);
        toast({
          title: "Đã đăng ký!",
          description: "Bạn đã đăng ký kênh này thành công",
        });
      }

      fetchVideo();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("video_id", id)
          .eq("user_id", user.id)
          .eq("is_dislike", false);

        await supabase
          .from("videos")
          .update({ like_count: Math.max(0, (video?.like_count || 1) - 1) })
          .eq("id", id);

        setHasLiked(false);
      } else {
        // Like
        await supabase.from("likes").insert({
          video_id: id,
          user_id: user.id,
          is_dislike: false,
        });

        await supabase
          .from("videos")
          .update({ like_count: (video?.like_count || 0) + 1 })
          .eq("id", id);

        setHasLiked(true);

        // Award CAMLY for liking
        const result = await awardLikeReward(id!);
        if (result) {
          setRewardNotif({ amount: 2000, type: 'LIKE', show: true });
        }
      }

      fetchVideo();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Không tìm thấy video</div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/watch/${video.id}`;

  // Mobile view - use new YouTube-style layout
  if (isMobile) {
    return (
      <>
        <DynamicMeta
          title={`${video.title} - ${video.channels?.name || "FUN Play"}`}
          description={video.description || `Xem video "${video.title}" trên FUN Play - Web3 Video Platform`}
          image={video.thumbnail_url || "https://lovable.dev/opengraph-image-p98pqg.png"}
          url={shareUrl}
          type="video.other"
        />
        <MobileWatchView
          video={video}
          isSubscribed={isSubscribed}
          hasLiked={hasLiked}
          hasDisliked={hasDisliked}
          onSubscribe={handleSubscribe}
          onLike={handleLike}
          onDislike={handleDislike}
          onShare={() => setShareModalOpen(true)}
          onVideoEnd={handleVideoEnd}
          channelAvatarUrl={channelAvatarUrl}
        />
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          contentId={id || ""}
          contentTitle={video?.title || ""}
          contentType="video"
          thumbnailUrl={video?.thumbnail_url || undefined}
          channelName={video?.channels?.name}
          userId={user?.id}
        />
        <DonateModal
          open={donateModalOpen}
          onOpenChange={setDonateModalOpen}
          videoId={id}
          creatorName={video?.channels.name || ""}
          channelUserId={video?.user_id}
        />
        <RewardNotification 
          amount={rewardNotif.amount}
          type={rewardNotif.type}
          show={rewardNotif.show}
          onClose={() => setRewardNotif(prev => ({ ...prev, show: false }))}
        />
      </>
    );
  }

  // Desktop view - keep existing layout
  return (
    <>
      {/* Dynamic Open Graph Meta Tags for Video */}
      <DynamicMeta
        title={`${video.title} - ${video.channels?.name || "FUN Play"}`}
        description={video.description || `Xem video "${video.title}" trên FUN Play - Web3 Video Platform`}
        image={video.thumbnail_url || "https://lovable.dev/opengraph-image-p98pqg.png"}
        url={shareUrl}
        type="video.other"
      />

      <div className="min-h-screen bg-background">
        <div className="hidden lg:block">
          <Header onMenuClick={() => setIsSidebarExpanded(prev => !prev)} />
          <CollapsibleSidebar isExpanded={isSidebarExpanded} />
        </div>

      <main className={`pt-14 transition-all duration-300 ${isSidebarExpanded ? "lg:pl-60" : "lg:pl-16"}`}>
        <div className="max-w-[1920px] mx-auto">
          <div className={`grid gap-6 p-6 ${isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_400px]'}`}>
            {/* Main Content */}
            <div className="space-y-4">
              {/* Video Player */}
              <div ref={videoPlayerRef}>
                <EnhancedVideoPlayer
                  videoUrl={video.video_url}
                  videoId={video.id}
                  title={video.title}
                  onEnded={handleVideoEnd}
                  onPrevious={() => {
                    const prev = previousVideo();
                    if (prev) navigate(`/watch/${prev.id}`);
                  }}
                  onNext={() => {
                    const next = nextVideo();
                    if (next) navigate(`/watch/${next.id}`);
                  }}
                  hasPrevious={session?.history && session.history.length > 1}
                  hasNext={getUpNext(1).length > 0}
                  onPlayStateChange={setIsPlaying}
                  onTimeUpdate={(time, dur) => {
                    setCurrentTime(time);
                    setDuration(dur);
                  }}
                />
              </div>

              {/* Video Title */}
              <h1 className="text-xl font-bold text-foreground">
                {video.title}
              </h1>

              {/* Channel Info & Actions */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {channelAvatarUrl ? (
                    <img
                      src={channelAvatarUrl}
                      alt={video.channels.name}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] transition-shadow"
                      onClick={() => navigate(`/channel/${video.channels.id}`)}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta flex items-center justify-center text-foreground font-semibold cursor-pointer hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] transition-shadow"
                      onClick={() => navigate(`/channel/${video.channels.id}`)}
                    >
                      {video.channels.name[0]}
                    </div>
                  )}
                  <div className="relative">
                    <div
                      className="cursor-pointer"
                      onMouseEnter={() => setShowMiniProfile(true)}
                      onMouseLeave={() => setShowMiniProfile(false)}
                      onClick={() => navigate(`/channel/${video.channels.id}`)}
                    >
                      <p className="font-semibold text-foreground hover:text-cosmic-cyan transition-colors">
                        {video.channels.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(video.channels.subscriber_count || 0).toLocaleString()} người đăng ký
                      </p>
                    </div>
                    {showMiniProfile && (
                      <div
                        className="absolute top-full left-0 mt-2"
                        onMouseEnter={() => setShowMiniProfile(true)}
                        onMouseLeave={() => setShowMiniProfile(false)}
                      >
                        <MiniProfileCard
                          channelId={video.channels.id}
                          channelName={video.channels.name}
                          subscriberCount={video.channels.subscriber_count || 0}
                          onSubscribeChange={() => {
                            fetchVideo();
                            checkSubscription();
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSubscribe}
                    className={`rounded-full ml-2 ${
                      isSubscribed
                        ? "bg-muted hover:bg-muted/80 text-foreground"
                        : "bg-gradient-to-r from-cosmic-sapphire to-cosmic-cyan hover:from-cosmic-sapphire/90 hover:to-cosmic-cyan/90 text-foreground shadow-[0_0_30px_rgba(0,255,255,0.5)]"
                    }`}
                  >
                    {isSubscribed ? "Đã đăng ký" : "Đăng ký"}
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-muted/50 rounded-full overflow-hidden border border-cosmic-cyan/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full rounded-r-none gap-2 hover:bg-cosmic-cyan/20 ${
                        hasLiked ? "text-cosmic-cyan" : ""
                      }`}
                      onClick={handleLike}
                    >
                      <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
                      <span className="font-semibold">{video.like_count || 0}</span>
                    </Button>
                    <div className="w-px h-6 bg-border"></div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full rounded-l-none hover:bg-cosmic-magenta/20 ${
                        hasDisliked ? "text-cosmic-magenta" : ""
                      }`}
                      onClick={handleDislike}
                    >
                      <ThumbsDown className={`h-4 w-4 ${hasDisliked ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full gap-2 bg-muted/50 hover:bg-cosmic-sapphire/20 border border-cosmic-sapphire/20"
                    onClick={() => setShareModalOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                    Chia sẻ
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full gap-2 bg-muted/50 hover:bg-muted/70 border border-border"
                    onClick={() => setPlaylistModalOpen(true)}
                  >
                    <Bookmark className="h-4 w-4" />
                    Lưu
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full gap-2 bg-gradient-to-r from-glow-gold/20 to-divine-rose-gold/20 hover:from-glow-gold/30 hover:to-divine-rose-gold/30 border border-glow-gold/30"
                    onClick={() => setDonateModalOpen(true)}
                  >
                    <Gift className="h-4 w-4 text-glow-gold" />
                    Tặng
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={`rounded-full hidden lg:flex ${
                      isTheaterMode 
                        ? "bg-cosmic-cyan/20 text-cosmic-cyan border-cosmic-cyan/30" 
                        : "bg-muted/50 hover:bg-muted/70"
                    }`}
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    title={isTheaterMode ? "Chế độ mặc định" : "Chế độ rạp phim"}
                  >
                    <RectangleHorizontal className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-muted/50 hover:bg-muted/70"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => toast({ title: "Đã báo cáo", description: "Cảm ơn bạn đã phản hồi" })}>
                        <Flag className="mr-2 h-4 w-4" />
                        Báo cáo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({ title: "Đã ẩn", description: "Video này sẽ không được đề xuất nữa" })}>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Không quan tâm
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Description - YouTube style expand/collapse */}
              <div
                className="bg-muted rounded-xl p-4 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <span>{(video.view_count || 0).toLocaleString()} lượt xem</span>
                  <span>•</span>
                  <span>{new Date(video.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                <p className={`text-sm text-foreground whitespace-pre-wrap ${
                  !isDescriptionExpanded ? "line-clamp-3" : ""
                }`}>
                  {video.description}
                </p>
                {video.description && video.description.length > 150 && (
                  <button className="text-sm font-semibold text-muted-foreground mt-2 hover:text-foreground">
                    {isDescriptionExpanded ? "Thu gọn" : "...xem thêm"}
                  </button>
                )}
              </div>

              {/* Comments Section - New Component */}
              <div className="mt-6">
              <VideoCommentList
                  videoId={id!}
                  videoOwnerId={video.user_id}
                  channelName={video.channels.name}
                />
              </div>
            </div>

            {/* Up Next Sidebar with Smart Queue */}
            <UpNextSidebar 
              onVideoSelect={(video) => navigate(`/watch/${video.id}`)}
            />
          </div>
        </div>
      </main>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        contentId={id || ""}
        contentTitle={video?.title || ""}
        contentType="video"
        thumbnailUrl={video?.thumbnail_url || undefined}
        channelName={video?.channels?.name}
        userId={user?.id}
      />

      <DonateModal
        open={donateModalOpen}
        onOpenChange={setDonateModalOpen}
        videoId={id}
        creatorName={video?.channels.name || ""}
        channelUserId={video?.user_id}
      />

      {id && (
        <AddToPlaylistModal
          open={playlistModalOpen}
          onOpenChange={setPlaylistModalOpen}
          videoId={id}
          videoTitle={video?.title}
        />
      )}
      
      <RewardNotification 
        amount={rewardNotif.amount}
        type={rewardNotif.type}
        show={rewardNotif.show}
        onClose={() => setRewardNotif(prev => ({ ...prev, show: false }))}
      />

    </div>
    </>
  );
}
