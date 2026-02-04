import { useState, useEffect } from "react";
import { Plus, Lock, Globe, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreatePlaylistModal } from "./CreatePlaylistModal";
import { cn } from "@/lib/utils";

interface PlaylistWithSaveState {
  id: string;
  name: string;
  is_public: boolean | null;
  thumbnail_url: string | null;
  video_count: number;
  isSaved: boolean;
}

interface SaveToPlaylistDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle?: string;
}

export function SaveToPlaylistDrawer({
  open,
  onOpenChange,
  videoId,
}: SaveToPlaylistDrawerProps) {
  const [playlists, setPlaylists] = useState<PlaylistWithSaveState[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPlaylists = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's playlists with first video thumbnail
      const { data: playlistData, error } = await supabase
        .from("playlists")
        .select(`
          id,
          name,
          is_public,
          playlist_videos (
            video_id,
            videos (
              thumbnail_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Check which playlists already contain this video
      const { data: savedData } = await supabase
        .from("playlist_videos")
        .select("playlist_id")
        .eq("video_id", videoId);

      const savedPlaylistIds = new Set(savedData?.map((s) => s.playlist_id) || []);

      const formattedPlaylists: PlaylistWithSaveState[] = (playlistData || []).map((p) => {
        const firstVideo = p.playlist_videos?.[0];
        const thumbnail = (firstVideo as any)?.videos?.thumbnail_url || null;
        
        return {
          id: p.id,
          name: p.name,
          is_public: p.is_public,
          thumbnail_url: thumbnail,
          video_count: p.playlist_videos?.length || 0,
          isSaved: savedPlaylistIds.has(p.id),
        };
      });

      setPlaylists(formattedPlaylists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchPlaylists();
    }
  }, [open, user, videoId]);

  const handleToggleSave = async (playlist: PlaylistWithSaveState) => {
    if (!user) return;

    try {
      setSavingId(playlist.id);

      if (playlist.isSaved) {
        // Remove from playlist
        const { error } = await supabase
          .from("playlist_videos")
          .delete()
          .eq("playlist_id", playlist.id)
          .eq("video_id", videoId);

        if (error) throw error;

        toast({
          title: "Đã xóa",
          description: `Đã xóa khỏi "${playlist.name}"`,
        });
      } else {
        // Add to playlist
        const { count } = await supabase
          .from("playlist_videos")
          .select("*", { count: "exact", head: true })
          .eq("playlist_id", playlist.id);

        const { error } = await supabase.from("playlist_videos").insert({
          playlist_id: playlist.id,
          video_id: videoId,
          position: (count || 0) + 1,
        });

        if (error) throw error;

        toast({
          title: "Đã lưu",
          description: `Đã lưu vào "${playlist.name}"`,
        });
      }

      // Update local state
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlist.id
            ? { ...p, isSaved: !p.isSaved, video_count: p.isSaved ? p.video_count - 1 : p.video_count + 1 }
            : p
        )
      );
    } catch (error: any) {
      console.error("Error toggling save:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thực hiện thao tác",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handlePlaylistCreated = () => {
    fetchPlaylists();
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b border-border pb-3">
            <DrawerTitle>Lưu vào...</DrawerTitle>
          </DrawerHeader>

          <div className="overflow-y-auto flex-1 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Bạn chưa có danh sách phát nào</p>
              </div>
            ) : (
              <div className="space-y-1">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleToggleSave(playlist)}
                    disabled={savingId === playlist.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                      {playlist.thumbnail_url ? (
                        <img
                          src={playlist.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-muted-foreground">
                            <div className="w-4 h-0.5 bg-current mb-0.5" />
                            <div className="w-4 h-0.5 bg-current mb-0.5" />
                            <div className="w-4 h-0.5 bg-current" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Playlist info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">
                        {playlist.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {playlist.is_public ? (
                          <Globe className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                        <span>{playlist.is_public ? "Công khai" : "Riêng tư"}</span>
                      </div>
                    </div>

                    {/* Save status indicator */}
                    <div className="flex-shrink-0">
                      {savingId === playlist.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <div
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            playlist.isSaved
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/50"
                          )}
                        >
                          {playlist.isSaved && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create new playlist button */}
          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setCreateModalOpen(true)}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <span className="font-medium">Danh sách phát mới</span>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <CreatePlaylistModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={handlePlaylistCreated}
        videoIdToAdd={videoId}
      />
    </>
  );
}
