import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Edit, Trash2, EyeOff, Plus } from "lucide-react";
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

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  created_at: string;
}

const ManagePlaylists = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [deletePlaylistId, setDeletePlaylistId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPlaylists();
  }, [user, authLoading, navigate]);

  const fetchPlaylists = async () => {
    try {
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
    } else {
      setEditingPlaylist(null);
      setName("");
      setDescription("");
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
        // Update existing playlist
        const { error } = await supabase
          .from("playlists")
          .update({
            name: name.trim(),
            description: description.trim() || null,
          })
          .eq("id", editingPlaylist.id);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Danh sách phát đã được cập nhật",
        });
      } else {
        // Create new playlist
        const { error } = await supabase
          .from("playlists")
          .insert({
            user_id: user?.id,
            name: name.trim(),
            description: description.trim() || null,
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pt-14 lg:pl-64">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Danh sách phát của bạn</h1>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo danh sách phát
            </Button>
          </div>

          {playlists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Bạn chưa có danh sách phát nào</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo danh sách phát đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-card border border-border rounded-lg p-6 flex items-start gap-6"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xl mb-2 text-foreground">{playlist.name}</h3>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${playlist.is_public ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        {playlist.is_public ? 'Công khai' : 'Riêng tư'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(playlist)}
                      className="gap-2 min-w-[100px] justify-start"
                    >
                      <Edit className="h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(playlist.id, playlist.is_public)}
                      className="gap-2 min-w-[100px] justify-start"
                    >
                      <EyeOff className="h-4 w-4" />
                      {playlist.is_public ? 'Ẩn' : 'Hiện'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePlaylistId(playlist.id)}
                      className="gap-2 min-w-[100px] justify-start text-destructive hover:bg-destructive/10 border-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlaylist ? 'Chỉnh sửa danh sách phát' : 'Tạo danh sách phát mới'}</DialogTitle>
            <DialogDescription>
              {editingPlaylist ? 'Cập nhật thông tin danh sách phát' : 'Tạo danh sách phát để tổ chức video của bạn'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Tên danh sách phát (bắt buộc)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên danh sách phát"
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả (tùy chọn)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thêm mô tả cho danh sách phát"
                className="min-h-[100px]"
              />
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
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh sách phát này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePlaylistId && handleDelete(deletePlaylistId)}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManagePlaylists;