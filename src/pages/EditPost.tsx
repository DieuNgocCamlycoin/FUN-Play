import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useR2Upload } from "@/hooks/useR2Upload";
import { Image, Loader2 } from "lucide-react";

const EditPost = () => {
  const { id } = useParams<{ id: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { uploadToR2 } = useR2Upload({ folder: 'posts' });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPost();
  }, [user, id, navigate]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("content, image_url, user_id")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.user_id !== user?.id) {
        toast({
          title: "Lỗi",
          description: "Bạn không có quyền chỉnh sửa bài viết này",
          variant: "destructive",
        });
        navigate("/manage-posts");
        return;
      }

      setContent(data.content);
      setCurrentImageUrl(data.image_url);
      setImagePreview(data.image_url);
    } catch (error: any) {
      console.error("Error fetching post:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải bài viết",
        variant: "destructive",
      });
      navigate("/manage-posts");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      let imageUrl = currentImageUrl;

      // Upload new image to R2 if provided
      if (image) {
        const result = await uploadToR2(image);
        if (result) {
          imageUrl = result.publicUrl;
        }
      }

      const { error } = await supabase
        .from("posts")
        .update({
          content: content.trim(),
          image_url: imageUrl,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Bài viết đã được cập nhật",
      });

      navigate("/manage-posts");
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Chỉnh sửa bài viết</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="content">Nội dung (bắt buộc)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bạn đang nghĩ gì?"
                className="min-h-[200px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="image">Hình ảnh (tùy chọn)</Label>
              <div className="mt-2">
                <label htmlFor="image" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded" />
                    ) : (
                      <div className="space-y-2">
                        <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Nhấn để chọn hình ảnh</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving || !content.trim()}
                className="flex-1"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/manage-posts")}
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditPost;