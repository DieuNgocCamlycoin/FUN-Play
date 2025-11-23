import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload as UploadIcon, Video, CheckCircle } from "lucide-react";

export default function Upload() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile) {
      toast({
        title: "Chưa chọn video",
        description: "Vui lòng chọn video để tải lên",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10GB limit)
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    if (videoFile.size > maxSize) {
      toast({
        title: "Video quá lớn",
        description: "Vui lòng chọn video nhỏ hơn 10GB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStage("Đang chuẩn bị...");

    try {
      // Step 1: Get or create channel (5% progress)
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

      // Step 2: Upload video (10% - 85% progress)
      setUploadStage(`Đang tải video lên... (${(videoFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
      setUploadProgress(10);
      
      const sanitizedVideoName = videoFile.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .substring(0, 100);
      const videoPath = `${user.id}/${Date.now()}-${sanitizedVideoName}`;
      
      // Upload with retry logic for large files
      let uploadSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!uploadSuccess && retryCount < maxRetries) {
        try {
          setUploadProgress(10 + (retryCount * 5));
          
          const { error: videoUploadError, data } = await supabase.storage
            .from("videos")
            .upload(videoPath, videoFile, {
              cacheControl: '3600',
              upsert: false
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
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        }
      }

      if (!uploadSuccess) {
        throw new Error("Không thể tải video lên sau nhiều lần thử");
      }

      const { data: videoUrl } = supabase.storage
        .from("videos")
        .getPublicUrl(videoPath);

      // Step 3: Upload thumbnail (85% - 90% progress)
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
          const { data: thumbUrl } = supabase.storage
            .from("thumbnails")
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbUrl.publicUrl;
        }
      }

      setUploadProgress(90);

      // Step 4: Create database record (90% - 100% progress)
      setUploadStage("Đang lưu thông tin...");
      setUploadProgress(93);
      
      const { error: videoError } = await supabase.from("videos").insert({
        user_id: user.id,
        channel_id: channelId,
        title,
        description,
        video_url: videoUrl.publicUrl,
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

      // Wait a bit to show completion
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // More detailed error message
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
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Upload Video</h1>

          <form onSubmit={handleVideoUpload} className="space-y-6">
            {/* Video Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {videoFile ? (
                <div className="space-y-4">
                  <Video className="h-16 w-16 mx-auto text-primary" />
                  <p className="text-sm text-foreground font-medium">{videoFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Kích thước: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    {videoFile.size > 1024 * 1024 * 1024 && (
                      <span className="block mt-1 text-orange-500">
                        ({(videoFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB - Video lớn, có thể tải lâu)
                      </span>
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setVideoFile(null)}
                    disabled={uploading}
                  >
                    Đổi Video
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <Label htmlFor="video-upload" className="cursor-pointer">
                      <span className="text-primary hover:underline">Select video file</span>
                    </Label>
                    <Input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    MP4, WebM, hoặc AVI (tối đa 10GB)
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    💡 Gợi ý: Video trên 2GB có thể tải lâu. Nên nén video trước khi tải lên.
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title (required)</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title that describes your video"
                required
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video"
                rows={5}
                className="mt-1"
              />
            </div>

            {/* Thumbnail */}
            <div>
              <Label htmlFor="thumbnail">Thumbnail</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              {thumbnailFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  {thumbnailFile.name}
                </p>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {uploadStage}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                {uploadProgress === 100 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Đang chuyển hướng...</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={uploading || !videoFile || !title}
                className="flex-1"
              >
                {uploading ? "Đang tải lên..." : "Tải Video Lên"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={uploading}
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
