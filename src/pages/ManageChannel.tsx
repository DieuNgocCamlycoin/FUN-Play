import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useR2Upload } from "@/hooks/useR2Upload";
import { Loader2, Upload } from "lucide-react";

const ManageChannel = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { uploadToR2, uploading: r2Uploading } = useR2Upload({ folder: "banners" });

  useEffect(() => { if (!user) { navigate("/auth"); return; } fetchChannel(); }, [user, navigate]);

  const fetchChannel = async () => {
    try {
      const { data, error } = await supabase.from("channels").select("id, name, description, banner_url").eq("user_id", user?.id).single();
      if (error) throw error;
      if (data) { setChannelId(data.id); setName(data.name); setDescription(data.description || ""); setCurrentBannerUrl(data.banner_url); setBannerPreview(data.banner_url); }
    } catch (error: any) { console.error("Error fetching channel:", error); toast({ title: "Lỗi", description: "Không thể tải thông tin kênh", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setBanner(file); const reader = new FileReader(); reader.onloadend = () => setBannerPreview(reader.result as string); reader.readAsDataURL(file); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Lỗi", description: "Vui lòng nhập tên kênh", variant: "destructive" }); return; }
    try {
      setSaving(true);
      let bannerUrl = currentBannerUrl;
      if (banner) { const result = await uploadToR2(banner, `banner-${user?.id}-${Date.now()}`); if (result) bannerUrl = result.publicUrl; else throw new Error("Failed to upload banner"); }
      const { error } = await supabase.from("channels").update({ name: name.trim(), description: description.trim() || null, banner_url: bannerUrl }).eq("id", channelId);
      if (error) throw error;
      toast({ title: "Thành công", description: "Kênh đã được cập nhật" }); fetchChannel();
    } catch (error: any) { console.error("Error updating channel:", error); toast({ title: "Lỗi", description: error.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Quản lý kênh</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><Label htmlFor="name">Tên kênh (bắt buộc)</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên kênh" required /></div>
          <div><Label htmlFor="description">Mô tả kênh</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Thêm mô tả cho kênh của bạn" className="min-h-[150px]" /></div>
          <div>
            <Label htmlFor="banner">Banner kênh</Label>
            <label htmlFor="banner" className="cursor-pointer block mt-2">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                {bannerPreview ? <img src={bannerPreview} alt="Banner preview" className="w-full max-h-48 object-cover rounded" /> : (
                  <div className="space-y-2"><Upload className="h-12 w-12 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">Nhấn để chọn banner (khuyến nghị: 2560 x 1440)</p></div>
                )}
              </div>
              <Input id="banner" type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
            </label>
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={saving || r2Uploading || !name.trim()} className="flex-1">{(saving || r2Uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{r2Uploading ? "Đang tải banner..." : "Lưu thay đổi"}</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/")}>Hủy</Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default ManageChannel;
