import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMusicPlayer, Track } from "@/contexts/MusicPlayerContext";
import { ShareModal } from "@/components/Video/ShareModal";
import { DynamicMeta } from "@/components/SEO/DynamicMeta";
import { MusicComments } from "@/components/Music/MusicComments";
import { AddToMusicPlaylistModal } from "@/components/Music/AddToMusicPlaylistModal";
import { useAutoReward } from "@/hooks/useAutoReward";
import { formatDuration, formatViewsShort } from "@/lib/formatters";
import { 
  Play, 
  Pause, 
  Share2, 
  Heart, 
  Download, 
  ListPlus,
  Music,
  Clock,
  Eye,
  ThumbsUp,
  ArrowLeft,
  Shuffle,
  SkipForward,
  SkipBack,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MusicTrack {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  view_count: number | null;
  like_count: number | null;
  created_at: string;
  user_id: string;
  channels: {
    id: string;
    name: string;
    subscriber_count: number | null;
  } | null;
}

export default function MusicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying, togglePlay, queue, addToQueue } = useMusicPlayer();
  const { awardLikeReward } = useAutoReward();
  
  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [relatedTracks, setRelatedTracks] = useState<MusicTrack[]>([]);

  const isCurrentTrack = currentTrack?.id === id;

  useEffect(() => {
    if (id) {
      fetchTrack();
      fetchRelatedTracks();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkLikeStatus();
    }
  }, [user, id]);

  const fetchTrack = async () => {
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
      setTrack(data);

      // Increment view count
      await supabase
        .from("videos")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", id);

    } catch (error: any) {
      toast({
        title: "Lỗi tải bài hát",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedTracks = async () => {
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
        .eq("is_public", true)
        .eq("category", "music")
        .neq("id", id)
        .order("view_count", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRelatedTracks(data || []);
    } catch (error) {
      console.error("Error fetching related tracks:", error);
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

  const handlePlay = () => {
    if (!track) return;
    
    if (isCurrentTrack) {
      togglePlay();
    } else {
      const musicTrack: Track = {
        id: track.id,
        title: track.title,
        thumbnail_url: track.thumbnail_url,
        video_url: track.video_url,
        duration: track.duration,
        channelName: track.channels?.name || "Unknown Artist",
      };
      playTrack(musicTrack);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!id) return;

    try {
      if (hasLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("video_id", id)
          .eq("user_id", user.id)
          .eq("is_dislike", false);
        setHasLiked(false);
        toast({ title: "Đã bỏ thích bài hát" });
      } else {
        await supabase.from("likes").insert({
          video_id: id,
          user_id: user.id,
          is_dislike: false,
        });
        setHasLiked(true);
        
        // Award CAMLY for liking
        await awardLikeReward(id);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddToQueue = () => {
    if (!track) return;
    
    const musicTrack: Track = {
      id: track.id,
      title: track.title,
      thumbnail_url: track.thumbnail_url,
      video_url: track.video_url,
      duration: track.duration,
      channelName: track.channels?.name || "Unknown Artist",
    };
    
    addToQueue(musicTrack);
    toast({
      title: "Đã thêm vào hàng đợi",
      description: track.title,
    });
  };

  // formatDuration and formatViewsShort imported from @/lib/formatters

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Music className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Không tìm thấy bài hát</h1>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/music/${track.id}`;

  return (
    <>
      {/* Dynamic Open Graph Meta Tags */}
      <DynamicMeta
        title={`${track.title} - ${track.channels?.name || "FUN Play"}`}
        description={track.description || `Nghe bài hát "${track.title}" trên FUN Play - Web3 Music Platform`}
        image={track.thumbnail_url || "https://lovable.dev/opengraph-image-p98pqg.png"}
        url={shareUrl}
        type="music.song"
        audio={track.video_url}
      />

      <MainLayout className="pt-2">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {/* Back Button */}
            <Button 
              variant="ghost" 
              className="mb-6 hover:bg-accent"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Album Art & Player */}
                <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20">
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      {/* Album Art */}
                      <motion.div 
                        className="relative group"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={`w-64 h-64 rounded-2xl overflow-hidden shadow-2xl ${isCurrentTrack && isPlaying ? 'animate-pulse' : ''}`}>
                          {track.thumbnail_url ? (
                            <img 
                              src={track.thumbnail_url} 
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                              <Music className="w-24 h-24 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Play overlay */}
                        <motion.button
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                          onClick={handlePlay}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                            {isCurrentTrack && isPlaying ? (
                              <Pause className="w-10 h-10 text-primary-foreground" />
                            ) : (
                              <Play className="w-10 h-10 text-primary-foreground ml-1" />
                            )}
                          </div>
                        </motion.button>
                      </motion.div>

                      {/* Track Info */}
                      <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                            Bài hát
                          </p>
                          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                            {track.title}
                          </h1>
                          <button 
                            onClick={() => track.channels && navigate(`/channel/${track.channels.id}`)}
                            className="text-lg text-primary hover:underline"
                          >
                            {track.channels?.name || "Unknown Artist"}
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatViewsShort(track.view_count)} lượt nghe
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {formatViewsShort(track.like_count)} lượt thích
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(track.duration)}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Phát hành: {formatDate(track.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-8 justify-center md:justify-start">
                      <Button 
                        size="lg" 
                        className="gap-2 bg-primary hover:bg-primary/90"
                        onClick={handlePlay}
                      >
                        {isCurrentTrack && isPlaying ? (
                          <>
                            <Pause className="w-5 h-5" />
                            Tạm dừng
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            Phát ngay
                          </>
                        )}
                      </Button>

                      <Button 
                        size="lg" 
                        variant={hasLiked ? "default" : "outline"}
                        className="gap-2"
                        onClick={handleLike}
                      >
                        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                        {hasLiked ? "Đã thích" : "Thích"}
                      </Button>

                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => setShareModalOpen(true)}
                      >
                        <Share2 className="w-5 h-5" />
                        Chia sẻ
                      </Button>

                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => setPlaylistModalOpen(true)}
                      >
                        <ListPlus className="w-5 h-5" />
                        Thêm vào playlist
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Description */}
                {track.description && (
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-3">Mô tả</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {track.description}
                    </p>
                  </Card>
                )}

                {/* Comments Section */}
                <Card className="p-6">
                  <MusicComments musicId={track.id} />
                </Card>
              </div>

              {/* Sidebar - Related Tracks */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Bài hát liên quan</h2>
                <div className="space-y-3">
                  {relatedTracks.length > 0 ? (
                    relatedTracks.map((relatedTrack) => (
                      <Card 
                        key={relatedTrack.id}
                        className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => navigate(`/music/${relatedTrack.id}`)}
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {relatedTrack.thumbnail_url ? (
                              <img 
                                src={relatedTrack.thumbnail_url}
                                alt={relatedTrack.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{relatedTrack.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {relatedTrack.channels?.name || "Unknown Artist"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatViewsShort(relatedTrack.view_count)} lượt nghe
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Không có bài hát liên quan
                    </p>
                  )}
                </div>
              </div>
            </div>
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          contentType="music"
          contentId={track.id}
          contentTitle={track.title}
          thumbnailUrl={track.thumbnail_url || undefined}
          channelName={track.channels?.name}
          userId={user?.id}
        />

        {/* Add to Playlist Modal */}
        <AddToMusicPlaylistModal
          isOpen={playlistModalOpen}
          onClose={() => setPlaylistModalOpen(false)}
          trackId={track.id}
          trackTitle={track.title}
        />
      </MainLayout>
    </>
  );
}
