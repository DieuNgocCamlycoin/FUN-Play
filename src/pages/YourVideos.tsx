import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Edit, Trash2, EyeOff } from "lucide-react";
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

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  view_count: number | null;
  created_at: string;
}

const YourVideos = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchVideos();
  }, [user, navigate]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, description, thumbnail_url, view_count, created_at")
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

  const handleDelete = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Video đã được xóa",
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
            <h1 className="text-3xl font-bold">Video của bạn</h1>
            <Button onClick={() => navigate("/upload")}>
              Tải video lên
            </Button>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Bạn chưa có video nào</p>
              <Button onClick={() => navigate("/upload")}>
                Tải video đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-card border border-border rounded-lg p-4 flex gap-4 hover:bg-accent transition-colors"
                >
                  {video.thumbnail_url && (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-48 h-27 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {video.view_count || 0} lượt xem • {new Date(video.created_at).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/edit-video/${video.id}`)}
                      className="gap-2 bg-green-500/10 border-green-500/20 hover:bg-green-500/20 text-green-600"
                    >
                      <Edit className="h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-600"
                    >
                      <EyeOff className="h-4 w-4" />
                      Ẩn
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteVideoId(video.id)}
                      className="gap-2 bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-600"
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

      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa video này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteVideoId && handleDelete(deleteVideoId)}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default YourVideos;
