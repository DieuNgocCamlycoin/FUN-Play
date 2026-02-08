import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useR2Upload } from "@/hooks/useR2Upload";
import { Image, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { uploadToR2 } = useR2Upload({ folder: 'posts' });

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) { navigate("/auth"); return null; }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { toast({ title: "Lỗi", description: "Vui lòng nhập nội dung bài đăng", variant: "destructive" }); return; }
    try {
      setUploading(true);
      const { data: channels } = await supabase.from("channels").select("id").eq("user_id", user.id).single();
      if (!channels) throw new Error("Không tìm thấy kênh");
      let imageUrl = null;
      if (image) { const result = await uploadToR2(image); if (result) imageUrl = result.publicUrl; }
      const { error: insertError } = await supabase.from("posts").insert({ user_id: user.id, channel_id: channels.id, content, image_url: imageUrl });
      if (insertError) throw insertError;
      toast({ title: "Thành công", description: "Bài đăng đã được tạo!" });
      navigate("/");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-[hsl(var(--cosmic-gold))]" />Tạo bài đăng</h1>
            <p className="text-sm text-muted-foreground">Chia sẻ suy nghĩ với cộng đồng</p>
          </div>
        </motion.div>
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border border-border/50 p-4 sm:p-6 shadow-lg">
          <div className="space-y-2">
            <Label htmlFor="content" className="text-base font-semibold">Nội dung <span className="text-destructive">*</span></Label>
            <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Bạn đang nghĩ gì? Chia sẻ ánh sáng của bạn với cộng đồng... ✨" className="min-h-[180px] text-base resize-none" required />
            <p className="text-xs text-muted-foreground text-right">{content.length}/5000</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="image" className="text-base font-semibold flex items-center gap-2"><Image className="h-4 w-4" />Hình ảnh (tùy chọn)</Label>
            <label htmlFor="image" className="cursor-pointer block">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="border-2 border-dashed border-border rounded-xl p-6 sm:p-8 text-center hover:border-primary/50 hover:bg-muted/30 transition-all duration-300">
                {imagePreview ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                    <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                    <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImage(null); setImagePreview(null); }}>Xóa</Button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center"><Image className="h-8 w-8 text-muted-foreground" /></div>
                    <p className="text-sm text-muted-foreground">Nhấn để chọn hình ảnh</p>
                    <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP • Tối đa 10MB</p>
                  </div>
                )}
              </motion.div>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1 min-h-[48px] order-2 sm:order-1">Hủy</Button>
            <Button type="submit" disabled={uploading || !content.trim()} className="flex-1 min-h-[48px] bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg order-1 sm:order-2">
              {uploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đăng...</>) : (<><Sparkles className="mr-2 h-4 w-4" />Đăng bài</>)}
            </Button>
          </div>
        </motion.form>
      </div>
    </MainLayout>
  );
};

export default CreatePost;
