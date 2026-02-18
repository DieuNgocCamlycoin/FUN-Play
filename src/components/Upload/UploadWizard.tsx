import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileVideo, Image, Eye, CheckCircle, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { UploadDropzone } from "./UploadDropzone";
import { UploadMetadataForm, VideoMetadata } from "./UploadMetadataForm";
import { ThumbnailEditor } from "./ThumbnailEditor";
import { UploadPreview } from "./UploadPreview";
import { AvatarVerificationGate } from "./AvatarVerificationGate";
import { ContentModerationFeedback } from "./ContentModerationFeedback";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUploadGate } from "@/hooks/useUploadGate";
import { useUpload } from "@/contexts/UploadContext";
import { motion, AnimatePresence } from "framer-motion";
import { isBlockedFilename, getBlockedFilenameError } from "@/lib/videoUploadValidation";

interface UploadWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "metadata" | "thumbnail" | "preview" | "gate-checking" | "gate-avatar" | "gate-blocked";

const STEPS = [
  { id: "upload", label: "Video", icon: Upload },
  { id: "metadata", label: "Thông tin", icon: FileVideo },
  { id: "thumbnail", label: "Ảnh bìa", icon: Image },
  { id: "preview", label: "Xem trước", icon: Eye },
];

export function UploadWizard({ open, onOpenChange }: UploadWizardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { checkBeforeUpload, isChecking, gateResult, resetGate } = useUploadGate();
  const { addUpload } = useUpload();
  
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
  const [videoDuration, setVideoDuration] = useState(0);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const hasUnsavedData = videoFile !== null || metadata.title.trim() !== "";

  const canNavigateToStep = useCallback((targetStep: Step): boolean => {
    const stepOrder = ["upload", "metadata", "thumbnail", "preview"];
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(targetStep as string);
    return targetIndex <= currentIndex && videoFile !== null;
  }, [currentStep, videoFile]);

  const handleStepClick = useCallback((stepId: string) => {
    const targetStep = stepId as Step;
    if (canNavigateToStep(targetStep)) {
      setCurrentStep(targetStep);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }, [canNavigateToStep]);

  const handleCloseClick = useCallback(() => {
    if (hasUnsavedData) {
      setShowCloseConfirm(true);
    } else {
      handleClose();
      navigate("/");
    }
  }, [hasUnsavedData]);

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    handleClose();
    navigate("/");
  }, []);

  const detectShort = useCallback((file: File) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const isVerticalOrSquare = video.videoHeight >= video.videoWidth;
      const isShortDuration = video.duration <= 180;
      setIsShort(isVerticalOrSquare && isShortDuration);
      setVideoDuration(video.duration || 0);
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  }, []);

  const handleVideoSelect = useCallback(async (file: File) => {
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
    setVideoPreviewUrl(URL.createObjectURL(file));
    detectShort(file);
    
    try {
      const autoThumb = await extractVideoThumbnail(file, 0.25);
      if (autoThumb) {
        setThumbnailBlob(autoThumb);
        setThumbnailPreview(URL.createObjectURL(autoThumb));
      }
    } catch (err) {
      console.warn("Auto thumbnail failed:", err);
    }
    
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setMetadata(prev => ({ ...prev, title: nameWithoutExt }));
    
    setCurrentStep("metadata");
  }, [detectShort, toast]);

  const handleThumbnailChange = useCallback((blob: Blob, preview: string) => {
    setThumbnailBlob(blob);
    setThumbnailPreview(preview);
  }, []);

  // Handle upload - uses background queue (same as mobile)
  const handleUpload = async () => {
    if (!user || !videoFile) return;
    
    // Step 0: Run upload gate (avatar + content moderation)
    setCurrentStep("gate-checking");
    const gateCheck = await checkBeforeUpload(metadata.title, metadata.description);

    if (!gateCheck.allowed) {
      if (gateCheck.reason === "avatar") {
        setCurrentStep("gate-avatar");
        return;
      }
      if (gateCheck.reason === "content_blocked") {
        setCurrentStep("gate-blocked");
        return;
      }
    }

    try {
      // Step 1: Get or create channel
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

      // Step 2: Add to background upload queue (consistent with mobile)
      addUpload(
        videoFile,
        {
          title: metadata.title,
          description: metadata.description,
          visibility: metadata.visibility as "public" | "unlisted" | "private",
          isShort,
          duration: videoDuration,
          channelId,
          approvalStatus: gateCheck.approvalStatus,
        },
        thumbnailBlob,
        thumbnailPreview
      );

      // Step 3: Show toast and close wizard immediately
      toast({
        title: "Đang tải lên... 🚀",
        description: gateCheck.approvalStatus === "pending_review"
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
      setCurrentStep("preview");
    }
  };

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
    setVideoDuration(0);
    setShowCloseConfirm(false);
    onOpenChange(false);
  };

  const getStepIndex = (step: Step) => {
    const map: Record<Step, number> = {
      upload: 0,
      metadata: 1,
      thumbnail: 2,
      preview: 3,
      "gate-checking": 3,
      "gate-avatar": 3,
      "gate-blocked": 3,
    };
    return map[step];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        hideCloseButton
        className={cn(
          "!flex !flex-col p-0 gap-0 overflow-hidden bg-background border-border",
          isMobile 
            ? "max-w-full w-full h-full max-h-full rounded-none" 
            : "max-w-4xl w-[90vw] h-[85vh] max-h-[85vh] rounded-2xl shadow-2xl"
        )}
        style={{ backgroundColor: 'hsl(var(--background))' }}
      >
        {/* Holographic border effect */}
        <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-10 pointer-events-none" />
        
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 pt-3 sm:pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-background via-background to-background relative z-10 flex-shrink-0">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-50" />
          
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              Đăng video mới
            </DialogTitle>
            <VisuallyHidden.Root>
              <DialogDescription>
                Tải lên video mới lên kênh của bạn
              </DialogDescription>
            </VisuallyHidden.Root>
            
            <div className="flex items-center gap-2">
              {isShort && currentStep !== "upload" && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-purple)/1)] text-white rounded-full flex items-center gap-1 shadow-lg"
                >
                  <Sparkles className="w-3 h-3" />
                  SHORT
                </motion.span>
              )}
              
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseClick}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-destructive/20 hover:text-destructive transition-all"
                title="Tắt & quay về trang chủ"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Step Indicator */}
          {!["gate-checking", "gate-avatar", "gate-blocked"].includes(currentStep) && (
            <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-1">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = getStepIndex(currentStep) === index;
                const isCompleted = getStepIndex(currentStep) > index;
                const isClickable = canNavigateToStep(step.id as Step);
                
                return (
                  <div key={step.id} className="flex items-center flex-shrink-0 snap-center">
                    <motion.div
                      initial={false}
                      animate={{ scale: isActive ? 1.05 : 1 }}
                      whileHover={isClickable ? { scale: 1.08 } : {}}
                      whileTap={isClickable ? { scale: 0.95 } : {}}
                      onClick={() => handleStepClick(step.id)}
                      className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-300 min-h-[40px] sm:min-h-[44px]",
                        isActive && "bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white shadow-lg shadow-[hsl(var(--cosmic-cyan)/0.3)]",
                        isCompleted && "bg-[hsl(var(--cosmic-cyan)/0.2)] text-[hsl(var(--cosmic-cyan))] cursor-pointer hover:shadow-[0_0_20px_hsl(var(--cosmic-cyan)/0.5)]",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                      )}
                      title={isClickable ? `Nhấn để chỉnh sửa ${step.label} ✨` : ""}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span className="hidden xs:inline sm:inline">{step.label}</span>
                    </motion.div>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        "w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1 rounded-full transition-all duration-300",
                        isCompleted 
                          ? "bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))]" 
                          : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogHeader>

        {/* Content */}
        <div className={cn(
          "flex-1 min-h-0 overflow-y-auto scroll-smooth px-4 sm:px-6 py-4 sm:py-6 relative z-10",
          isMobile && "pb-20"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === "upload" && (
                <UploadDropzone onFileSelect={handleVideoSelect} isShort={isShort} />
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
                  videoDuration={videoDuration}
                  onPublish={handleUpload}
                  onBack={() => setCurrentStep("thumbnail")}
                  onEditMetadata={() => setCurrentStep("metadata")}
                  onEditThumbnail={() => setCurrentStep("thumbnail")}
                />
              )}

              {/* Gate: Checking */}
              {currentStep === "gate-checking" && (
                <ContentModerationFeedback isChecking={true} result={null} />
              )}

              {/* Gate: Avatar */}
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
                    setCurrentStep("metadata");
                  }}
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
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCloseConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background/95 backdrop-blur-xl border border-[hsl(var(--cosmic-cyan)/0.3)] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.2)] to-[hsl(var(--cosmic-magenta)/0.2)] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[hsl(var(--cosmic-gold))]" />
                  </div>
                  <h3 className="text-lg font-bold">Chờ đã! ✨</h3>
                  <p className="text-muted-foreground text-sm">
                    Bạn chắc chắn muốn hủy không?<br/>
                    Ánh sáng của bạn đang chờ lan tỏa đấy! 💕
                  </p>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCloseConfirm(false)}
                      className="flex-1 min-h-[48px] border-[hsl(var(--cosmic-cyan)/0.3)] hover:border-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan)/0.1)]"
                    >
                      Tiếp tục đăng
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleConfirmClose}
                      className="flex-1 min-h-[48px]"
                    >
                      Hủy bỏ
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
