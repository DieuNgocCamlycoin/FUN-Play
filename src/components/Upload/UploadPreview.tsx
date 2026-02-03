import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Globe, Lock, Eye, Clock, Play, Sparkles, Heart } from "lucide-react";
import { VideoMetadata } from "./UploadMetadataForm";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UploadPreviewProps {
  videoPreviewUrl: string | null;
  thumbnailPreview: string | null;
  metadata: VideoMetadata;
  isShort: boolean;
  onPublish: () => void;
  onBack: () => void;
}

const VISIBILITY_ICONS = {
  public: Globe,
  private: Lock,
  unlisted: Eye,
  scheduled: Clock,
};

const VISIBILITY_LABELS = {
  public: "Công khai",
  private: "Riêng tư",
  unlisted: "Không công khai",
  scheduled: "Lên lịch",
};

export function UploadPreview({
  videoPreviewUrl,
  thumbnailPreview,
  metadata,
  isShort,
  onPublish,
  onBack,
}: UploadPreviewProps) {
  const VisibilityIcon = VISIBILITY_ICONS[metadata.visibility];

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="text-center">
        <h3 className="text-lg font-bold flex items-center justify-center gap-2">
          <Eye className="w-5 h-5 text-[hsl(var(--cosmic-cyan))]" />
          Xem trước video
        </h3>
        <p className="text-sm text-muted-foreground">
          Kiểm tra lại thông tin trước khi đăng
        </p>
      </div>

      {/* Video & Thumbnail Preview - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Video Player */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <p className="text-sm font-semibold">Video</p>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border/50 shadow-lg">
            {videoPreviewUrl ? (
              <video
                src={videoPreviewUrl}
                controls
                className="w-full h-full object-contain"
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            {isShort && (
              <Badge className="absolute top-2 right-2 bg-gradient-to-r from-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-purple)/1)] border-0 shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                SHORT
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Thumbnail Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <p className="text-sm font-semibold">Thumbnail</p>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border/50 shadow-lg">
            {thumbnailPreview ? (
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Chưa có thumbnail
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Metadata Summary with glass effect */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border/50 p-4 sm:p-5 space-y-4 bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm"
      >
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Tiêu đề
          </p>
          <p className="font-bold text-lg">{metadata.title || "Chưa có tiêu đề"}</p>
        </div>

        {metadata.description && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Mô tả
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
              {metadata.description}
            </p>
          </div>
        )}

        {metadata.tags.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {metadata.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.1)] to-[hsl(var(--cosmic-magenta)/0.1)] border border-[hsl(var(--cosmic-cyan)/0.2)]"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              metadata.visibility === "public" && "bg-[hsl(var(--cosmic-cyan)/0.2)] text-[hsl(var(--cosmic-cyan))]",
              metadata.visibility === "private" && "bg-[hsl(var(--cosmic-magenta)/0.2)] text-[hsl(var(--cosmic-magenta))]",
              metadata.visibility === "unlisted" && "bg-[hsl(var(--cosmic-gold)/0.2)] text-[hsl(var(--cosmic-gold))]",
              metadata.visibility === "scheduled" && "bg-[hsl(var(--divine-lavender)/0.2)] text-[hsl(var(--divine-lavender))]"
            )}>
              <VisibilityIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{VISIBILITY_LABELS[metadata.visibility]}</span>
          </div>
          
          {metadata.visibility === "scheduled" && metadata.scheduledAt && (
            <span className="text-sm text-muted-foreground">
              {format(metadata.scheduledAt, "PPP 'lúc' HH:mm", { locale: vi })}
            </span>
          )}
        </div>
      </motion.div>

      {/* Light Economy Message */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.1)] via-[hsl(var(--cosmic-magenta)/0.1)] to-[hsl(var(--cosmic-gold)/0.1)] border border-[hsl(var(--cosmic-cyan)/0.2)]"
      >
        <p className="text-sm text-center flex items-center justify-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 text-[hsl(var(--cosmic-gold))]" />
          <span>Cảm ơn bạn đã chia sẻ ánh sáng với cộng đồng FUN PLAY!</span>
          <Heart className="w-4 h-4 text-[hsl(var(--cosmic-magenta))]" />
        </p>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-border/50">
        <Button variant="ghost" onClick={onBack} className="gap-2 min-h-[48px]">
          <ArrowLeft className="w-4 h-4" />
          Quay lại chỉnh sửa
        </Button>
        <Button 
          onClick={onPublish} 
          className="gap-2 min-h-[52px] px-8 bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] hover:from-[hsl(var(--cosmic-cyan)/0.9)] hover:via-[hsl(var(--cosmic-magenta)/0.9)] hover:to-[hsl(var(--cosmic-gold)/0.9)] text-white shadow-lg shadow-[hsl(var(--cosmic-magenta)/0.3)] font-bold"
        >
          <Upload className="w-5 h-5" />
          Đăng video
          <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
