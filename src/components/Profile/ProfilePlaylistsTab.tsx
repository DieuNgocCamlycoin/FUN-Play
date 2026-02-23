import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListMusic, Plus, Play, Lock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { CreatePlaylistModal } from "@/components/Playlist/CreatePlaylistModal";
import { EditPlaylistModal } from "@/components/Playlist/EditPlaylistModal";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface ProfilePlaylistsTabProps {
  userId: string;
  isOwnProfile: boolean;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  video_count: number;
  thumbnail_url?: string;
}

export const ProfilePlaylistsTab = ({ userId, isOwnProfile }: ProfilePlaylistsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [deletePlaylistId, setDeletePlaylistId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, [userId]);

  const fetchPlaylists = async () => {
    try {
      let query = supabase
        .from("playlists")
        .select(`
          id,
          name,
          description,
          is_public,
          playlist_videos(video_id, videos(thumbnail_url))
        `)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (!isOwnProfile) {
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      const processedPlaylists = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        is_public: p.is_public,
        video_count: p.playlist_videos?.length || 0,
        thumbnail_url: p.playlist_videos?.[0]?.videos?.thumbnail_url,
      }));

      setPlaylists(processedPlaylists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!deletePlaylistId) return;
    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", deletePlaylistId);
      if (error) throw error;

      setPlaylists((prev) => prev.filter((p) => p.id !== deletePlaylistId));
      toast({ title: "Đã xóa playlist thành công" });
    } catch (error: any) {
      console.error("Error deleting playlist:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa playlist",
        variant: "destructive",
      });
    } finally {
      setDeletePlaylistId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-muted rounded-xl mb-2" />
            <div className="h-4 bg-muted rounded w-3/4 mb-1" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwnProfile && (
        <Button
          onClick={() => setCreateModalOpen(true)}
          variant="outline"
          className="border-dashed border-[hsl(var(--cosmic-cyan))]/50 hover:border-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan))]/5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo playlist mới
        </Button>
      )}

      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((playlist, index) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="overflow-hidden cursor-pointer group hover:border-[hsl(var(--cosmic-cyan))]/50 transition-all duration-300 relative"
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/20 to-[hsl(var(--cosmic-magenta))]/20">
                  {playlist.thumbnail_url ? (
                    <img
                      src={playlist.thumbnail_url}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ListMusic className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-foreground fill-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Video Count Badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1">
                    <ListMusic className="w-3 h-3" />
                    {playlist.video_count} video
                  </div>

                  {/* Private Badge */}
                  {!playlist.is_public && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Riêng tư
                    </div>
                  )}

                  {/* 3-dot Menu (owner only, show on hover) */}
                  {isOwnProfile && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4 text-white" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover z-50">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPlaylist(playlist);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Sửa playlist
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletePlaylistId(playlist.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa playlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-[hsl(var(--cosmic-cyan))] transition-colors">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {playlist.description}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/20 to-[hsl(var(--cosmic-magenta))]/20 flex items-center justify-center">
            <ListMusic className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có Playlist</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {isOwnProfile
              ? "Tạo playlist đầu tiên để sắp xếp video yêu thích!"
              : "Người dùng này chưa tạo playlist nào."}
          </p>
          {isOwnProfile && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo playlist
            </Button>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={fetchPlaylists}
      />

      {/* Edit Playlist Modal */}
      {editingPlaylist && (
        <EditPlaylistModal
          open={!!editingPlaylist}
          onOpenChange={(open) => { if (!open) setEditingPlaylist(null); }}
          playlist={{
            id: editingPlaylist.id,
            name: editingPlaylist.name,
            description: editingPlaylist.description,
            is_public: editingPlaylist.is_public,
          }}
          onUpdated={fetchPlaylists}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePlaylistId} onOpenChange={(open) => { if (!open) setDeletePlaylistId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Playlist và tất cả liên kết video trong đó sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlaylist}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
