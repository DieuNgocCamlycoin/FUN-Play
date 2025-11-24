import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Edit, Trash2, Globe, Lock, Plus, ListVideo } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  created_at: string;
}

export const StudioPlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [deletePlaylistId, setDeletePlaylistId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name, description, is_public, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error: any) {
      console.error("Error fetching playlists:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phát",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (playlist?: Playlist) => {
    if (playlist) {
      setEditingPlaylist(playlist);
      setName(playlist.name);
      setDescription(playlist.description || "");
      setIsPublic(playlist.is_public !== false);
    } else {
      setEditingPlaylist(null);
      setName("");
      setDescription("");
      setIsPublic(true);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên danh sách phát",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      if (editingPlaylist) {
        const { error } = await supabase
          .from("playlists")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            is_public: isPublic,
          })
          .eq("id", editingPlaylist.id);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Danh sách phát đã được cập nhật",
        });
      } else {
        const { error } = await supabase
          .from("playlists")
          .insert({
            user_id: user?.id,
            name: name.trim(),
            description: description.trim() || null,
            is_public: isPublic,
          });

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Danh sách phát đã được tạo",
        });
      }

      setDialogOpen(false);
      fetchPlaylists();
    } catch (error: any) {
      console.error("Error saving playlist:", error);
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Danh sách phát đã được xóa",
      });

      setPlaylists(playlists.filter(p => p.id !== playlistId));
      setDeletePlaylistId(null);
    } catch (error: any) {
      console.error("Error deleting playlist:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa danh sách phát",
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (playlistId: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from("playlists")
        .update({ is_public: !currentStatus })
        .eq("id", playlistId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: currentStatus ? "Danh sách phát đã được ẩn" : "Danh sách phát đã được công khai",
      });

      setPlaylists(playlists.map(p => p.id === playlistId ? { ...p, is_public: !currentStatus } : p));
    } catch (error: any) {
      console.error("Error toggling visibility:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Danh sách phát của kênh</h1>
          <p className="text-sm text-muted-foreground mt-1">{playlists.length} danh sách phát</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Tạo danh sách phát
        </Button>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <ListVideo className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Chưa có danh sách phát nào</h3>
          <p className="text-muted-foreground mb-6">Tạo danh sách phát để tổ chức video của bạn</p>
          <Button onClick={() => handleOpenDialog()} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Tạo danh sách phát
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-card border border-border rounded-lg p-6 flex items-start gap-6 hover:border-primary/50 transition-colors"
            >
              <div className="h-24 w-40 bg-muted rounded flex items-center justify-center flex-shrink-0">
                <ListVideo className="h-12 w-12 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{playlist.name}</h3>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      {playlist.is_public !== false ? (
                        <span className="flex items-center gap-1.5 text-primary">
                          <Globe className="h-4 w-4" />
                          Công khai
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Lock className="h-4 w-4" />
                          Riêng tư
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(playlist)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(playlist.id, playlist.is_public)}
                    >
                      {playlist.is_public ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePlaylistId(playlist.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlaylist ? 'Chỉnh sửa danh sách phát' : 'Tạo danh sách phát mới'}
            </DialogTitle>
            <DialogDescription>
              {editingPlaylist ? 'Cập nhật thông tin danh sách phát của bạn' : 'Tổ chức video của bạn bằng danh sách phát'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="playlist-name">Tên (bắt buộc)</Label>
              <Input
                id="playlist-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên danh sách phát"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="playlist-description">Mô tả (tùy chọn)</Label>
              <Textarea
                id="playlist-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thêm mô tả cho danh sách phát"
                className="mt-2 min-h-[100px]"
              />
            </div>

            <div>
              <Label>Chế độ hiển thị</Label>
              <Select value={isPublic ? "public" : "private"} onValueChange={(v) => setIsPublic(v === "public")}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Công khai - Mọi người đều có thể xem</SelectItem>
                  <SelectItem value="private">Riêng tư - Chỉ bạn có thể xem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Đang lưu..." : editingPlaylist ? "Cập nhật" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePlaylistId} onOpenChange={() => setDeletePlaylistId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh sách phát?</AlertDialogTitle>
            <AlertDialogDescription>
              Danh sách phát này sẽ bị xóa vĩnh viễn. Video trong danh sách phát sẽ không bị xóa.
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePlaylistId && handleDelete(deletePlaylistId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
