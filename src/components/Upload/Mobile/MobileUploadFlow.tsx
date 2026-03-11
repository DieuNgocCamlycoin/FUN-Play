import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVideoNavigation } from "@/lib/videoNavigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Video, Zap, Radio, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";
import { useUpload } from "@/contexts/UploadContext";
import { useUploadGate } from "@/hooks/useUploadGate";
import { AvatarVerificationGate } from "../AvatarVerificationGate";
import { ContentModerationFeedback } from "../ContentModerationFeedback";
import { isBlockedFilename, getBlockedFilenameError } from "@/lib/videoUploadValidation";

// Sub-components
import { VideoGalleryPicker } from "./VideoGalleryPicker";
import { VideoConfirmation } from "./VideoConfirmation";
import { VideoDetailsForm } from "./VideoDetailsForm";
import { VisibilitySelector } from "./SubPages/VisibilitySelector";
import { DescriptionEditor } from "./SubPages/DescriptionEditor";
import { ThumbnailPicker } from "./SubPages/ThumbnailPicker";
import { MobileUploadSuccess } from "./MobileUploadSuccess";
import { MobileUploadProgress } from "./MobileUploadProgress";
import { PlaylistSelector } from "../PlaylistSelector";

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
  | "sub-playlist"
  | "gate-checking"
  | "gate-avatar"
  | "gate-blocked"
  | "uploading"
  | "success";

export interface VideoMetadata {
  title: string;
  description: string;
  visibility: "public" | "unlisted" | "private";
  playlistIds: string[];
}

const CONTENT_TYPES = [
  { id: "video" as ContentType, label: "Video", icon: Video },
  { id: "shorts" as ContentType, label: "Video Shorts", icon: Zap },
  { id: "live" as ContentType, label: "Trực tiếp", icon: Radio },
  { id: "post" as ContentType, label: "Bài đăng", icon: FileText },
];

export function MobileUploadFlow({ open, onOpenChange }: MobileUploadFlowProps) {
  const navigate = useNavigate();
  const { goToVideo } = useVideoNavigation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addUpload } = useUpload();
  const { checkBeforeUpload, isChecking, gateResult, resetGate } = useUploadGate();

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
    playlistIds: [],
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
    setMetadata({ title: "", description: "", visibility: "public", playlistIds: [] });
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
      let resolved = false;

      const finish = (dur: number, w: number, h: number) => {
        if (resolved) return;
        resolved = true;
        URL.revokeObjectURL(video.src);
        const isVerticalOrSquare = h >= w;
        const isShortDuration = dur <= 180;
        setVideoDuration(dur);
        resolve({
          isShort: isVerticalOrSquare && isShortDuration,
          duration: dur,
        });
      };

      video.onloadedmetadata = () => {
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          finish(video.duration, video.videoWidth, video.videoHeight);
        }
      };
      video.ondurationchange = () => {
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          finish(video.duration, video.videoWidth, video.videoHeight);
        }
      };
      video.onerror = () => finish(0, 0, 0);
      setTimeout(() => {
        console.warn('[Duration] Mobile timeout - could not extract duration');
        finish(0, 0, 0);
      }, 10000);
      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle video selection with proper memory management
  const handleVideoSelect = useCallback(
    async (file: File) => {
      // Block sample video filenames
      if (isBlockedFilename(file.name)) {
        toast({
          title: "Video không hợp lệ",
          description: getBlockedFilenameError(),
          variant: "destructive",
        });
        return;
      }

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
    [detectShort, navigateTo, toast]
  );

  // Handle thumbnail change with memory tracking
  const handleThumbnailChange = useCallback((blob: Blob, preview: string) => {
    objectUrlsRef.current.push(preview);
    setThumbnailBlob(blob);
    setThumbnailPreview(preview);
  }, []);

  // Handle upload - Now uses gate check + background upload
  const handleUpload = async () => {
    if (!user || !videoFile) return;

    try {
      // Step 0: Run upload gate (avatar + content moderation)
      navigateTo("gate-checking");
      const result = await checkBeforeUpload(metadata.title, metadata.description);

      if (!result.allowed) {
        if (result.reason === "avatar") {
          navigateTo("gate-avatar");
          return;
        }
        if (result.reason === "content_blocked") {
          navigateTo("gate-blocked");
          return;
        }
      }

      // Step 1: Get or create channel first (required for background upload)
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

      // Step 2: Add to background upload queue with pre-determined approval status
      addUpload(
        videoFile,
        {
          title: metadata.title,
          description: metadata.description,
          visibility: metadata.visibility,
          isShort,
          duration: videoDuration,
          channelId,
          approvalStatus: result.approvalStatus,
          playlistIds: metadata.playlistIds,
        },
        thumbnailBlob,
        thumbnailPreview
      );

      // Step 3: Show toast and close modal immediately (like YouTube)
      toast({
        title: "Đang tải lên... 🚀",
        description: result.approvalStatus === "pending_review"
          ? "Video sẽ được Admin xem xét trước khi công khai."
          : "Video đang được tải lên ở chế độ nền. Bạn có thể tiếp tục sử dụng app.",
      });

      handleClose();
    } catch (error: any) {
      console.error("Upload init error:", error);
      toast({
        title: "Ồ, có lỗi xảy ra!",
        description: error.message || "Không thể bắt đầu upload. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleViewVideo = () => {
    if (uploadedVideoId) {
      goToVideo(uploadedVideoId);
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
      case "sub-playlist":
        return "Danh sách phát";
      case "gate-checking":
        return "Angel AI đang kiểm tra...";
      case "gate-avatar":
        return "Xác minh ảnh đại diện";
      case "gate-blocked":
        return "Nội dung chưa phù hợp";
      case "uploading":
        return "Đang tải lên...";
      case "success":
        return "Hoàn thành!";
      default:
        return "Tải video lên";
    }
  };

  // Determine if we should show close button or back button
  const showBackButton = navigationStack.length > 1 && currentStep !== "uploading" && currentStep !== "success" && currentStep !== "gate-checking" && currentStep !== "gate-avatar" && currentStep !== "gate-blocked";
  const showCloseButton = currentStep !== "uploading" && currentStep !== "gate-checking";

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

                  {/* Bottom Tabs - Centered with scroll snap */}
                  <div className="sticky bottom-0 bg-background border-t border-border pb-safe">
                    <div className="flex items-center justify-center gap-2 py-3 px-6 overflow-x-auto scrollbar-hide scroll-snap-x scroll-snap-mandatory">
                      {CONTENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isActive = selectedType === type.id;
                        return (
                          <motion.button
                            key={type.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (type.id === "live") {
                                onOpenChange(false);
                                navigate("/go-live");
                                return;
                              }
                              setSelectedType(type.id);
                            }}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px] scroll-snap-start touch-manipulation",
                              isActive
                                ? "bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.2)] to-[hsl(var(--cosmic-magenta)/0.2)] text-foreground border border-[hsl(var(--cosmic-cyan)/0.3)]"
                                : "bg-muted/50 text-muted-foreground active:bg-muted"
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{type.label}</span>
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
                  videoDuration={videoDuration}
                  onEditVisibility={() => navigateTo("sub-visibility")}
                  onEditDescription={() => navigateTo("sub-description")}
                  onEditThumbnail={() => navigateTo("sub-thumbnail")}
                  onEditPlaylist={() => navigateTo("sub-playlist")}
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

              {/* Sub-page: Playlist */}
              {currentStep === "sub-playlist" && (
                <div className="p-4">
                  <PlaylistSelector
                    selectedIds={metadata.playlistIds}
                    onChange={(ids) => setMetadata((prev) => ({ ...prev, playlistIds: ids }))}
                  />
                </div>
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

              {/* Gate: Checking */}
              {currentStep === "gate-checking" && (
                <ContentModerationFeedback isChecking={true} result={null} />
              )}

              {/* Gate: Avatar not verified */}
              {currentStep === "gate-avatar" && (
                <AvatarVerificationGate onClose={handleClose} />
              )}

              {/* Gate: Content blocked */}
              {currentStep === "gate-blocked" && (
                <ContentModerationFeedback
                  isChecking={false}
                  result={gateResult}
                  onRetry={() => {
                    resetGate();
                    setNavigationStack(["type-selector", "video-confirm", "video-details"]);
                  }}
                  onClose={handleClose}
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
