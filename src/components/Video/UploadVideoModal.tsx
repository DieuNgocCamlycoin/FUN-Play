import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload as UploadIcon, CheckCircle } from "lucide-react";

interface UploadVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadVideoModal({ open, onOpenChange }: UploadVideoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để tải video lên",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check if either video file or YouTube URL is provided
    if (!videoFile && !youtubeUrl) {
      toast({
        title: "Chưa chọn video",
        description: "Vui lòng chọn file video hoặc nhập URL YouTube",
        variant: "destructive",
      });
      return;
    }

    // Validate file size if video file is provided
    if (videoFile) {
      const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
      if (videoFile.size > maxSize) {
        toast({
          title: "Video quá lớn",
          description: "Vui lòng chọn video nhỏ hơn 10GB",
          variant: "destructive",
        });
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStage("Đang chuẩn bị...");

    try {
      // Get or create channel
      setUploadStage("Đang kiểm tra kênh...");
      setUploadProgress(5);

      const { data: channels } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let channelId = channels?.id;

      if (!channelId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        const { data: newChannel, error: channelError } = await supabase
          .from("channels")
          .insert({
            user_id: user.id,
            name: profile?.display_name || user.email?.split("@")[0] || "Kênh của tôi",
          })
          .select()
          .single();

        if (channelError) throw channelError;
        channelId = newChannel.id;
      }

      let videoUrl = youtubeUrl;

      // Upload video file if provided
      if (videoFile) {
        setUploadStage(`Đang tải video lên... (${(videoFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
        setUploadProgress(10);

        const sanitizedVideoName = videoFile.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .substring(0, 100);
        const videoPath = `${user.id}/${Date.now()}-${sanitizedVideoName}`;

        let uploadSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!uploadSuccess && retryCount < maxRetries) {
          try {
            setUploadProgress(10 + retryCount * 5);

            const { error: videoUploadError } = await supabase.storage
              .from("videos")
              .upload(videoPath, videoFile, {
                cacheControl: "3600",
                upsert: false,
              });

            if (videoUploadError) {
              throw videoUploadError;
            }

            uploadSuccess = true;
            setUploadProgress(85);
          } catch (error: any) {
            retryCount++;
            console.error(`Upload attempt ${retryCount} failed:`, error);

            if (retryCount >= maxRetries) {
              throw new Error(`Lỗi tải video sau ${maxRetries} lần thử: ${error.message}`);
            }

            setUploadStage(`Đang thử lại... (Lần ${retryCount}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        if (!uploadSuccess) {
          throw new Error("Không thể tải video lên sau nhiều lần thử");
        }

        const { data: videoUrlData } = supabase.storage.from("videos").getPublicUrl(videoPath);
        videoUrl = videoUrlData.publicUrl;
      }

      // Upload thumbnail
      let thumbnailUrl = null;
      if (thumbnailFile) {
        setUploadStage("Đang tải thumbnail...");
        setUploadProgress(87);

        const sanitizedThumbName = thumbnailFile.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .substring(0, 100);
        const thumbnailPath = `${user.id}/${Date.now()}-${sanitizedThumbName}`;

        const { error: thumbnailUploadError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbnailPath, thumbnailFile);

        if (!thumbnailUploadError) {
          const { data: thumbUrl } = supabase.storage.from("thumbnails").getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbUrl.publicUrl;
        }
      }

      setUploadProgress(90);

      // Create database record
      setUploadStage("Đang lưu thông tin...");
      setUploadProgress(93);

      const { error: videoError } = await supabase.from("videos").insert({
        user_id: user.id,
        channel_id: channelId,
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        is_public: true,
      });

      if (videoError) {
        console.error("Database error:", videoError);
        throw new Error(`Lỗi lưu video: ${videoError.message}`);
      }

      setUploadProgress(100);
      setUploadStage("Hoàn thành!");

      toast({
        title: "Tải video thành công!",
        description: "Video của bạn đã được đăng tải",
      });

      // Reset form
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setVideoFile(null);
        setThumbnailFile(null);
        setYoutubeUrl("");
        setUploadProgress(0);
        setUploadStage("");
        onOpenChange(false);
        
        // Refresh page to show new video
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Upload error:", error);

      let errorMessage = "Không thể tải video lên. ";
      if (error.message?.includes("timeout")) {
        errorMessage += "Video quá lớn hoặc kết nối mạng chậm. Vui lòng thử lại hoặc nén video trước khi tải lên.";
      } else if (error.message?.includes("network")) {
        errorMessage += "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.";
      } else {
        errorMessage += error.message || "Vui lòng thử lại.";
      }

      toast({
        title: "Tải lên thất bại",
        description: errorMessage,
        variant: "destructive",
      });
      setUploadProgress(0);
      setUploadStage("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Tải video lên</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-base">
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề video..."
              required
              className="mt-2"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-base">
              Mô tả
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về video của bạn..."
              rows={4}
              className="mt-2"
              disabled={uploading}
            />
          </div>

          {/* Video File Upload */}
          <div>
            <Label className="text-base">
              Video File (Tối đa 10GB - Hỗ trợ video dài)
            </Label>
            <div className="mt-2 space-y-3">
              {/* iOS Camera Recording Option */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Label htmlFor="video-record" className="cursor-pointer block">
                    <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary/50 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
                      <UploadIcon className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-primary">📱 Quay video mới (iPhone/iPad)</span>
                    </div>
                  </Label>
                  <input
                    id="video-record"
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    disabled={uploading || !!youtubeUrl}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="video-select" className="cursor-pointer block">
                    <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-muted-foreground/50 rounded-lg hover:border-muted-foreground hover:bg-muted/50 transition-colors">
                      <UploadIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">📁 Chọn từ thư viện</span>
                    </div>
                  </Label>
                  <input
                    id="video-select"
                    type="file"
                    accept="video/mp4,video/mov,video/quicktime,video/x-m4v,video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    disabled={uploading || !!youtubeUrl}
                    className="hidden"
                  />
                </div>
              </div>
              {videoFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-foreground font-medium">{videoFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    {videoFile.size > 1024 * 1024 * 1024 && (
                      <span className="text-orange-500 ml-2">
                        ({(videoFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB - Video lớn, có thể tải lâu)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* YouTube URL */}
          <div>
            <Label htmlFor="youtube-url" className="text-base">
              Hoặc nhập URL video (YouTube, Suno, etc.)
            </Label>
            <Input
              id="youtube-url"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="mt-2"
              disabled={uploading || !!videoFile}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nếu có URL, không cần upload file
            </p>
          </div>

          {/* Thumbnail */}
          <div>
            <Label htmlFor="thumbnail" className="text-base">
              Ảnh thumbnail (Tùy chọn)
            </Label>
            <div className="mt-2">
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="cursor-pointer"
              />
              {thumbnailFile && (
                <p className="text-sm text-muted-foreground mt-2">{thumbnailFile.name}</p>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{uploadStage}</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {uploadProgress === 100 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Đang làm mới trang...</span>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Hủy
            </Button>
            <Button type="submit" disabled={uploading || (!videoFile && !youtubeUrl) || !title}>
              {uploading ? "Đang tải lên..." : "Tải lên"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
