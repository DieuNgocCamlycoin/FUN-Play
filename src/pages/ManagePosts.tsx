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

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  like_count: number | null;
  comment_count: number | null;
  created_at: string;
  is_public: boolean | null;
}

const ManagePosts = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPosts();
  }, [user, navigate]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, image_url, like_count, comment_count, created_at, is_public")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải bài viết",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Bài viết đã được xóa",
      });

      setPosts(posts.filter(p => p.id !== postId));
      setDeletePostId(null);
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài viết",
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (postId: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_public: !currentStatus })
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: currentStatus ? "Bài viết đã được ẩn" : "Bài viết đã được công khai",
      });

      setPosts(posts.map(p => p.id === postId ? { ...p, is_public: !currentStatus } : p));
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
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pt-12 lg:pt-14 lg:pl-64">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Bài viết của bạn</h1>
            <Button onClick={() => navigate("/create-post")}>
              Tạo bài viết mới
            </Button>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Bạn chưa có bài viết nào</p>
              <Button onClick={() => navigate("/create-post")}>
                Tạo bài viết đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-card border border-border rounded-lg p-6 flex items-start gap-6"
                >
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-40 h-24 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground mb-3 line-clamp-3">{post.content}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{post.like_count || 0} thích</span>
                      <span>•</span>
                      <span>{post.comment_count || 0} bình luận</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${post.is_public ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        {post.is_public ? 'Công khai' : 'Ẩn'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/edit-post/${post.id}`)}
                      className="gap-2 min-w-[100px] justify-start"
                    >
                      <Edit className="h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(post.id, post.is_public)}
                      className="gap-2 min-w-[100px] justify-start"
                    >
                      <EyeOff className="h-4 w-4" />
                      {post.is_public ? 'Ẩn' : 'Hiện'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePostId(post.id)}
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

      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePostId && handleDelete(deletePostId)}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManagePosts;