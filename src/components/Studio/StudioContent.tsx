import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MoreVertical, Edit, Trash2, Globe, Lock, Video, Upload } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EditVideoModal } from "./EditVideoModal";

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  view_count: number | null;
  created_at: string;
  is_public: boolean | null;
  like_count: number | null;
  comment_count: number | null;
}

export const StudioContent = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, description, thumbnail_url, view_count, created_at, is_public, like_count, comment_count")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVideos(new Set(videos.map(v => v.id)));
    } else {
      setSelectedVideos(new Set());
    }
  };

  const handleSelectVideo = (videoId: string, checked: boolean) => {
    const newSelected = new Set(selectedVideos);
    if (checked) {
      newSelected.add(videoId);
    } else {
      newSelected.delete(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleDelete = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Video đã được xóa vĩnh viễn",
      });

      setVideos(videos.filter(v => v.id !== videoId));
      setDeleteVideoId(null);
    } catch (error: any) {
      console.error("Error deleting video:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa video",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const idsToDelete = Array.from(selectedVideos);
      const { error } = await supabase
        .from("videos")
        .delete()
        .in("id", idsToDelete);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: `Đã xóa ${idsToDelete.length} video`,
      });

      setVideos(videos.filter(v => !selectedVideos.has(v.id)));
      setSelectedVideos(new Set());
      setBulkDeleteOpen(false);
    } catch (error: any) {
      console.error("Error bulk deleting:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa video",
        variant: "destructive",
      });
    }
  };

  const handleVisibilityChange = async (videoId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from("videos")
        .update({ is_public: isPublic })
        .eq("id", videoId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: `Video đã được ${isPublic ? 'công khai' : 'ẩn'}`,
      });

      setVideos(videos.map(v => v.id === videoId ? { ...v, is_public: isPublic } : v));
    } catch (error: any) {
      console.error("Error updating visibility:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  const handleBulkVisibilityChange = async (isPublic: boolean) => {
    try {
      const idsToUpdate = Array.from(selectedVideos);
      const { error } = await supabase
        .from("videos")
        .update({ is_public: isPublic })
        .in("id", idsToUpdate);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: `Đã cập nhật ${idsToUpdate.length} video`,
      });

      setVideos(videos.map(v => selectedVideos.has(v.id) ? { ...v, is_public: isPublic } : v));
      setSelectedVideos(new Set());
    } catch (error: any) {
      console.error("Error bulk updating:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật video",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nội dung của kênh</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {videos.length} video • {selectedVideos.size} đã chọn
          </p>
        </div>
        <Button onClick={() => navigate("/upload")} size="lg">
          <Upload className="mr-2 h-5 w-5" />
          Tải video lên
        </Button>
      </div>

      {selectedVideos.size > 0 && (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
          <span className="text-sm font-medium">{selectedVideos.size} đã chọn</span>
          <Select onValueChange={(value) => handleBulkVisibilityChange(value === "public")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Thay đổi chế độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Công khai</SelectItem>
              <SelectItem value="private">Riêng tư</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </Button>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Chưa có video nào</h3>
          <p className="text-muted-foreground mb-6">Tải video đầu tiên của bạn lên để bắt đầu</p>
          <Button onClick={() => navigate("/upload")} size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Tải video lên
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedVideos.size === videos.length && videos.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border"
                  />
                </TableHead>
                <TableHead className="w-[400px]">Video</TableHead>
                <TableHead className="text-center">Chế độ hiển thị</TableHead>
                <TableHead className="text-center">Ngày</TableHead>
                <TableHead className="text-center">Lượt xem</TableHead>
                <TableHead className="text-center">Bình luận</TableHead>
                <TableHead className="text-center">Lượt thích</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id} className="hover:bg-muted/30">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedVideos.has(video.id)}
                      onChange={(e) => handleSelectVideo(video.id, e.target.checked)}
                      className="rounded border-border"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-32 h-18 object-cover rounded"
                        />
                      ) : (
                        <div className="w-32 h-18 bg-muted rounded flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-2">{video.title}</p>
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={video.is_public !== false ? "public" : "private"}
                      onValueChange={(value) => handleVisibilityChange(video.id, value === "public")}
                    >
                      <SelectTrigger className="w-[140px] mx-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Công khai
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Riêng tư
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      {formatDate(video.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {video.view_count || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {video.comment_count || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {video.like_count || 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setEditingVideo(video)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteVideoId(video.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa vĩnh viễn
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Single delete dialog */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa video vĩnh viễn?</AlertDialogTitle>
            <AlertDialogDescription>
              Video này sẽ bị xóa vĩnh viễn cùng với tất cả bình luận, lượt thích và dữ liệu liên quan. 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVideoId && handleDelete(deleteVideoId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedVideos.size} video?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedVideos.size} video sẽ bị xóa vĩnh viễn cùng với tất cả dữ liệu liên quan. 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit modal */}
      {editingVideo && (
        <EditVideoModal
          video={editingVideo}
          open={!!editingVideo}
          onClose={() => setEditingVideo(null)}
          onSaved={() => {
            fetchVideos();
            setEditingVideo(null);
          }}
        />
      )}
    </div>
  );
};
