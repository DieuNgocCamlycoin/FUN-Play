import { useState, useEffect } from "react";
import { Plus, ListVideo, Check, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlaylistOperations } from "@/hooks/usePlaylistOperations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AddToPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle?: string;
}

interface PlaylistItem {
  id: string;
  name: string;
  is_public: boolean | null;
  hasVideo: boolean;
}

export function AddToPlaylistModal({
  open,
  onOpenChange,
  videoId,
  videoTitle,
}: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const { user } = useAuth();
  const { addVideoToPlaylist, removeVideoFromPlaylist, createPlaylistWithVideo } = usePlaylistOperations();

  // Fetch playlists and check if video is already in each
  useEffect(() => {
    if (!open || !user) return;

    const fetchPlaylistsWithVideoStatus = async () => {
      setLoading(true);
      try {
        // Get all user playlists
        const { data: userPlaylists } = await supabase
          .from("playlists")
          .select("id, name, is_public")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!userPlaylists) {
          setPlaylists([]);
          return;
        }

        // Check which playlists contain this video
        const { data: videoInPlaylists } = await supabase
          .from("playlist_videos")
          .select("playlist_id")
          .eq("video_id", videoId);

        const videoPlaylistIds = new Set(videoInPlaylists?.map(v => v.playlist_id) || []);

        setPlaylists(
          userPlaylists.map(p => ({
            id: p.id,
            name: p.name,
            is_public: p.is_public,
            hasVideo: videoPlaylistIds.has(p.id),
          }))
        );
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistsWithVideoStatus();
  }, [open, user, videoId]);

  const handleTogglePlaylist = async (playlist: PlaylistItem) => {
    if (playlist.hasVideo) {
      const success = await removeVideoFromPlaylist(playlist.id, videoId);
      if (success) {
        setPlaylists(prev =>
          prev.map(p => (p.id === playlist.id ? { ...p, hasVideo: false } : p))
        );
      }
    } else {
      const success = await addVideoToPlaylist(playlist.id, videoId);
      if (success) {
        setPlaylists(prev =>
          prev.map(p => (p.id === playlist.id ? { ...p, hasVideo: true } : p))
        );
      }
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    setCreating(true);
    const playlistId = await createPlaylistWithVideo(newPlaylistName.trim(), videoId);
    setCreating(false);

    if (playlistId) {
      setPlaylists(prev => [
        { id: playlistId, name: newPlaylistName.trim(), is_public: true, hasVideo: true },
        ...prev,
      ]);
      setNewPlaylistName("");
      setShowCreateInput(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lưu video vào...</DialogTitle>
          {videoTitle && (
            <DialogDescription className="truncate">
              {videoTitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    onClick={() => handleTogglePlaylist(playlist)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${
                        playlist.hasVideo
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {playlist.hasVideo && <Check className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{playlist.name}</p>
                    </div>
                    {playlist.is_public !== false ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}

                {playlists.length === 0 && !showCreateInput && (
                  <div className="text-center py-8">
                    <ListVideo className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Bạn chưa có danh sách phát nào</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            {showCreateInput ? (
              <div className="flex gap-2">
                <Input
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  placeholder="Tên danh sách phát mới"
                  onKeyDown={e => e.key === "Enter" && handleCreatePlaylist()}
                  autoFocus
                />
                <Button onClick={handleCreatePlaylist} disabled={creating || !newPlaylistName.trim()}>
                  {creating ? "..." : "Tạo"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateInput(false)}>
                  Hủy
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => setShowCreateInput(true)}
              >
                <Plus className="h-5 w-5" />
                Tạo danh sách phát mới
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
