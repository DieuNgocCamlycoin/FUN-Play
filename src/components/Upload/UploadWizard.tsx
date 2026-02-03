import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileVideo, Image, Eye, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadDropzone } from "./UploadDropzone";
import { UploadMetadataForm, VideoMetadata } from "./UploadMetadataForm";
import { ThumbnailEditor } from "./ThumbnailEditor";
import { UploadPreview } from "./UploadPreview";
import { UploadSuccess } from "./UploadSuccess";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";

interface UploadWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "metadata" | "thumbnail" | "preview" | "uploading" | "success";

const STEPS = [
  { id: "upload", label: "Video", icon: Upload },
  { id: "metadata", label: "Thông tin", icon: FileVideo },
  { id: "thumbnail", label: "Thumbnail", icon: Image },
  { id: "preview", label: "Xem trước", icon: Eye },
];

export function UploadWizard({ open, onOpenChange }: UploadWizardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: "",
    description: "",
    tags: [],
    visibility: "public",
    scheduledAt: null,
  });
  const [isShort, setIsShort] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // Detect if video is a Short (vertical/square + ≤3 min)
  const detectShort = useCallback((file: File) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const isVerticalOrSquare = video.videoHeight >= video.videoWidth;
      const isShortDuration = video.duration <= 180; // 3 minutes
      setIsShort(isVerticalOrSquare && isShortDuration);
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  }, []);

  // Handle video file selection
  const handleVideoSelect = useCallback(async (file: File) => {
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    detectShort(file);
    
    // Auto-generate thumbnail
    try {
      const autoThumb = await extractVideoThumbnail(file, 0.25);
      if (autoThumb) {
        setThumbnailBlob(autoThumb);
        setThumbnailPreview(URL.createObjectURL(autoThumb));
      }
    } catch (err) {
      console.warn("Auto thumbnail failed:", err);
    }
    
    // Auto-fill title from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setMetadata(prev => ({ ...prev, title: nameWithoutExt }));
    
    setCurrentStep("metadata");
  }, [detectShort]);

  // Handle thumbnail change
  const handleThumbnailChange = useCallback((blob: Blob, preview: string) => {
    setThumbnailBlob(blob);
    setThumbnailPreview(preview);
  }, []);

  // Handle upload
  const handleUpload = async () => {
    if (!user || !videoFile) return;
    
    setCurrentStep("uploading");
    setUploadProgress(0);
    setUploadStage("Đang chuẩn bị...");

    try {
      // Step 1: Get or create channel
      setUploadStage("Đang kiểm tra kênh...");
      setUploadProgress(5);
      
      let channelId = null;
      const { data: channels } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

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

      // Step 2: Upload video to R2
      const fileSizeMB = (videoFile.size / (1024 * 1024)).toFixed(1);
      setUploadStage(`Đang tải video lên... (${fileSizeMB} MB)`);
      setUploadProgress(10);

      const sanitizedVideoName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
      const videoFileName = `videos/${Date.now()}-${sanitizedVideoName}`;

      let videoUrl: string;

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
          throw new Error('Không thể khởi tạo upload.');
        }

        const { uploadId, publicUrl } = initData;
        const CHUNK_SIZE = 100 * 1024 * 1024;
        const totalParts = Math.ceil(videoFile.size / CHUNK_SIZE);
        const uploadedParts: { partNumber: number; etag: string }[] = [];

        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
          const start = (partNumber - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, videoFile.size);
          const chunk = videoFile.slice(start, end);

          const { data: partData } = await supabase.functions.invoke('r2-upload', {
            body: {
              action: 'getPartUrl',
              fileName: videoFileName,
              uploadId,
              partNumber,
            },
          });

          if (!partData?.presignedUrl) throw new Error(`Lỗi phần ${partNumber}`);

          const partResponse = await new Promise<{ etag: string }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const partProgress = (start + e.loaded) / videoFile.size;
                setUploadProgress(10 + Math.round(partProgress * 70));
                setUploadStage(`Đang tải phần ${partNumber}/${totalParts}...`);
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const etag = xhr.getResponseHeader('ETag') || `part-${partNumber}`;
                resolve({ etag: etag.replace(/"/g, '') });
              } else reject(new Error(`Part ${partNumber} failed`));
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.open('PUT', partData.presignedUrl);
            xhr.timeout = 10 * 60 * 1000;
            xhr.send(chunk);
          });

          uploadedParts.push({ partNumber, etag: partResponse.etag });
        }

        await supabase.functions.invoke('r2-upload', {
          body: {
            action: 'completeMultipart',
            fileName: videoFileName,
            uploadId,
            parts: uploadedParts,
          },
        });

        videoUrl = publicUrl;
      } else {
        // Simple upload for small files
        const { data: presignData } = await supabase.functions.invoke('r2-upload', {
          body: {
            action: 'getPresignedUrl',
            fileName: videoFileName,
            contentType: videoFile.type,
            fileSize: videoFile.size,
          },
        });

        if (!presignData?.presignedUrl) throw new Error('Không thể tạo link upload');

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(10 + Math.round((e.loaded / e.total) * 70));
            }
          };
          xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed'));
          xhr.onerror = () => reject(new Error('Lỗi mạng'));
          xhr.open('PUT', presignData.presignedUrl);
          xhr.timeout = 30 * 60 * 1000;
          xhr.send(videoFile);
        });

        videoUrl = presignData.publicUrl;
      }

      setUploadProgress(80);

      // Step 3: Upload thumbnail
      let thumbnailUrl = null;
      if (thumbnailBlob) {
        setUploadStage("Đang tải thumbnail...");
        const thumbnailFileName = `thumbnails/${Date.now()}-thumb.jpg`;
        
        const { data: thumbPresign } = await supabase.functions.invoke('r2-upload', {
          body: {
            action: 'getPresignedUrl',
            fileName: thumbnailFileName,
            contentType: 'image/jpeg',
            fileSize: thumbnailBlob.size,
          },
        });

        if (thumbPresign?.presignedUrl) {
          const thumbResponse = await fetch(thumbPresign.presignedUrl, {
            method: 'PUT',
            body: thumbnailBlob,
            headers: { 'Content-Type': 'image/jpeg' },
          });
          if (thumbResponse.ok) {
            thumbnailUrl = thumbPresign.publicUrl;
          }
        }
      }

      setUploadProgress(90);
      setUploadStage("Đang lưu thông tin...");

      // Step 4: Create database record
      const { data: videoData, error: videoError } = await supabase.from("videos").insert({
        user_id: user.id,
        channel_id: channelId,
        title: metadata.title,
        description: metadata.description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        file_size: videoFile.size,
        is_public: metadata.visibility === "public",
        category: isShort ? "shorts" : "general",
        approval_status: "approved",
      }).select('id').single();

      if (videoError) throw videoError;

      setUploadProgress(100);
      setUploadedVideoId(videoData.id);
      setUploadedVideoUrl(`/watch/${videoData.id}`);
      setCurrentStep("success");

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Tải lên thất bại",
        description: error.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
      setCurrentStep("preview");
    }
  };

  // Reset wizard
  const handleClose = () => {
    setCurrentStep("upload");
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setThumbnailBlob(null);
    setThumbnailPreview(null);
    setMetadata({
      title: "",
      description: "",
      tags: [],
      visibility: "public",
      scheduledAt: null,
    });
    setIsShort(false);
    setUploadProgress(0);
    setUploadedVideoId(null);
    onOpenChange(false);
  };

  const handleViewVideo = () => {
    if (uploadedVideoUrl) {
      navigate(uploadedVideoUrl);
      handleClose();
    }
  };

  const getStepIndex = (step: Step) => {
    const map: Record<Step, number> = {
      upload: 0,
      metadata: 1,
      thumbnail: 2,
      preview: 3,
      uploading: 3,
      success: 4,
    };
    return map[step];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {currentStep === "success" ? "✨ Hoàn thành!" : "Đăng video mới"}
            </DialogTitle>
            {isShort && currentStep !== "upload" && currentStep !== "success" && (
              <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full">
                SHORT
              </span>
            )}
          </div>

          {/* Step Indicator */}
          {currentStep !== "uploading" && currentStep !== "success" && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = getStepIndex(currentStep) === index;
                const isCompleted = getStepIndex(currentStep) > index;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
                        isActive && "bg-primary text-primary-foreground",
                        isCompleted && "bg-primary/20 text-primary",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{step.label}</span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        "w-8 h-0.5 mx-1",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          {currentStep === "upload" && (
            <UploadDropzone onFileSelect={handleVideoSelect} />
          )}

          {currentStep === "metadata" && (
            <UploadMetadataForm
              metadata={metadata}
              onChange={setMetadata}
              onNext={() => setCurrentStep("thumbnail")}
              onBack={() => setCurrentStep("upload")}
            />
          )}

          {currentStep === "thumbnail" && (
            <ThumbnailEditor
              videoFile={videoFile}
              currentThumbnail={thumbnailPreview}
              onThumbnailChange={handleThumbnailChange}
              onNext={() => setCurrentStep("preview")}
              onBack={() => setCurrentStep("metadata")}
            />
          )}

          {currentStep === "preview" && (
            <UploadPreview
              videoPreviewUrl={videoPreviewUrl}
              thumbnailPreview={thumbnailPreview}
              metadata={metadata}
              isShort={isShort}
              onPublish={handleUpload}
              onBack={() => setCurrentStep("thumbnail")}
            />
          )}

          {currentStep === "uploading" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                  style={{ animationDuration: "1.5s" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{uploadProgress}%</span>
                </div>
              </div>
              <Progress value={uploadProgress} className="w-full max-w-md" />
              <p className="text-muted-foreground">{uploadStage}</p>
            </div>
          )}

          {currentStep === "success" && (
            <UploadSuccess
              videoId={uploadedVideoId || ""}
              onViewVideo={handleViewVideo}
              onUploadAnother={() => {
                handleClose();
                setTimeout(() => onOpenChange(true), 100);
              }}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
