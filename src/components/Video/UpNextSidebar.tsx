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
  ListMusic,
  ListPlus,
  ExternalLink
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useVideoNavigation } from "@/lib/videoNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlaceholder } from "./VideoPlaceholder";
import { formatDuration, formatViews, formatTimestamp } from "@/lib/formatters";

interface UpNextSidebarProps {
  onVideoSelect?: (video: VideoItem) => void;
  currentChannelId?: string;
  currentCategory?: string | null;
}

interface PlaylistInfo {
  id: string;
  name: string;
  video_count: number;
}

type FilterType = "all" | "same_channel" | "related";

export function UpNextSidebar({ onVideoSelect, currentChannelId, currentCategory }: UpNextSidebarProps) {
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

  const { goToVideo } = useVideoNavigation();
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

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

  const [displayCount, setDisplayCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const upNextVideos = session ? getUpNext(displayCount) : [];
  const queueLength = session?.queue.length || 0;
  const hasMore = session ? session.current_index + displayCount < queueLength : false;

  // Filter videos based on active filter
  const filteredVideos = useMemo(() => {
    if (activeFilter === "all") return upNextVideos;
    if (activeFilter === "same_channel" && currentChannelId) {
      return upNextVideos.filter(v => v.channel_id === currentChannelId);
    }
    if (activeFilter === "related" && currentCategory) {
      return upNextVideos.filter(v => (v as any).category === currentCategory);
    }
    return upNextVideos;
  }, [upNextVideos, activeFilter, currentChannelId, currentCategory]);

  if (!session) return null;

  const handleVideoClick = (video: VideoItem) => {
    if (onVideoSelect) {
      onVideoSelect(video);
    } else {
      skipToVideo(video.id);
      const qp = session.context_type === "PLAYLIST" && session.context_id ? `?list=${session.context_id}` : '';
      goToVideo(video.id, qp);
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

  const filterChips: { key: FilterType; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "same_channel", label: "Cùng kênh" },
    { key: "related", label: "Liên quan" },
  ];

  return (
    <div className="space-y-3">
      {/* Playlist Header (if in playlist context) */}
      {playlistInfo && (
        <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListPlus className="h-4 w-4 text-primary" />
              <div>
                <Link 
                  to={`/playlist/${playlistInfo.id}`}
                  className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
                >
                  {playlistInfo.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {session.current_index + 1}/{playlistInfo.video_count}
                </p>
              </div>
            </div>
            <Link to={`/playlist/${playlistInfo.id}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7 !shadow-none !border-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Compact controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">Tiếp theo</span>
          {!playlistInfo && (
            <span className="text-xs text-muted-foreground">
              ({session.current_index + 1}/{queueLength})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Autoplay toggle */}
          <span className="text-xs text-muted-foreground mr-1">Tự động phát</span>
          <Switch
            checked={isAutoplayEnabled}
            onCheckedChange={setAutoplay}
            className="scale-75"
          />
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-full !shadow-none !border-0 ${session.shuffle ? "text-primary bg-primary/15" : ""}`}
            onClick={() => setShuffle(!session.shuffle)}
            title="Xáo trộn"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-full !shadow-none !border-0 ${session.repeat !== "off" ? "text-primary bg-primary/15" : ""}`}
            onClick={cycleRepeat}
            title={session.repeat === "off" ? "Lặp lại: tắt" : session.repeat === "all" ? "Lặp lại: tất cả" : "Lặp lại: một bài"}
          >
            {getRepeatIcon()}
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2">
        {filterChips.map(chip => (
          <button
            key={chip.key}
            onClick={() => setActiveFilter(chip.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === chip.key
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Up Next List */}
      <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: index * 0.03 }}
              className="group relative flex gap-2 p-1.5 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
              onClick={() => handleVideoClick(video)}
            >
              {/* Thumbnail — larger */}
              <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <VideoPlaceholder className="group-hover:opacity-90 transition-opacity" />
                )}
                {video.duration && (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-medium">
                    {formatDuration(video.duration)}
                  </span>
                )}
                {/* Play icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/60 rounded-full p-1.5">
                    <Play className="h-4 w-4 text-white fill-white" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5">
                <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {video.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {video.channel_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatViews(video.view_count)}
                </p>
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1.5 right-1.5 !shadow-none !border-0"
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

        {filteredVideos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ListMusic className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {activeFilter !== "all" ? "Không có video phù hợp bộ lọc" : "Không còn video trong hàng đợi"}
            </p>
          </div>
        )}

        {/* Show More button */}
        {hasMore && activeFilter === "all" && (
          <div className="py-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 !shadow-none !border-0"
              onClick={() => {
                setIsLoadingMore(true);
                setTimeout(() => {
                  setDisplayCount(prev => prev + 20);
                  setIsLoadingMore(false);
                }, 300);
              }}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Đang tải..." : "Hiển thị thêm"}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
