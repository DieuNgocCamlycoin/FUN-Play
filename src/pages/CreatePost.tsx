import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const CreatePost = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { uploadToR2 } = useR2Upload({ folder: 'posts' });

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

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
        title: "Error",
        description: "Vui lòng nhập nội dung bài đăng",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Get or create channel
      const { data: channels } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!channels) {
        throw new Error("Không tìm thấy kênh");
      }

      let imageUrl = null;

      // Upload image to R2 if provided
      if (image) {
        const result = await uploadToR2(image);
        if (result) {
          imageUrl = result.publicUrl;
        }
      }

      // Create post
      const { error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          channel_id: channels.id,
          content,
          image_url: imageUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: "Thành công",
        description: "Bài đăng đã được tạo!",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pt-14 lg:pl-64">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Tạo bài đăng</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="content">Nội dung</Label>
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
                disabled={uploading || !content.trim()}
                className="flex-1"
              >
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Đăng bài
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
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

export default CreatePost;
