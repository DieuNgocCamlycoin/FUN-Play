import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, CheckCircle2, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useUpload, UploadItem } from "@/contexts/UploadContext";
import { cn } from "@/lib/utils";

function UploadItemRow({ item, onCancel, onRemove }: {
  item: UploadItem;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const isActive = item.status === "pending" || item.status === "uploading";
  const isCompleted = item.status === "completed";
  const isError = item.status === "error";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 p-3 bg-background/80 backdrop-blur-sm rounded-xl border border-border"
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {item.thumbnailPreview ? (
          <img
            src={item.thumbnailPreview}
            alt="Thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.metadata.title}</p>
        <div className="flex items-center gap-2 mt-1">
          {isActive && (
            <>
              <Progress value={item.progress} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {item.progress}%
              </span>
            </>
          )}
          {isCompleted && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Hoàn thành
            </span>
          )}
          {isError && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {item.error || "Lỗi"}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => (isActive ? onCancel(item.id) : onRemove(item.id))}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

export function BackgroundUploadIndicator() {
  const { uploads, cancelUpload, removeUpload, hasActiveUploads } = useUpload();
  const [isExpanded, setIsExpanded] = useState(true);

  // Only show if there are uploads
  if (uploads.length === 0) return null;

  const activeCount = uploads.filter(
    (u) => u.status === "pending" || u.status === "uploading"
  ).length;

  // Get the primary upload for collapsed view
  const primaryUpload = uploads.find((u) => u.status === "uploading") || uploads[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
      >
        {/* Collapsed view */}
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={() => setIsExpanded(true)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-2xl shadow-2xl border cursor-pointer transition-colors",
              hasActiveUploads
                ? "bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.1)] to-[hsl(var(--cosmic-magenta)/0.1)] border-[hsl(var(--cosmic-cyan)/0.3)]"
                : "bg-background border-border"
            )}
          >
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {primaryUpload?.thumbnailPreview ? (
                <img
                  src={primaryUpload.thumbnailPreview}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {activeCount > 0
                  ? `Đang tải ${activeCount} video...`
                  : `${uploads.length} video đã xong`}
              </p>
              {hasActiveUploads && primaryUpload && (
                <Progress value={primaryUpload.progress} className="h-1.5 mt-1" />
              )}
            </div>

            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        )}

        {/* Expanded view */}
        {isExpanded && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div
              onClick={() => setIsExpanded(false)}
              className="flex items-center justify-between p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    hasActiveUploads ? "bg-[hsl(var(--cosmic-cyan))] animate-pulse" : "bg-green-500"
                  )}
                />
                <span className="text-sm font-medium">
                  {activeCount > 0
                    ? `Đang tải ${activeCount} video`
                    : "Tải lên hoàn tất"}
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Upload list */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-2">
              <AnimatePresence>
                {uploads.map((item) => (
                  <UploadItemRow
                    key={item.id}
                    item={item}
                    onCancel={cancelUpload}
                    onRemove={removeUpload}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
