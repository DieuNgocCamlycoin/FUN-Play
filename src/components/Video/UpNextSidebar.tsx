import { useVideoPlayback, VideoItem } from "@/contexts/VideoPlaybackContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Play,
  X,
  GripVertical,
  ListMusic,
  ListPlus,
  ExternalLink
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UpNextSidebarProps {
  onVideoSelect?: (video: VideoItem) => void;
}

interface PlaylistInfo {
  id: string;
  name: string;
  video_count: number;
}

export function UpNextSidebar({ onVideoSelect }: UpNextSidebarProps) {
  const navigate = useNavigate();
  const {
    session,
    currentVideo,
    isAutoplayEnabled,
    setAutoplay,
    setShuffle,
    setRepeat,
    skipToVideo,
    removeFromQueue,
    reorderQueue,
    getUpNext,
  } = useVideoPlayback();

  const [isReordering, setIsReordering] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);

  // Fetch playlist info if context is PLAYLIST
  useEffect(() => {
    if (session?.context_type === "PLAYLIST" && session.context_id) {
      fetchPlaylistInfo(session.context_id);
    } else {
      setPlaylistInfo(null);
    }
  }, [session?.context_type, session?.context_id]);

  const fetchPlaylistInfo = async (playlistId: string) => {
    const { data } = await supabase
      .from("playlists")
      .select("id, name")
      .eq("id", playlistId)
      .single();
    
    if (data) {
      setPlaylistInfo({
        id: data.id,
        name: data.name,
        video_count: session?.queue.length || 0,
      });
    }
  };

  if (!session) return null;

  const upNextVideos = getUpNext(10);
  const queueLength = session.queue.length;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViews = (views: number | null) => {
    if (!views) return "0 views";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const handleVideoClick = (video: VideoItem) => {
    if (onVideoSelect) {
      onVideoSelect(video);
    } else {
      skipToVideo(video.id);
      navigate(`/watch/${video.id}${session.context_type === "PLAYLIST" && session.context_id ? `?list=${session.context_id}` : ''}`);
    }
  };

  const handleReorder = (newOrder: VideoItem[]) => {
    const fromVideo = session.queue.find(v => 
      !newOrder.find(n => n.id === v.id && session.queue.indexOf(v) === newOrder.indexOf(n))
    );
    if (fromVideo) {
      const fromIdx = session.queue.indexOf(fromVideo);
      const toIdx = newOrder.findIndex(n => n.id === fromVideo.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        reorderQueue(fromIdx, toIdx);
      }
    }
  };

  const getRepeatIcon = () => {
    switch (session.repeat) {
      case "one":
        return <Repeat1 className="h-4 w-4" />;
      default:
        return <Repeat className="h-4 w-4" />;
    }
  };

  const cycleRepeat = () => {
    const modes: ("off" | "all" | "one")[] = ["off", "all", "one"];
    const currentIdx = modes.indexOf(session.repeat);
    const nextIdx = (currentIdx + 1) % modes.length;
    setRepeat(modes[nextIdx]);
  };

  return (
    <div className="space-y-4">
      {/* Playlist Header (if in playlist context) */}
      {playlistInfo && (
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-4 border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListPlus className="h-5 w-5 text-primary" />
              <div>
                <Link 
                  to={`/playlist/${playlistInfo.id}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {playlistInfo.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {session.current_index + 1}/{playlistInfo.video_count} videos
                </p>
              </div>
            </div>
            <Link to={`/playlist/${playlistInfo.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header with controls */}
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Up Next</span>
            {!playlistInfo && (
              <span className="text-sm text-muted-foreground">
                ({session.current_index + 1}/{queueLength})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full ${session.shuffle ? "text-primary bg-primary/20" : ""}`}
              onClick={() => setShuffle(!session.shuffle)}
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full ${session.repeat !== "off" ? "text-primary bg-primary/20" : ""}`}
              onClick={cycleRepeat}
              title={`Repeat: ${session.repeat}`}
            >
              {getRepeatIcon()}
            </Button>
          </div>
        </div>

        {/* Autoplay toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Autoplay</span>
          <Switch
            checked={isAutoplayEnabled}
            onCheckedChange={setAutoplay}
          />
        </div>
      </div>

      {/* Currently Playing */}
      {currentVideo && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-3 border border-primary/20">
          <span className="text-xs font-medium text-primary mb-2 block">
            Now Playing
          </span>
          <div className="flex gap-3">
            <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={currentVideo.thumbnail_url || "/placeholder.svg"}
                alt={currentVideo.title}
                className="w-full h-full object-cover"
              />
              {currentVideo.duration && (
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                  {formatDuration(currentVideo.duration)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground line-clamp-2">
                {currentVideo.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {currentVideo.channel_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Up Next List */}
      <ScrollArea className="h-[calc(100vh-450px)] min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {upNextVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
              onClick={() => handleVideoClick(video)}
            >
              {/* Index number */}
              <div className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                {isReordering ? (
                  <GripVertical className="h-4 w-4 cursor-grab" />
                ) : (
                  <span className="group-hover:hidden">{index + 1}</span>
                )}
                <Play className="h-4 w-4 hidden group-hover:block" />
              </div>

              {/* Thumbnail */}
              <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={video.thumbnail_url || "/placeholder.svg"}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
                {video.duration && (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(video.duration)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {video.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {video.channel_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatViews(video.view_count)} views
                </p>
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromQueue(video.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {upNextVideos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ListMusic className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No more videos in queue</p>
          </div>
        )}
      </ScrollArea>

      {/* Queue info */}
      {session.history.length > 1 && (
        <div className="text-xs text-center text-muted-foreground">
          {session.history.length} videos played this session
        </div>
      )}
    </div>
  );
}
