import { useState, useEffect, useRef, useCallback } from "react";
import { toast as sonnerToast } from "sonner";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useVideoNavigation } from "@/lib/videoNavigation";
import { Header } from "@/components/Layout/Header";
import { CollapsibleSidebar } from "@/components/Layout/CollapsibleSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Gift, Bookmark, EyeOff } from "lucide-react";
import { ReportSpamButton } from "@/components/Video/ReportSpamButton";
import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";
import { ShareModal } from "@/components/Video/ShareModal";
import { MiniProfileCard } from "@/components/Video/MiniProfileCard";

import { useAutoReward } from "@/hooks/useAutoReward";
import { RewardNotification } from "@/components/Rewards/RewardNotification";
import { AuthRequiredDialog } from "@/components/Auth/AuthRequiredDialog";
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
import { formatViews, formatViewsShort, formatTimestamp } from "@/lib/formatters";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  dislike_count: number;
  duration: number | null;
  slug: string | null;
  created_at: string;
  user_id: string;
  channels: {
    id: string;
    name: string;
    subscriber_count: number;
    is_verified?: boolean;
  };
}


export default function Watch({ videoIdProp }: { videoIdProp?: string }) {
  const { id: paramId } = useParams();
  const id = videoIdProp || paramId;
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [channelAvatarUrl, setChannelAvatarUrl] = useState<string | null>(null);
  const [channelUsername, setChannelUsername] = useState<string | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
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
  const [ambientColor, setAmbientColor] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { goToVideo } = useVideoNavigation();
  const { createSession, nextVideo, previousVideo, isAutoplayEnabled, session, getUpNext } = useVideoPlayback();
  const { awardCommentReward, awardLikeReward } = useAutoReward();

  // Listen for CAMLY reward events and show toast notification
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      sonnerToast.success(`+${Number(detail.amount).toLocaleString()} CAMLY`, {
        description: "Thưởng xem video",
        duration: 3000,
      });
    };
    window.addEventListener('camly-reward', handler);
    return () => window.removeEventListener('camly-reward', handler);
  }, []);

  const handleSwipeLeft = () => {
    const next = nextVideo();
    if (next) {
      goToVideo(next.id);
      toast({ title: "Video tiếp theo", description: next.title });
    }
  };

  const handleSwipeRight = () => {
    const prev = previousVideo();
    if (prev) {
      goToVideo(prev.id);
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
            subscriber_count,
            is_verified
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
          .select("avatar_url, username")
          .eq("id", data.user_id)
          .maybeSingle();
        if (profileData?.avatar_url) {
          setChannelAvatarUrl(profileData.avatar_url);
        }
        if (profileData?.username) {
          setChannelUsername(profileData.username);
        }
      }

      // Increment view count
      await supabase
        .from("videos")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", id);

      // View reward is now handled in EnhancedVideoPlayer based on watch time policy

      // Auto-detect & fix duration: update if NULL or significantly mismatched
      {
        const storedDuration = data.duration;
        const videoEl = document.createElement("video");
        videoEl.preload = "metadata";
        videoEl.src = data.video_url;
        videoEl.onloadedmetadata = async () => {
          const actual = videoEl.duration;
          if (actual && actual > 0 && isFinite(actual)) {
            const rounded = Math.round(actual);
            // Update if NULL or if mismatch is significant (>30% difference)
            const needsUpdate = storedDuration == null 
              || Math.abs(rounded - storedDuration) / Math.max(rounded, 1) > 0.3;
            if (needsUpdate) {
              console.log(`[Auto-Duration] Fixing video ${data.id}: stored=${storedDuration}s → actual=${rounded}s`);
              await supabase
                .from("videos")
                .update({ duration: rounded })
                .eq("id", data.id);
            }
          }
          videoEl.src = "";
        };
        videoEl.onerror = () => { videoEl.src = ""; };
      }
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


  const handleVideoEnd = () => {
    if (!isAutoplayEnabled) return;
    
    const next = nextVideo();
    if (next) {
      goToVideo(next.id);
      toast({
        title: "Đang phát video tiếp theo",
        description: next.title,
      });
    }
  };

  // Initialize playback session when video loads - ALWAYS recreate on video change
  useEffect(() => {
    if (video && id) {
      // Always create fresh session when video changes
      if (!session || session.start_video_id !== id) {
        createSession(id, "RELATED", video.channels?.id);
      }
    }
  }, [video?.id, id]);

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
    if (!user) { setShowAuthDialog(true); return; }
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
      setShowAuthDialog(true);
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
      setShowAuthDialog(true);
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

        // Award CAMLY for liking (silently, 5D Light Economy)
        await awardLikeReward(id!);
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

  const shareUrl = `${window.location.origin}${window.location.pathname}`;

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
          username={channelUsername || undefined}
          slug={video?.slug || undefined}
        />
        <EnhancedDonateModal
          open={donateModalOpen}
          onOpenChange={setDonateModalOpen}
          defaultReceiverId={video?.user_id}
          defaultReceiverName={video?.channels?.name}
          defaultReceiverAvatar={channelAvatarUrl}
          contextType="video"
          contextId={id}
        />
        <RewardNotification 
          amount={rewardNotif.amount}
          type={rewardNotif.type}
          show={rewardNotif.show}
          onClose={() => setRewardNotif(prev => ({ ...prev, show: false }))}
        />
        <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
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
          <div className={`grid gap-4 p-6 ${isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_minmax(300px,402px)]'}`}>
            {/* Main Content */}
            <div className="space-y-3">
              {/* Video Player with Ambient Glow */}
              <div ref={videoPlayerRef} className="relative">
                {/* Ambient glow effect behind the player */}
                {ambientColor && !isTheaterMode && (
                  <div
                    className="absolute -inset-6 rounded-2xl blur-3xl opacity-40 transition-all duration-1000 pointer-events-none -z-10"
                    style={{
                      background: `radial-gradient(ellipse at center, rgba(${ambientColor}, 0.35) 0%, rgba(${ambientColor}, 0.15) 40%, transparent 70%)`,
                    }}
                  />
                )}
                <EnhancedVideoPlayer
                  videoUrl={video.video_url}
                  videoId={video.id}
                  title={video.title}
                  description={video.description}
                  onEnded={handleVideoEnd}
                  onPrevious={() => {
                    const prev = previousVideo();
                    if (prev) goToVideo(prev.id);
                  }}
                  onNext={() => {
                    const next = nextVideo();
                    if (next) goToVideo(next.id);
                  }}
                  hasPrevious={session?.history && session.history.length > 1}
                  hasNext={getUpNext(1).length > 0}
                  onPlayStateChange={setIsPlaying}
                  onTimeUpdate={(time, dur) => {
                    setCurrentTime(time);
                    setDuration(dur);
                  }}
                  onAmbientColor={setAmbientColor}
                  isTheaterMode={isTheaterMode}
                  onTheaterToggle={() => setIsTheaterMode(!isTheaterMode)}
                />
              </div>

              {/* Video Title */}
              <h1 className="text-xl font-bold text-foreground mt-3">
                {video.title}
              </h1>

              {/* Channel Info + Action Buttons — ONE ROW like YouTube */}
              <div className="flex items-center justify-between flex-wrap gap-3 mt-2">
                {/* Left: Channel avatar + name + subscribe */}
                <div className="flex items-center gap-3">
                  {channelAvatarUrl ? (
                    <img
                      src={channelAvatarUrl}
                      alt={video.channels.name}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/${video.user_id}`)}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta flex items-center justify-center text-foreground font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/${video.user_id}`)}
                    >
                      {video.channels.name[0]}
                    </div>
                  )}
                  <div className="relative">
                    <div
                      className="cursor-pointer"
                      onMouseEnter={() => setShowMiniProfile(true)}
                      onMouseLeave={() => setShowMiniProfile(false)}
                      onClick={() => navigate(`/${video.user_id}`)}
                    >
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                          {video.channels.name}
                        </p>
                        {video.channels.is_verified && (
                          <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatViewsShort(video.channels.subscriber_count)} người đăng ký
                      </p>
                    </div>
                    {showMiniProfile && (
                      <div
                        className="absolute top-full left-0 mt-2 z-50"
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
                    size="sm"
                    className={`rounded-full ml-1 ${
                      isSubscribed
                        ? "bg-muted hover:bg-muted/80 text-foreground !shadow-none !border-0"
                        : "bg-gradient-to-r from-cosmic-sapphire to-cosmic-cyan hover:from-cosmic-sapphire/90 hover:to-cosmic-cyan/90 text-foreground shadow-[0_0_20px_rgba(0,255,255,0.4)] !border-0"
                    }`}
                  >
                    {isSubscribed ? "Đã đăng ký" : "Đăng ký"}
                  </Button>
                </div>

                {/* Right: Action buttons — clean, no gradient */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Like/Dislike pill */}
                  <div className="flex items-center bg-muted rounded-full overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full rounded-r-none gap-1.5 h-9 px-4 hover:bg-muted/80 !shadow-none !border-0 ${
                        hasLiked ? "text-cosmic-cyan" : ""
                      }`}
                      onClick={handleLike}
                    >
                      <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
                      <span className="text-sm font-medium">{formatViewsShort(video.like_count)}</span>
                    </Button>
                    <div className="w-px h-6 bg-border"></div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full rounded-l-none h-9 px-3 hover:bg-muted/80 !shadow-none !border-0 ${
                        hasDisliked ? "text-cosmic-magenta" : ""
                      }`}
                      onClick={handleDislike}
                    >
                      <ThumbsDown className={`h-4 w-4 ${hasDisliked ? "fill-current" : ""}`} />
                    </Button>
                  </div>

                  {/* Share */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full gap-1.5 h-9 bg-muted hover:bg-muted/80 !shadow-none !border-0"
                    onClick={() => setShareModalOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm">Chia sẻ</span>
                  </Button>

                  {/* Save */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full gap-1.5 h-9 bg-muted hover:bg-muted/80 !shadow-none !border-0"
                    onClick={() => setPlaylistModalOpen(true)}
                  >
                    <Bookmark className="h-4 w-4" />
                    <span className="text-sm">Lưu</span>
                  </Button>

                  {/* Thưởng & Tặng — gold style matching GlobalDonateButton */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative rounded-full gap-1.5 h-9 overflow-hidden
                               bg-[linear-gradient(90deg,#F9E37A_0%,#FFD700_20%,#FFEC8B_40%,#FFF8DC_50%,#FFEC8B_60%,#FFD700_80%,#F9E37A_100%)]
                               text-[#8B6914] font-bold
                               shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_0_25px_rgba(255,215,0,0.6),0_0_50px_rgba(255,215,0,0.3)]
                               hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_0_40px_rgba(255,215,0,0.8),0_0_80px_rgba(255,215,0,0.4)]
                               border border-[#DAA520]/70
                               transition-all duration-300 hover:scale-105 animate-luxury-pulse"
                    onClick={() => setDonateModalOpen(true)}
                  >
                    <Gift className="h-4 w-4 text-[#8B6914] relative z-10" />
                    <span className="text-sm font-extrabold relative z-10">Thưởng & Tặng</span>
                    {/* Glossy highlight */}
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-t-full pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-mirror-shimmer" />
                  </Button>

                  {/* More menu — includes Report */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-9 w-9 bg-muted hover:bg-muted/80 !shadow-none !border-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => toast({ title: "Đã ẩn", description: "Video này sẽ không được đề xuất nữa" })}>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Không quan tâm
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <div>
                          <ReportSpamButton
                            videoId={video.id}
                            className="w-full justify-start px-2 py-1.5 text-sm cursor-pointer !shadow-none !border-0 !bg-transparent hover:!bg-muted"
                          />
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Description Box — YouTube style gray card */}
              <div
                className="bg-muted/50 rounded-xl p-3 cursor-pointer hover:bg-muted/70 transition-colors mt-3"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                  <span>{formatViews(video.view_count)}</span>
                  <span>•</span>
                  <span>{formatTimestamp(video.created_at)}</span>
                </div>
                {/* Clickable hashtags */}
                {(() => {
                  const hashtags = video.description?.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g);
                  if (!hashtags || hashtags.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {[...new Set(hashtags)].slice(0, 5).map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/search?q=${encodeURIComponent(tag)}`);
                          }}
                          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                <p className={`text-sm text-foreground whitespace-pre-wrap ${
                  !isDescriptionExpanded ? "line-clamp-2" : ""
                }`}>
                  {video.description}
                </p>
                {video.description && video.description.length > 100 && (
                  <button className="text-sm font-semibold text-muted-foreground mt-1.5 hover:text-foreground">
                    {isDescriptionExpanded ? "Thu gọn" : "...xem thêm"}
                  </button>
                )}
              </div>

              {/* Comments Section */}
              <div className="mt-6">
              <VideoCommentList
                  videoId={id!}
                  videoOwnerId={video.user_id}
                  channelName={video.channels.name}
                />
              </div>
            </div>

            {/* Up Next Sidebar — Sticky */}
            <div className="lg:sticky lg:top-[80px] lg:self-start lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto">
              <UpNextSidebar 
                onVideoSelect={(video) => goToVideo(video.id)}
                currentChannelId={video.channels.id}
                currentCategory={(video as any).category}
              />
            </div>
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
        username={channelUsername || undefined}
        slug={video?.slug || undefined}
      />

      <EnhancedDonateModal
        open={donateModalOpen}
        onOpenChange={setDonateModalOpen}
        defaultReceiverId={video?.user_id}
        defaultReceiverName={video?.channels?.name}
        defaultReceiverAvatar={channelAvatarUrl}
        contextType="video"
        contextId={id}
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
      <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />

    </div>
    </>
  );
}
