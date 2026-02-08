import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatViewsShort } from '@/lib/formatters';
import { Heart, MessageCircle, Share2, User, Volume2, VolumeX, Play, Pause, ChevronUp, ChevronDown, ThumbsDown, Bookmark, MoreVertical, Flag, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ShareModal } from '@/components/Video/ShareModal';
import { ShortsCommentSheet } from '@/components/Video/ShortsCommentSheet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShortVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  channel_id: string;
  user_id: string;
  duration: number | null;
  channel?: {
    id: string;
    name: string;
    user_id: string;
  };
  profile?: {
    avatar_url: string | null;
    username: string;
    display_name: string | null;
  };
}

const ShortsVideoItem = ({ 
  video, 
  isActive, 
  onLike,
  onDislike,
  onShare,
  onComment,
  onSave,
  onSubscribe,
  isLiked,
  isDisliked,
  isSaved,
  isSubscribed,
}: { 
  video: ShortVideo; 
  isActive: boolean;
  onLike: () => void;
  onDislike: () => void;
  onShare: () => void;
  onComment: () => void;
  onSave: () => void;
  onSubscribe: () => void;
  isLiked: boolean;
  isDisliked: boolean;
  isSaved: boolean;
  isSubscribed: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleTimeUpdate = () => {
      if (vid.duration > 0) {
        setProgress((vid.currentTime / vid.duration) * 100);
      }
    };

    vid.addEventListener('timeupdate', handleTimeUpdate);

    if (isActive) {
      vid.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      vid.pause();
      vid.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
    }

    return () => {
      vid.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isActive]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowPlayButton(true);
    setTimeout(() => setShowPlayButton(false), 500);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const goToChannel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (video.profile?.username) {
      navigate(`/@${video.profile.username}`);
    } else if (video.channel_id) {
      navigate(`/channel/${video.channel_id}`);
    }
  };

  return (
    <div className="relative w-full h-full snap-start snap-always bg-black flex items-center justify-center">
      {/* Video */}
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url || undefined}
        className="w-full h-full object-contain"
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
      />

      {/* Play/Pause overlay */}
      <AnimatePresence>
        {showPlayButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-10 h-10 text-white" />
              ) : (
                <Play className="w-10 h-10 text-white ml-1" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4">
        {/* Avatar */}
        <button onClick={goToChannel} className="relative">
          <Avatar className="w-12 h-12 border-2 border-white">
            <AvatarImage src={video.profile?.avatar_url || undefined} />
            <AvatarFallback>
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <span className="text-[10px] text-primary-foreground font-bold">+</span>
          </div>
        </button>

        {/* Like */}
        <button 
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="flex flex-col items-center"
        >
          <div className={cn(
            "w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center transition-all",
            isLiked && "bg-red-500/20"
          )}>
            <Heart className={cn(
              "w-7 h-7",
              isLiked ? "fill-red-500 text-red-500" : "text-white"
            )} />
          </div>
          <span className="text-white text-xs mt-1 font-medium">
            {(video.like_count || 0).toLocaleString()}
          </span>
        </button>

        {/* Dislike */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDislike(); }}
          className="flex flex-col items-center"
        >
          <div className={cn(
            "w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center transition-all",
            isDisliked && "bg-blue-500/20"
          )}>
            <ThumbsDown className={cn(
              "w-6 h-6",
              isDisliked ? "fill-blue-400 text-blue-400" : "text-white"
            )} />
          </div>
          <span className="text-white text-[10px] mt-1">Không thích</span>
        </button>

        {/* Comment */}
        <button 
          onClick={(e) => { e.stopPropagation(); onComment(); }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">
            {(video.comment_count || 0).toLocaleString()}
          </span>
        </button>

        {/* Share */}
        <button 
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-[10px] mt-1">Chia sẻ</span>
        </button>

        {/* Save / Bookmark */}
        <button 
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className="flex flex-col items-center"
        >
          <div className={cn(
            "w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center transition-all",
            isSaved && "bg-yellow-500/20"
          )}>
            <Bookmark className={cn(
              "w-6 h-6",
              isSaved ? "fill-yellow-400 text-yellow-400" : "text-white"
            )} />
          </div>
          <span className="text-white text-[10px] mt-1">Lưu</span>
        </button>

        {/* Mute toggle */}
        <button 
          onClick={toggleMute}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </div>
        </button>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                <MoreVertical className="w-6 h-6 text-white" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => toast.info('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này.')}>
              <Flag className="mr-2 h-4 w-4" />
              Báo cáo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Chúng tôi sẽ không đề xuất nội dung tương tự.')}>
              <EyeOff className="mr-2 h-4 w-4" />
              Không quan tâm
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bottom info overlay */}
      <div className="absolute left-0 right-16 bottom-20 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={goToChannel} className="flex items-center gap-2">
              <span className="text-white font-bold text-base">
                @{video.profile?.username || 'user'}
              </span>
            </button>
            {/* Subscribe button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSubscribe();
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                isSubscribed
                  ? "bg-white/20 text-white/80 hover:bg-white/30"
                  : "bg-white text-black hover:bg-white/90"
              )}
            >
              {isSubscribed ? "Đã đăng ký" : "Đăng ký"}
            </button>
          </div>
          <p className="text-white text-sm line-clamp-2">{video.title}</p>
          {/* View count */}
          <div className="flex items-center gap-1.5 text-white/70 text-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>{formatViewsShort(video.view_count)} lượt xem</span>
          </div>
        </div>
      </div>

      {/* Gradient overlay for readability */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] z-20">
        <div
          className="h-full bg-gradient-to-r from-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-cyan))] transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default function Shorts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [dislikedVideos, setDislikedVideos] = useState<Set<string>>(new Set());
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());
  const [shareVideoId, setShareVideoId] = useState<string | null>(null);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch short videos
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['shorts-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id, title, video_url, thumbnail_url, view_count, like_count, comment_count,
          channel_id, user_id, duration
        `)
        .eq('is_public', true)
        .eq('approval_status', 'approved')
        .or('duration.lt.60,category.eq.shorts')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data?.map(v => v.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url, username, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return (data || []).map(video => ({
        ...video,
        profile: profileMap.get(video.user_id)
      })) as ShortVideo[];
    }
  });

  // Fetch user's liked & disliked videos
  useEffect(() => {
    if (!user) return;
    
    const fetchLikesAndDislikes = async () => {
      const { data } = await supabase
        .from('likes')
        .select('video_id, is_dislike')
        .eq('user_id', user.id)
        .not('video_id', 'is', null);
      
      if (data) {
        const likes = new Set<string>();
        const dislikes = new Set<string>();
        data.forEach(l => {
          if (l.video_id) {
            if (l.is_dislike) {
              dislikes.add(l.video_id);
            } else {
              likes.add(l.video_id);
            }
          }
        });
        setLikedVideos(likes);
        setDislikedVideos(dislikes);
      }
    };
    
    fetchLikesAndDislikes();
  }, [user]);

  // Fetch user's subscriptions
  useEffect(() => {
    if (!user) return;

    const fetchSubscriptions = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('channel_id')
        .eq('subscriber_id', user.id);
      
      if (data) {
        setSubscribedChannels(new Set(data.map(s => s.channel_id)));
      }
    };

    fetchSubscriptions();
  }, [user]);

  // Fetch user's watch later (saved) videos
  useEffect(() => {
    if (!user) return;

    const fetchSaved = async () => {
      const { data } = await supabase
        .from('watch_later')
        .select('video_id')
        .eq('user_id', user.id);
      
      if (data) {
        setSavedVideos(new Set(data.map(w => w.video_id)));
      }
    };

    fetchSaved();
  }, [user]);

  // Handle scroll to detect current video
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, videos.length]);

  // Scroll navigation
  const scrollToVideo = (index: number) => {
    const container = containerRef.current;
    if (!container || index < 0 || index >= videos.length) return;
    
    container.scrollTo({
      top: index * container.clientHeight,
      behavior: 'smooth'
    });
  };

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thích video');
      return;
    }

    const isLiked = likedVideos.has(videoId);
    
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', videoId).eq('is_dislike', false);
      setLikedVideos(prev => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    } else {
      // Remove dislike if exists
      if (dislikedVideos.has(videoId)) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', videoId).eq('is_dislike', true);
        setDislikedVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      }
      await supabase.from('likes').insert({ user_id: user.id, video_id: videoId, is_dislike: false });
      setLikedVideos(prev => new Set(prev).add(videoId));
    }
  };

  const handleDislike = async (videoId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    const isDisliked = dislikedVideos.has(videoId);
    
    if (isDisliked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', videoId).eq('is_dislike', true);
      setDislikedVideos(prev => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    } else {
      // Remove like if exists
      if (likedVideos.has(videoId)) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', videoId).eq('is_dislike', false);
        setLikedVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      }
      await supabase.from('likes').insert({ user_id: user.id, video_id: videoId, is_dislike: true });
      setDislikedVideos(prev => new Set(prev).add(videoId));
    }
  };

  const handleSubscribe = async (channelId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký kênh');
      return;
    }

    const isSub = subscribedChannels.has(channelId);

    if (isSub) {
      await supabase.from('subscriptions').delete().eq('subscriber_id', user.id).eq('channel_id', channelId);
      setSubscribedChannels(prev => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
      toast.success('Đã hủy đăng ký kênh');
    } else {
      await supabase.from('subscriptions').insert({ subscriber_id: user.id, channel_id: channelId });
      setSubscribedChannels(prev => new Set(prev).add(channelId));
      toast.success('Đã đăng ký kênh!');
    }
  };

  const handleSave = async (videoId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu video');
      return;
    }

    const isSaved = savedVideos.has(videoId);

    if (isSaved) {
      await supabase.from('watch_later').delete().eq('user_id', user.id).eq('video_id', videoId);
      setSavedVideos(prev => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
      toast.success('Đã xóa khỏi Xem sau');
    } else {
      await supabase.from('watch_later').insert({ user_id: user.id, video_id: videoId });
      setSavedVideos(prev => new Set(prev).add(videoId));
      toast.success('Đã lưu vào Xem sau');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <Play className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">Chưa có video Shorts nào</p>
        <p className="text-sm text-muted-foreground mt-2">Hãy quay lại sau nhé!</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Back/Home button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* Desktop centered layout wrapper */}
      <div className="h-full w-full flex items-center justify-center">
        {/* Navigation arrows - Desktop only, positioned outside video */}
        <div className="hidden md:flex flex-col gap-4 mr-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => scrollToVideo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => scrollToVideo(currentIndex + 1)}
            disabled={currentIndex === videos.length - 1}
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        </div>

        {/* Video container with snap scroll - Centered on desktop */}
        <div
          ref={containerRef}
          className="h-full w-full md:max-w-[420px] md:rounded-2xl md:overflow-hidden overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative"
          onScroll={handleScroll}
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {videos.map((video, index) => (
            <div 
              key={video.id} 
              className="h-full w-full"
              style={{ scrollSnapAlign: 'start' }}
            >
            <ShortsVideoItem
              video={video}
              isActive={index === currentIndex}
              isLiked={likedVideos.has(video.id)}
              isDisliked={dislikedVideos.has(video.id)}
              isSaved={savedVideos.has(video.id)}
              isSubscribed={subscribedChannels.has(video.channel_id)}
              onLike={() => handleLike(video.id)}
              onDislike={() => handleDislike(video.id)}
              onShare={() => setShareVideoId(video.id)}
              onComment={() => setCommentVideoId(video.id)}
              onSave={() => handleSave(video.id)}
              onSubscribe={() => handleSubscribe(video.channel_id)}
            />
          </div>
        ))}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1">
        {videos.slice(0, Math.min(videos.length, 10)).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              i === currentIndex % 10 ? "bg-white w-4" : "bg-white/40"
            )}
          />
        ))}
      </div>

      {/* Video counter */}
      <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
        {currentIndex + 1} / {videos.length}
      </div>

      {/* Share Modal */}
      {shareVideoId && (() => {
        const video = videos.find(v => v.id === shareVideoId);
        return (
          <ShareModal
            videoId={shareVideoId}
            videoTitle={video?.title || 'Video Shorts'}
            thumbnailUrl={video?.thumbnail_url || undefined}
            userId={user?.id}
            contentType="video"
            isOpen={!!shareVideoId}
            onClose={() => setShareVideoId(null)}
          />
        );
      })()}

      {/* Comment Sheet */}
      <ShortsCommentSheet
        videoId={commentVideoId || ''}
        isOpen={!!commentVideoId}
        onClose={() => setCommentVideoId(null)}
        commentCount={videos.find(v => v.id === commentVideoId)?.comment_count || 0}
      />
    </div>
  );
}
