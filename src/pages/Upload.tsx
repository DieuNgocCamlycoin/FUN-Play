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
import { useR2Upload } from "@/hooks/useR2Upload";
import { Upload as UploadIcon, Video, CheckCircle } from "lucide-react";

export default function Upload() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      // Upload avatar first if provided - use R2
      let avatarPublicUrl = null;
      if (avatarFile) {
        setUploadStage("Đang tải ảnh đại diện lên R2...");
        setUploadProgress(2);
        
        const { data: presignData, error: presignError } = await supabase.functions.invoke('r2-upload', {
          body: {
            action: 'getPresignedUrl',
            fileName: `avatars/${user.id}/${Date.now()}-${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
            contentType: avatarFile.type,
            fileSize: avatarFile.size,
          }
        });

        if (!presignError && presignData?.presignedUrl) {
          const uploadResponse = await fetch(presignData.presignedUrl, {
            method: 'PUT',
            body: avatarFile,
            headers: { 'Content-Type': avatarFile.type },
          });

          if (uploadResponse.ok) {
            avatarPublicUrl = presignData.publicUrl;
            await supabase.from("profiles").update({ avatar_url: avatarPublicUrl }).eq('id', user.id);
          }
        }
      }

      // Step 1: Get or create channel (5% progress)
      setUploadStage("Đang kiểm tra kênh...");
      setUploadProgress(5);
      
      let channelId = null;
      let retryChannel = 0;
      const maxChannelRetries = 3;
      
      while (!channelId && retryChannel < maxChannelRetries) {
        try {
          const { data: channels, error: channelFetchError } = await supabase
            .from("channels")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (channelFetchError) throw channelFetchError;
          
          channelId = channels?.id;

          if (!channelId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", user.id)
              .maybeSingle();

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
          break;
        } catch (error: any) {
          retryChannel++;
          if (retryChannel >= maxChannelRetries) {
            throw new Error("Không thể kết nối tới server. Vui lòng thử lại sau.");
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Step 2: Upload video to R2 (10% - 85% progress)
      const fileSizeMB = (videoFile.size / (1024 * 1024)).toFixed(1);
      const fileSizeGB = (videoFile.size / (1024 * 1024 * 1024)).toFixed(2);
      setUploadStage(`Đang tải video lên R2... (${videoFile.size > 1024 * 1024 * 1024 ? fileSizeGB + ' GB' : fileSizeMB + ' MB'})`);
      setUploadProgress(10);
      
      const sanitizedVideoName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
      const videoFileName = `videos/${Date.now()}-${sanitizedVideoName}`;
      
      // Get presigned URL or initiate multipart upload
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Chưa đăng nhập');

      let videoUrl: string;
      
      // Check if multipart is needed (> 100MB)
      if (videoFile.size > 100 * 1024 * 1024) {
        // Multipart upload for large files
        const { data: initData, error: initError } = await supabase.functions.invoke('r2-upload', {
          body: {
            action: 'initiateMultipart',
            fileName: videoFileName,
            contentType: videoFile.type,
            fileSize: videoFile.size,
          },
        });

        if (initError || !initData?.uploadId) {
          throw new Error('Không thể khởi tạo upload. Vui lòng thử lại.');
        }

        const { uploadId, publicUrl } = initData;
        const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks
        const totalParts = Math.ceil(videoFile.size / CHUNK_SIZE);
        const uploadedParts: { partNumber: number; etag: string }[] = [];

        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
          const start = (partNumber - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, videoFile.size);
          const chunk = videoFile.slice(start, end);

          // Get presigned URL for this part
          const { data: partData, error: partError } = await supabase.functions.invoke('r2-upload', {
            body: {
              action: 'getPartUrl',
              fileName: videoFileName,
              uploadId,
              partNumber,
            },
          });

          if (partError || !partData?.presignedUrl) {
            throw new Error(`Lỗi tạo link upload phần ${partNumber}`);
          }

          // Upload part with retry
          let retries = 0;
          let partUploaded = false;
          
          while (retries < 3 && !partUploaded) {
            try {
              const partResponse = await new Promise<{ etag: string }>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.upload.onprogress = (e) => {
                  if (e.lengthComputable) {
                    const partProgress = (start + e.loaded) / videoFile.size;
                    setUploadProgress(10 + Math.round(partProgress * 75));
                    setUploadStage(`Đang tải phần ${partNumber}/${totalParts}...`);
                  }
                };

                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    const etag = xhr.getResponseHeader('ETag') || `part-${partNumber}`;
                    resolve({ etag: etag.replace(/"/g, '') });
                  } else {
                    reject(new Error(`Part ${partNumber} failed: ${xhr.status}`));
                  }
                };

                xhr.onerror = () => reject(new Error('Network error'));
                xhr.ontimeout = () => reject(new Error('Timeout'));

                xhr.open('PUT', partData.presignedUrl);
                xhr.timeout = 10 * 60 * 1000;
                xhr.send(chunk);
              });

              uploadedParts.push({ partNumber, etag: partResponse.etag });
              partUploaded = true;
            } catch (err) {
              retries++;
              if (retries >= 3) throw err;
              await new Promise(r => setTimeout(r, 2000 * retries));
            }
          }
        }

        // Complete multipart upload
        setUploadStage('Đang hoàn tất upload...');
        const { error: completeError } = await supabase.functions.invoke('r2-upload', {
          body: {
            action: 'completeMultipart',
            fileName: videoFileName,
            uploadId,
            parts: uploadedParts,
          },
        });

        if (completeError) {
          throw new Error('Không thể hoàn tất upload');
        }

        videoUrl = publicUrl;
      } else {
        // Simple presigned URL upload for small files
        const { data: presignData, error: presignError } = await supabase.functions.invoke('r2-upload', {
          body: {
            action: 'getPresignedUrl',
            fileName: videoFileName,
            contentType: videoFile.type,
            fileSize: videoFile.size,
          },
        });

        if (presignError || !presignData?.presignedUrl) {
          throw new Error('Không thể tạo link upload');
        }

        // Upload directly to R2
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(10 + Math.round((e.loaded / e.total) * 75));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed: ${xhr.status}`));
          };

          xhr.onerror = () => reject(new Error('Lỗi mạng'));
          xhr.ontimeout = () => reject(new Error('Timeout'));

          xhr.open('PUT', presignData.presignedUrl);
          xhr.timeout = 30 * 60 * 1000;
          xhr.send(videoFile);
        });

        videoUrl = presignData.publicUrl;
      }
      
      setUploadProgress(85);
      setUploadStage("Video đã tải lên R2! Đang xử lý...");

      // Step 3: Upload thumbnail to R2 (85% - 90% progress)
      let thumbnailUrl = null;
      if (thumbnailFile) {
        setUploadStage("Đang tải thumbnail lên R2...");
        setUploadProgress(87);
        
        const sanitizedThumbName = thumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
        const thumbnailFileName = `thumbnails/${Date.now()}-${sanitizedThumbName}`;
        
        const { data: thumbPresign, error: thumbPresignError } = await supabase.functions.invoke('r2-upload', {
          body: {
            action: 'getPresignedUrl',
            fileName: thumbnailFileName,
            contentType: thumbnailFile.type,
            fileSize: thumbnailFile.size,
          },
        });

        if (!thumbPresignError && thumbPresign?.presignedUrl) {
          try {
            const thumbResponse = await fetch(thumbPresign.presignedUrl, {
              method: 'PUT',
              body: thumbnailFile,
            });
            
            if (thumbResponse.ok) {
              thumbnailUrl = thumbPresign.publicUrl;
            }
          } catch (thumbErr) {
            console.error('Thumbnail upload error:', thumbErr);
          }
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
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        file_size: videoFile.size,
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
      
      // More detailed and helpful error messages
      let errorMessage = "Không thể tải video lên. ";
      
      if (error.message?.includes("timeout") || error.message?.includes("aborted")) {
        errorMessage += "Quá trình tải lên mất quá nhiều thời gian. Video có thể quá lớn hoặc kết nối mạng không ổn định. Đề xuất: Nén video trước khi tải lên hoặc thử lại với kết nối internet tốt hơn.";
      } else if (error.message?.includes("network") || error.message?.includes("Failed to fetch")) {
        errorMessage += "Mất kết nối với server. Vui lòng kiểm tra:\n• Kết nối internet của bạn\n• Tường lửa hoặc VPN có thể đang chặn kết nối\n• Thử tải lại trang và thử lại";
      } else if (error.message?.includes("401") || error.message?.includes("unauthorized")) {
        errorMessage += "Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại.";
      } else if (error.message?.includes("413") || error.message?.includes("too large")) {
        errorMessage += "Video quá lớn để tải lên. Vui lòng nén video xuống dưới 10GB.";
      } else {
        errorMessage += error.message || "Vui lòng thử lại sau vài phút.";
      }
      
      toast({
        title: "Tải lên thất bại",
        description: errorMessage,
        variant: "destructive",
        duration: 8000, // Show longer for detailed messages
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
            <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8">
              {videoFile ? (
                <div className="space-y-4 text-center">
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
                <div className="space-y-6">
                  <UploadIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                  
                  {/* iOS-friendly upload options */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {/* Record new video (iOS camera) */}
                    <div>
                      <Label htmlFor="video-record" className="cursor-pointer block">
                        <div className="flex items-center justify-center gap-2 px-6 py-4 bg-primary/10 border-2 border-primary rounded-xl hover:bg-primary/20 transition-colors">
                          <span className="text-2xl">📱</span>
                          <div className="text-left">
                            <span className="block text-sm font-semibold text-primary">Quay video mới</span>
                            <span className="block text-xs text-primary/70">iPhone / iPad Camera</span>
                          </div>
                        </div>
                      </Label>
                      <input
                        id="video-record"
                        type="file"
                        accept="video/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    
                    {/* Select from library */}
                    <div>
                      <Label htmlFor="video-upload" className="cursor-pointer block">
                        <div className="flex items-center justify-center gap-2 px-6 py-4 bg-muted border-2 border-border rounded-xl hover:bg-muted/80 transition-colors">
                          <span className="text-2xl">📁</span>
                          <div className="text-left">
                            <span className="block text-sm font-semibold text-foreground">Chọn từ thư viện</span>
                            <span className="block text-xs text-muted-foreground">Photos / Files app</span>
                          </div>
                        </div>
                      </Label>
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/mp4,video/mov,video/quicktime,video/x-m4v,video/*"
                        className="hidden"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    MP4, MOV, WebM, hoặc AVI (tối đa 10GB)
                  </p>
                  <p className="text-xs text-orange-600 text-center">
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

            {/* Avatar Upload */}
            <div>
              <Label htmlFor="avatar">Ảnh đại diện (Tùy chọn)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Ảnh này sẽ được đặt làm ảnh đại diện cho kênh của bạn
              </p>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <UploadIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {avatarFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {avatarFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <Label htmlFor="thumbnail">Thumbnail video</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                disabled={uploading}
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
