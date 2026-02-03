import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useR2Upload } from "@/hooks/useR2Upload";
import { Loader2, Upload, Film } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { extractVideoThumbnailFromUrl } from "@/lib/videoThumbnail";

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_public: boolean | null;
  video_url?: string;
}

interface EditVideoModalProps {
  video: Video;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const EditVideoModal = ({ video, open, onClose, onSaved }: EditVideoModalProps) => {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || "");
  const [isPublic, setIsPublic] = useState(video.is_public !== false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail_url);
  const [saving, setSaving] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const { toast } = useToast();
  const { uploadToR2 } = useR2Upload({ folder: 'thumbnails' });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateFromVideo = async () => {
    if (!video.video_url) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy URL video",
        variant: "destructive",
      });
      return;
    }

    // Check if it's an external URL (YouTube, etc.)
    if (video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be')) {
      toast({
        title: "Không hỗ trợ",
        description: "Không thể tạo thumbnail từ video YouTube. Vui lòng tải lên thumbnail riêng.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingThumbnail(true);
    try {
      const blob = await extractVideoThumbnailFromUrl(video.video_url);
      
      if (blob) {
        // Create a File object from the blob
        const file = new File([blob], 'auto-thumbnail.jpg', { type: 'image/jpeg' });
        setThumbnail(file);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(blob);
        setThumbnailPreview(previewUrl);
        
        toast({
          title: "Thành công",
          description: "Đã tạo thumbnail từ video",
        });
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể trích xuất frame từ video. Có thể video chưa được tải hoàn tất hoặc định dạng không hỗ trợ.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo thumbnail từ video",
        variant: "destructive",
      });
    } finally {
      setGeneratingThumbnail(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề video",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      let thumbnailUrl = video.thumbnail_url;

      // Upload new thumbnail to R2 if provided
      if (thumbnail) {
        const result = await uploadToR2(thumbnail);
        if (result) {
          thumbnailUrl = result.publicUrl;
        }
      }

      const { error } = await supabase
        .from("videos")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl,
          is_public: isPublic,
        })
        .eq("id", video.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Video đã được cập nhật",
      });

      onSaved();
    } catch (error: any) {
      console.error("Error updating video:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật video",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa video</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="edit-title">Tiêu đề (bắt buộc)</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thêm tiêu đề mô tả video của bạn"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Mô tả</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu video của bạn cho người xem"
              className="mt-2 min-h-[150px]"
            />
          </div>

          <div>
            <Label>Hình thu nhỏ</Label>
            <div className="mt-2 space-y-3">
              <label htmlFor="edit-thumbnail" className="cursor-pointer block">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full max-h-48 object-contain rounded"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Nhấn để tải thumbnail lên (khuyến nghị: 1280 x 720)
                      </p>
                    </div>
                  )}
                </div>
                <Input
                  id="edit-thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>
              
              {/* Generate from video button */}
              {video.video_url && !video.video_url.includes('youtube.com') && !video.video_url.includes('youtu.be') && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateFromVideo}
                  disabled={generatingThumbnail || saving}
                  className="w-full"
                >
                  {generatingThumbnail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo thumbnail...
                    </>
                  ) : (
                    <>
                      <Film className="mr-2 h-4 w-4" />
                      🎬 Tạo thumbnail từ video
                    </>
                  )}
                </Button>
              )}
            </div>
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
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
