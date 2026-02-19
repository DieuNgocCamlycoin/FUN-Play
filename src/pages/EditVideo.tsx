import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { validateVideoTitle, TITLE_PPLP_TEXT, validateVideoDescription, getHashtagHint, MAX_DESCRIPTION_LENGTH, DESCRIPTION_PLACEHOLDER } from "@/lib/videoUploadValidation";

const EditVideo = () => {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => { if (!user) { navigate("/auth"); return; } fetchVideo(); }, [user, id, navigate]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase.from("videos").select("title, description, user_id").eq("id", id).single();
      if (error) throw error;
      if (data.user_id !== user?.id) { toast({ title: "Lỗi", description: "Bạn không có quyền chỉnh sửa video này", variant: "destructive" }); navigate("/your-videos"); return; }
      setTitle(data.title); setDescription(data.description || "");
    } catch (error: any) { console.error("Error fetching video:", error); toast({ title: "Lỗi", description: "Không thể tải video", variant: "destructive" }); navigate("/your-videos"); }
    finally { setLoading(false); }
  };

  const titleValidation = validateVideoTitle(title);
  const descriptionValidation = validateVideoDescription(description);
  const hashtagHint = getHashtagHint(description);
  const isTitleValid = title.trim().length > 0 && titleValidation.ok;
  const isFormValid = isTitleValid && descriptionValidation.ok;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !titleValidation.ok) { toast({ title: "Lỗi", description: titleValidation.reason || "Vui lòng nhập tiêu đề", variant: "destructive" }); return; }
    try {
      setSaving(true);
      const { error } = await supabase.from("videos").update({ title: title.trim(), description: description.trim() || null }).eq("id", id);
      if (error) throw error;
      toast({ title: "Thành công", description: "Video đã được cập nhật" }); navigate("/your-videos");
    } catch (error: any) { console.error("Error updating video:", error); toast({ title: "Lỗi", description: error.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Đang tải...</div>;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Chỉnh sửa video</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><Label htmlFor="title">Tiêu đề (bắt buộc)</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề video" required />{!titleValidation.ok && title.length > 0 && <p className="text-xs text-destructive mt-1">{titleValidation.reason}</p>}<p className="text-xs text-muted-foreground italic mt-1">{TITLE_PPLP_TEXT}</p></div>
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))} placeholder={DESCRIPTION_PLACEHOLDER} className="min-h-[150px]" maxLength={MAX_DESCRIPTION_LENGTH} />
            <div className="flex justify-between mt-1">
              <p className={`text-xs ${!descriptionValidation.ok && description.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>{!descriptionValidation.ok && description.length > 0 ? descriptionValidation.reason : descriptionValidation.ok ? "✓ Đủ yêu cầu" : ""}</p>
              <p className="text-xs text-muted-foreground">{description.length}/{MAX_DESCRIPTION_LENGTH}</p>
            </div>
            {hashtagHint && <p className="text-xs text-blue-500 mt-1">{hashtagHint}</p>}
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={saving || !isFormValid} className="flex-1">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu thay đổi</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/your-videos")}>Hủy</Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditVideo;
