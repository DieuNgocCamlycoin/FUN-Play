import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Globe, Lock, Eye, Clock, Play } from "lucide-react";
import { VideoMetadata } from "./UploadMetadataForm";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
        <h3 className="text-lg font-semibold">Xem trước video</h3>
        <p className="text-sm text-muted-foreground">
          Kiểm tra lại thông tin trước khi đăng
        </p>
      </div>

      {/* Video & Thumbnail Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Video</p>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            {videoPreviewUrl ? (
              <video
                src={videoPreviewUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            {isShort && (
              <Badge className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500">
                SHORT
              </Badge>
            )}
          </div>
        </div>

        {/* Thumbnail Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Thumbnail</p>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border">
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
        </div>
      </div>

      {/* Metadata Summary */}
      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Tiêu đề
          </p>
          <p className="font-semibold text-lg">{metadata.title || "Chưa có tiêu đề"}</p>
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
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <VisibilityIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{VISIBILITY_LABELS[metadata.visibility]}</span>
          </div>
          
          {metadata.visibility === "scheduled" && metadata.scheduledAt && (
            <span className="text-sm text-muted-foreground">
              {format(metadata.scheduledAt, "PPP 'lúc' HH:mm", { locale: vi })}
            </span>
          )}
        </div>
      </div>

      {/* Light Economy Message */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
        <p className="text-sm text-center">
          ✨ Cảm ơn bạn đã chia sẻ ánh sáng với cộng đồng FUN PLAY!
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại chỉnh sửa
        </Button>
        <Button onClick={onPublish} className="gap-2">
          <Upload className="w-4 h-4" />
          Đăng video
        </Button>
      </div>
    </div>
  );
}
