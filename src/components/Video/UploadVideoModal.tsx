import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VIDEO_CATEGORY_OPTIONS, VideoSubCategory } from "@/lib/videoCategories";
import { Upload as UploadIcon, CheckCircle, Plus, Music, AlertCircle, Clock, Smartphone, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";

interface MeditationPlaylist {
  id: string;
  name: string;
}

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
  const [subCategory, setSubCategory] = useState<VideoSubCategory | "">("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  
  // Shorts video metadata
  const [isShorts, setIsShorts] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>("");
  const [isValidShorts, setIsValidShorts] = useState(false);
  
  // Playlist management (for meditation categories)
  const [playlists, setPlaylists] = useState<MeditationPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isMeditation = subCategory === 'light_meditation' || subCategory === 'sound_therapy' || subCategory === 'mantra';

  // Validate video metadata for Shorts
  const validateVideoForShorts = (file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatioValue = height / width; // Dọc > 1, Ngang < 1
      
      setVideoDuration(Math.round(duration));
      setVideoAspectRatio(`${width}x${height}`);
      
      // Shorts: aspect ratio dọc (height > width) và duration < 360s (6 phút)
      const isValid = aspectRatioValue >= 1.2 && duration < 360;
      setIsValidShorts(isValid);
      
      URL.revokeObjectURL(video.src);
    };
  };

  // Watch for video file changes to validate for Shorts
  useEffect(() => {
    if (videoFile && isShorts) {
      validateVideoForShorts(videoFile);
    } else {
      setVideoDuration(0);
      setVideoAspectRatio("");
      setIsValidShorts(false);
    }
  }, [videoFile, isShorts]);

  // Fetch user's meditation playlists when meditation checkbox is checked
  useEffect(() => {
    if (isMeditation && user) {
      fetchPlaylists();
    }
  }, [isMeditation, user]);

  const fetchPlaylists = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("meditation_playlists")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPlaylists(data);
    }
  };

  const createNewPlaylist = async (): Promise<string | null> => {
    if (!user || !newPlaylistName.trim()) return null;

    const { data, error } = await supabase
      .from("meditation_playlists")
      .insert({
        user_id: user.id,
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo playlist mới",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "✨ Playlist đã tạo",
      description: `Đã tạo playlist "${newPlaylistName}"`,
    });

    return data.id;
  };

  const addVideoToPlaylist = async (videoId: string, playlistId: string) => {
    // Get current max position
    const { data: existingVideos } = await supabase
      .from("meditation_playlist_videos")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existingVideos && existingVideos.length > 0 
      ? existingVideos[0].position + 1 
      : 0;

    const { error } = await supabase
      .from("meditation_playlist_videos")
      .insert({
        playlist_id: playlistId,
        video_id: videoId,
        position: nextPosition,
      });

    if (error) {
      console.error("Error adding video to playlist:", error);
    }
  };

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

    // Category validation removed - videos will use default category

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
      // Create new playlist if requested
      let targetPlaylistId = selectedPlaylistId;
      if (isMeditation && showNewPlaylist && newPlaylistName.trim()) {
        const newId = await createNewPlaylist();
        if (newId) {
          targetPlaylistId = newId;
        }
      }

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

      // Upload video file to Cloudflare R2 if provided
      if (videoFile) {
        const fileSizeMB = (videoFile.size / (1024 * 1024)).toFixed(1);
        const fileSizeGB = (videoFile.size / (1024 * 1024 * 1024)).toFixed(2);
        setUploadStage(`Đang tải video lên R2... (${videoFile.size > 1024 * 1024 * 1024 ? fileSizeGB + ' GB' : fileSizeMB + ' MB'})`);
        setUploadProgress(10);

        const sanitizedVideoName = videoFile.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .substring(0, 100);
        const videoFileName = `videos/${Date.now()}-${sanitizedVideoName}`;

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
          // Simple presigned URL upload for small files (< 100MB)
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

          // Upload directly to R2 with progress tracking
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
        console.log('Video uploaded to R2:', videoUrl);
      }

      // Upload thumbnail to Cloudflare R2
      let thumbnailUrl = null;
      
      // If user provided a thumbnail file, upload it
      if (thumbnailFile) {
        setUploadStage("Đang tải thumbnail lên R2...");
        setUploadProgress(87);

        const sanitizedThumbName = thumbnailFile.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .substring(0, 100);
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
              console.log('Thumbnail uploaded to R2:', thumbnailUrl);
            }
          } catch (thumbErr) {
            console.error('Thumbnail upload error:', thumbErr);
          }
        }
      } 
      // Auto-generate thumbnail from video if no thumbnail provided and video file exists
      else if (videoFile) {
        setUploadStage("Đang tạo thumbnail từ video...");
        setUploadProgress(87);
        
        try {
          const extractedBlob = await extractVideoThumbnail(videoFile);
          
          if (extractedBlob) {
            const thumbnailFileName = `thumbnails/${Date.now()}-auto-thumb.jpg`;
            
            const { data: thumbPresign, error: thumbPresignError } = await supabase.functions.invoke('r2-upload', {
              body: {
                action: 'getPresignedUrl',
                fileName: thumbnailFileName,
                contentType: 'image/jpeg',
                fileSize: extractedBlob.size,
              },
            });

            if (!thumbPresignError && thumbPresign?.presignedUrl) {
              const thumbResponse = await fetch(thumbPresign.presignedUrl, {
                method: 'PUT',
                body: extractedBlob,
              });

              if (thumbResponse.ok) {
                thumbnailUrl = thumbPresign.publicUrl;
                console.log('Auto-generated thumbnail uploaded:', thumbnailUrl);
              }
            }
          } else {
            console.log('Could not extract thumbnail from video, will use default');
          }
        } catch (thumbErr) {
          console.error('Auto thumbnail extraction error:', thumbErr);
        }
      }

      setUploadProgress(90);

      // Create database record
      setUploadStage("Đang lưu thông tin...");
      setUploadProgress(93);

      const { data: videoData, error: videoError } = await supabase.from("videos").insert({
        user_id: user.id,
        channel_id: channelId,
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        is_public: true,
        category: isShorts ? "shorts" : (isMeditation ? "meditation" : "general"),
        sub_category: null,
        duration: videoDuration ? Math.round(videoDuration) : null,
        approval_status: "approved",
      }).select("id").single();

      if (videoError) {
        console.error("Database error:", videoError);
        throw new Error(`Lỗi lưu video: ${videoError.message}`);
      }

      // Add video to playlist if meditation and playlist selected
      if (isMeditation && targetPlaylistId && videoData?.id) {
        setUploadStage("Đang thêm vào playlist...");
        await addVideoToPlaylist(videoData.id, targetPlaylistId);
      }

      setUploadProgress(100);
      setUploadStage("Hoàn thành!");

      toast({
        title: "🎉 Video đã được tải lên thành công!",
        description: "Video của bạn đã hiển thị công khai ngay bây giờ.",
      });

      // Reset form
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setVideoFile(null);
        setThumbnailFile(null);
        setYoutubeUrl("");
        setSubCategory("");
        setIsShorts(false);
        setVideoDuration(0);
        setVideoAspectRatio("");
        setIsValidShorts(false);
        setSelectedPlaylistId("");
        setShowNewPlaylist(false);
        setNewPlaylistName("");
        setNewPlaylistDescription("");
        setUploadProgress(0);
        setUploadStage("");
        setIsDuplicate(false);
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

          {/* Shorts Upload Option */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 border border-pink-400/30">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="shorts-checkbox"
                checked={isShorts}
                onCheckedChange={(checked) => {
                  setIsShorts(!!checked);
                  if (checked) {
                    setSubCategory(""); // Clear category when Shorts is selected
                  }
                }}
                disabled={uploading}
                className="border-pink-400 data-[state=checked]:bg-pink-500"
              />
              <Label htmlFor="shorts-checkbox" className="text-base font-medium flex items-center gap-2 cursor-pointer">
                <Smartphone className="w-5 h-5 text-pink-500" />
                <span>📱 Video Shorts (dọc 9:16, dưới 6 phút)</span>
              </Label>
            </div>

            {isShorts && (
              <Alert className="mt-3 border-pink-300 bg-pink-50/50">
                <Smartphone className="w-4 h-4 text-pink-600" />
                <AlertDescription className="text-pink-700">
                  <div className="space-y-2">
                    <p className="font-medium">📐 Yêu cầu Video Shorts:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Tỷ lệ khung hình dọc (9:16, 3:4)</li>
                      <li>Thời lượng dưới 6 phút</li>
                    </ul>
                    
                    {videoFile && videoDuration > 0 && (
                      <div className="mt-3 p-2 bg-white/50 rounded-lg space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span>Thời lượng:</span>
                          <span className="font-medium">
                            {Math.floor(videoDuration / 60)}:{String(Math.floor(videoDuration % 60)).padStart(2, '0')}
                          </span>
                          {videoDuration < 360 ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span>Kích thước:</span>
                          <span className="font-medium">{videoAspectRatio}</span>
                          {isValidShorts ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Video Category section removed */}

          {/* Playlist Selection - Only show for meditation categories */}
          {isMeditation && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10 border border-cyan-400/30 space-y-3">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-700">Thêm vào playlist thiền định (tùy chọn)</span>
              </div>

              {!showNewPlaylist ? (
                <>
                  <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                    <SelectTrigger className="border-cyan-300 bg-white/80">
                      <SelectValue placeholder="Chọn playlist (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewPlaylist(true)}
                    className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tạo playlist mới
                  </Button>
                </>
              ) : (
                <div className="space-y-3 p-3 bg-white/50 rounded-lg border border-cyan-200">
                  <div>
                    <Label className="text-sm text-cyan-700">Tên playlist mới</Label>
                    <Input
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="VD: Thiền buổi sáng..."
                      className="mt-1 border-cyan-200"
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-cyan-700">Mô tả (tùy chọn)</Label>
                    <Textarea
                      value={newPlaylistDescription}
                      onChange={(e) => setNewPlaylistDescription(e.target.value)}
                      placeholder="Mô tả playlist..."
                      className="mt-1 border-cyan-200"
                      rows={2}
                      disabled={uploading}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewPlaylist(false);
                      setNewPlaylistName("");
                      setNewPlaylistDescription("");
                    }}
                    className="text-cyan-600"
                  >
                    ← Quay lại chọn playlist có sẵn
                  </Button>
                </div>
              )}
            </div>
          )}

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
            <Button 
              type="submit" 
              disabled={uploading || (!videoFile && !youtubeUrl) || !title}
            >
              {uploading ? "Đang tải lên..." : "Tải lên"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
