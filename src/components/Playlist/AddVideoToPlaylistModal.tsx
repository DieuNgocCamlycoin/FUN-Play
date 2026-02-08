import { useState, useEffect } from "react";
import { Search, Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number | null;
  channel_name?: string;
}

interface AddVideoToPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: string;
  existingVideoIds: string[];
  onVideoAdded?: () => void;
}

import { formatDuration } from "@/lib/formatters";

export function AddVideoToPlaylistModal({
  open,
  onOpenChange,
  playlistId,
  existingVideoIds,
  onVideoAdded,
}: AddVideoToPlaylistModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      searchVideos("");
      setAddedIds(new Set());
    }
  }, [open]);

  const searchVideos = async (query: string) => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from("videos")
        .select(`
          id,
          title,
          thumbnail_url,
          duration,
          channels!inner(name)
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (query.trim()) {
        queryBuilder = queryBuilder.ilike("title", `%${query.trim()}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      const formattedVideos: Video[] = (data || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        duration: v.duration,
        channel_name: v.channels?.name,
      }));

      setVideos(formattedVideos);
    } catch (error) {
      console.error("Error searching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchVideos(searchQuery);
  };

  const handleAddVideo = async (videoId: string) => {
    if (!user) return;
    
    setAddingId(videoId);
    try {
      // Get current max position
      const { data: existing } = await supabase
        .from("playlist_videos")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

      const { error } = await supabase
        .from("playlist_videos")
        .insert({
          playlist_id: playlistId,
          video_id: videoId,
          position: nextPosition,
        });

      if (error) throw error;

      setAddedIds(prev => new Set([...prev, videoId]));
      toast({
        title: "Đã thêm video",
        description: "Video đã được thêm vào danh sách phát",
      });
      onVideoAdded?.();
    } catch (error: any) {
      console.error("Error adding video:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm video",
        variant: "destructive",
      });
    } finally {
      setAddingId(null);
    }
  };

  const isVideoInPlaylist = (videoId: string) => {
    return existingVideoIds.includes(videoId) || addedIds.has(videoId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Thêm video vào danh sách</DialogTitle>
        </DialogHeader>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm video..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={loading}>
            Tìm
          </Button>
        </form>

        {/* Video list */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy video nào
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {videos.map((video) => {
                const inPlaylist = isVideoInPlaylist(video.id);
                const isAdding = addingId === video.id;

                return (
                  <div
                    key={video.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 aspect-video rounded overflow-hidden flex-shrink-0 bg-muted">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                      {video.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                      {video.channel_name && (
                        <p className="text-xs text-muted-foreground mt-1">{video.channel_name}</p>
                      )}
                    </div>

                    {/* Add button */}
                    <Button
                      variant={inPlaylist ? "secondary" : "outline"}
                      size="icon"
                      className="rounded-full flex-shrink-0"
                      disabled={inPlaylist || isAdding}
                      onClick={() => handleAddVideo(video.id)}
                    >
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : inPlaylist ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
