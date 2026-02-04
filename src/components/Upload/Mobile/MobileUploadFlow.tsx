import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Video, Zap, Radio, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";

// Sub-components
import { VideoGalleryPicker } from "./VideoGalleryPicker";
import { VideoConfirmation } from "./VideoConfirmation";
import { VideoDetailsForm } from "./VideoDetailsForm";
import { VisibilitySelector } from "./SubPages/VisibilitySelector";
import { DescriptionEditor } from "./SubPages/DescriptionEditor";
import { ThumbnailPicker } from "./SubPages/ThumbnailPicker";
import { MobileUploadSuccess } from "./MobileUploadSuccess";
import { MobileUploadProgress } from "./MobileUploadProgress";

interface MobileUploadFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ContentType = "video" | "shorts" | "live" | "post";

type MobileUploadStep =
  | "type-selector"
  | "video-gallery"
  | "video-confirm"
  | "video-details"
  | "sub-visibility"
  | "sub-description"
  | "sub-thumbnail"
  | "uploading"
  | "success";

export interface VideoMetadata {
  title: string;
  description: string;
  visibility: "public" | "unlisted" | "private";
}

const CONTENT_TYPES = [
  { id: "video" as ContentType, label: "Video", icon: Video },
  { id: "shorts" as ContentType, label: "Video Shorts", icon: Zap },
  { id: "live" as ContentType, label: "Trực tiếp", icon: Radio },
  { id: "post" as ContentType, label: "Bài đăng", icon: FileText },
];

export function MobileUploadFlow({ open, onOpenChange }: MobileUploadFlowProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Navigation stack for back button
  const [navigationStack, setNavigationStack] = useState<MobileUploadStep[]>(["type-selector"]);
  const currentStep = navigationStack[navigationStack.length - 1];

  // Content type selection
  const [selectedType, setSelectedType] = useState<ContentType>("video");

  // Video data
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isShort, setIsShort] = useState(false);

  // Metadata
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: "",
    description: "",
    visibility: "public",
  });

  // Thumbnail
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);

  // Confirmation dialog
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Track ObjectURLs for cleanup
  const objectUrlsRef = useRef<string[]>([]);

  const hasUnsavedData = videoFile !== null || metadata.title.trim() !== "";

  // Cleanup ObjectURLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Navigation functions
  const navigateTo = useCallback((step: MobileUploadStep) => {
    setNavigationStack((prev) => [...prev, step]);
  }, []);

  const navigateBack = useCallback(() => {
    if (navigationStack.length > 1) {
      setNavigationStack((prev) => prev.slice(0, -1));
    } else {
      handleClose();
    }
  }, [navigationStack.length]);

  // Handle close
  const handleCloseClick = useCallback(() => {
    if (hasUnsavedData && currentStep !== "success") {
      setShowCloseConfirm(true);
    } else {
      handleClose();
    }
  }, [hasUnsavedData, currentStep]);

  const handleClose = useCallback(() => {
    setNavigationStack(["type-selector"]);
    setSelectedType("video");
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoDuration(0);
    setIsShort(false);
    setMetadata({ title: "", description: "", visibility: "public" });
    setThumbnailBlob(null);
    setThumbnailPreview(null);
    setUploadProgress(0);
    setUploadedVideoId(null);
    setShowCloseConfirm(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Detect if video is a Short
  const detectShort = useCallback((file: File): Promise<{ isShort: boolean; duration: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const isVerticalOrSquare = video.videoHeight >= video.videoWidth;
        const isShortDuration = video.duration <= 180;
        setVideoDuration(video.duration);
        URL.revokeObjectURL(video.src);
        resolve({
          isShort: isVerticalOrSquare && isShortDuration,
          duration: video.duration,
        });
      };
      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle video selection with proper memory management
  const handleVideoSelect = useCallback(
    async (file: File) => {
      setVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(previewUrl);
      setVideoPreviewUrl(previewUrl);

      const { isShort: short, duration } = await detectShort(file);
      setIsShort(short);
      setVideoDuration(duration);

      // Auto-generate thumbnail
      try {
        const autoThumb = await extractVideoThumbnail(file, 0.25);
        if (autoThumb) {
          setThumbnailBlob(autoThumb);
          const thumbUrl = URL.createObjectURL(autoThumb);
          objectUrlsRef.current.push(thumbUrl);
          setThumbnailPreview(thumbUrl);
        }
      } catch (err) {
        console.warn("Auto thumbnail failed:", err);
      }

      // Auto-fill title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setMetadata((prev) => ({ ...prev, title: nameWithoutExt }));

      navigateTo("video-confirm");
    },
    [detectShort, navigateTo]
  );

  // Handle thumbnail change with memory tracking
  const handleThumbnailChange = useCallback((blob: Blob, preview: string) => {
    objectUrlsRef.current.push(preview);
    setThumbnailBlob(blob);
    setThumbnailPreview(preview);
  }, []);

  // Handle upload
  const handleUpload = async () => {
    if (!user || !videoFile) return;

    navigateTo("uploading");
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
        const { data: initData, error: initError } = await supabase.functions.invoke("r2-upload", {
          body: {
            action: "initiateMultipart",
            fileName: videoFileName,
            contentType: videoFile.type,
            fileSize: videoFile.size,
          },
        });

        if (initError || !initData?.uploadId) {
          throw new Error("Không thể khởi tạo upload.");
        }

        const { uploadId, publicUrl } = initData;
        const CHUNK_SIZE = 100 * 1024 * 1024;
        const totalParts = Math.ceil(videoFile.size / CHUNK_SIZE);
        const uploadedParts: { partNumber: number; etag: string }[] = [];

        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
          const start = (partNumber - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, videoFile.size);
          const chunk = videoFile.slice(start, end);

          const { data: partData } = await supabase.functions.invoke("r2-upload", {
            body: {
              action: "getPartUrl",
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
                const etag = xhr.getResponseHeader("ETag") || `part-${partNumber}`;
                resolve({ etag: etag.replace(/"/g, "") });
              } else reject(new Error(`Part ${partNumber} failed`));
            };
            xhr.onerror = () => reject(new Error("Network error"));
            xhr.open("PUT", partData.presignedUrl);
            xhr.timeout = 10 * 60 * 1000;
            xhr.send(chunk);
          });

          uploadedParts.push({ partNumber, etag: partResponse.etag });
        }

        await supabase.functions.invoke("r2-upload", {
          body: {
            action: "completeMultipart",
            fileName: videoFileName,
            uploadId,
            parts: uploadedParts,
          },
        });

        videoUrl = publicUrl;
      } else {
        // Simple upload for small files
        const { data: presignData } = await supabase.functions.invoke("r2-upload", {
          body: {
            action: "getPresignedUrl",
            fileName: videoFileName,
            contentType: videoFile.type,
            fileSize: videoFile.size,
          },
        });

        if (!presignData?.presignedUrl) throw new Error("Không thể tạo link upload");

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(10 + Math.round((e.loaded / e.total) * 70));
            }
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed"));
          xhr.onerror = () => reject(new Error("Lỗi mạng"));
          xhr.open("PUT", presignData.presignedUrl);
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

        const { data: thumbPresign } = await supabase.functions.invoke("r2-upload", {
          body: {
            action: "getPresignedUrl",
            fileName: thumbnailFileName,
            contentType: "image/jpeg",
            fileSize: thumbnailBlob.size,
          },
        });

        if (thumbPresign?.presignedUrl) {
          const thumbResponse = await fetch(thumbPresign.presignedUrl, {
            method: "PUT",
            body: thumbnailBlob,
            headers: { "Content-Type": "image/jpeg" },
          });
          if (thumbResponse.ok) {
            thumbnailUrl = thumbPresign.publicUrl;
          }
        }
      }

      setUploadProgress(90);
      setUploadStage("Đang lưu thông tin...");

      // Step 4: Create database record
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          channel_id: channelId,
          title: metadata.title,
          description: metadata.description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          file_size: videoFile.size,
          duration: Math.round(videoDuration),
          is_public: metadata.visibility === "public",
          category: isShort ? "shorts" : "general",
          approval_status: "approved",
        })
        .select("id")
        .single();

      if (videoError) throw videoError;

      setUploadProgress(100);
      setUploadedVideoId(videoData.id);
      navigateTo("success");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Ồ, có lỗi xảy ra!",
        description: error.message || "Vui lòng thử lại sau nhé 💕",
        variant: "destructive",
      });
      // Go back to details
      setNavigationStack(["type-selector", "video-gallery", "video-confirm", "video-details"]);
    }
  };

  const handleViewVideo = () => {
    if (uploadedVideoId) {
      navigate(`/watch/${uploadedVideoId}`);
      handleClose();
    }
  };

  // Get header title based on step
  const getHeaderTitle = () => {
    switch (currentStep) {
      case "type-selector":
      case "video-gallery":
        return "Tải video lên";
      case "video-confirm":
        return "Xác nhận video";
      case "video-details":
        return "Thêm chi tiết";
      case "sub-visibility":
        return "Đặt chế độ hiển thị";
      case "sub-description":
        return "Thêm nội dung mô tả";
      case "sub-thumbnail":
        return "Chọn thumbnail";
      case "uploading":
        return "Đang tải lên...";
      case "success":
        return "Hoàn thành!";
      default:
        return "Tải video lên";
    }
  };

  // Determine if we should show close button or back button
  const showBackButton = navigationStack.length > 1 && currentStep !== "uploading" && currentStep !== "success";
  const showCloseButton = currentStep !== "uploading";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col p-0 gap-0 max-w-full w-full h-full max-h-full rounded-none overflow-hidden bg-background touch-manipulation overscroll-contain">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 h-14 flex items-center px-4 bg-background/95 backdrop-blur-sm border-b border-border"
        >
          {/* Back button */}
          {showBackButton && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={navigateBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors mr-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
          )}

          {/* Title */}
          <h1 className="flex-1 text-lg font-semibold flex items-center gap-2">
            {currentStep === "success" && <Sparkles className="w-5 h-5 text-[hsl(var(--cosmic-gold))]" />}
            {getHeaderTitle()}
          </h1>

          {/* Close button */}
          {showCloseButton && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCloseClick}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
          )}
        </motion.header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="min-h-full will-change-transform"
            >
              {/* Type Selector + Video Gallery */}
              {(currentStep === "type-selector" || currentStep === "video-gallery") && (
                <div className="flex flex-col h-full">
                  {/* Video Gallery */}
                  <VideoGalleryPicker onVideoSelect={handleVideoSelect} />

                  {/* Bottom Tabs */}
                  <div className="sticky bottom-0 bg-background border-t border-border">
                    <div className="flex items-center justify-center gap-1 py-3 px-4 overflow-x-auto scrollbar-hide">
                      {CONTENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isActive = selectedType === type.id;
                        return (
                          <motion.button
                            key={type.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedType(type.id)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px]",
                              isActive
                                ? "bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.2)] to-[hsl(var(--cosmic-magenta)/0.2)] text-foreground border border-[hsl(var(--cosmic-cyan)/0.3)]"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Video Confirmation */}
              {currentStep === "video-confirm" && videoFile && videoPreviewUrl && (
                <VideoConfirmation
                  videoFile={videoFile}
                  videoPreviewUrl={videoPreviewUrl}
                  duration={videoDuration}
                  isShort={isShort}
                  onNext={() => navigateTo("video-details")}
                  onConvertToShort={() => setIsShort(true)}
                />
              )}

              {/* Video Details Form */}
              {currentStep === "video-details" && (
                <VideoDetailsForm
                  metadata={metadata}
                  thumbnailPreview={thumbnailPreview}
                  onEditVisibility={() => navigateTo("sub-visibility")}
                  onEditDescription={() => navigateTo("sub-description")}
                  onEditThumbnail={() => navigateTo("sub-thumbnail")}
                  onTitleChange={(title) => setMetadata((prev) => ({ ...prev, title }))}
                  onUpload={handleUpload}
                />
              )}

              {/* Sub-page: Visibility */}
              {currentStep === "sub-visibility" && (
                <VisibilitySelector
                  value={metadata.visibility}
                  onChange={(visibility) => {
                    setMetadata((prev) => ({ ...prev, visibility }));
                    navigateBack();
                  }}
                />
              )}

              {/* Sub-page: Description */}
              {currentStep === "sub-description" && (
                <DescriptionEditor
                  value={metadata.description}
                  onChange={(description) => setMetadata((prev) => ({ ...prev, description }))}
                  onSave={navigateBack}
                />
              )}

              {/* Sub-page: Thumbnail */}
              {currentStep === "sub-thumbnail" && videoFile && (
                <ThumbnailPicker
                  videoFile={videoFile}
                  currentThumbnail={thumbnailPreview}
                  onThumbnailChange={handleThumbnailChange}
                  onBack={navigateBack}
                />
              )}

              {/* Uploading */}
              {currentStep === "uploading" && (
                <MobileUploadProgress progress={uploadProgress} stage={uploadStage} />
              )}

              {/* Success */}
              {currentStep === "success" && (
                <MobileUploadSuccess
                  videoId={uploadedVideoId}
                  onViewVideo={handleViewVideo}
                  onClose={handleClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Close Confirmation Dialog */}
        <AnimatePresence>
          {showCloseConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border"
              >
                <h3 className="text-lg font-bold mb-2">Bạn chắc chắn muốn hủy không?</h3>
                <p className="text-muted-foreground mb-6">
                  Ánh sáng của bạn đang chờ lan tỏa đấy! 💕
                </p>
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCloseConfirm(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors min-h-[48px]"
                  >
                    Tiếp tục
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowCloseConfirm(false);
                      handleClose();
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium transition-colors min-h-[48px]"
                  >
                    Hủy
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
