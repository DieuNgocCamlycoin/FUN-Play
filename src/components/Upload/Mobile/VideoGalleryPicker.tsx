import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Video, Film, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface VideoGalleryPickerProps {
  onVideoSelect: (file: File) => void;
}

export function VideoGalleryPicker({ onVideoSelect }: VideoGalleryPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { mediumTap } = useHapticFeedback();

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith("video/")) {
        return;
      }

      setIsLoading(true);
      mediumTap();

      // Small delay to show loading state
      setTimeout(() => {
        onVideoSelect(file);
        setIsLoading(false);
      }, 300);
    },
    [onVideoSelect, mediumTap]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
    mediumTap();
  };

  return (
    <div className="flex-1 p-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Main Upload Area */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center min-h-[50vh] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300",
          isDragging
            ? "border-[hsl(var(--cosmic-cyan))] bg-[hsl(var(--cosmic-cyan)/0.1)]"
            : "border-border hover:border-[hsl(var(--cosmic-cyan)/0.5)] hover:bg-muted/30"
        )}
      >
        {/* Rainbow border effect on drag */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.3)] via-[hsl(var(--cosmic-magenta)/0.3)] to-[hsl(var(--cosmic-gold)/0.3)] animate-pulse pointer-events-none" />
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Skeleton className="w-20 h-20 rounded-full" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-transparent border-t-[hsl(var(--cosmic-cyan))] rounded-full"
              />
            </div>
            <p className="text-muted-foreground">Đang tải video...</p>
          </div>
        ) : (
          <>
            {/* Icon with gradient background */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan)/0.2)] via-[hsl(var(--cosmic-magenta)/0.2)] to-[hsl(var(--cosmic-gold)/0.2)] flex items-center justify-center">
                <Video className="w-12 h-12 text-[hsl(var(--cosmic-cyan))]" />
              </div>
              {/* Sparkle decorations */}
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[hsl(var(--cosmic-gold))]" />
            </motion.div>

            {/* Text */}
            <h3 className="text-xl font-bold mb-2">Chọn video để tải lên</h3>
            <p className="text-muted-foreground text-center px-6 mb-6">
              Chạm vào đây để chọn video từ thư viện của bạn
            </p>

            {/* Upload button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white font-semibold shadow-lg flex items-center gap-2 min-h-[52px]"
            >
              <Upload className="w-5 h-5" />
              Chọn video
            </motion.div>

            {/* Supported formats */}
            <p className="text-xs text-muted-foreground mt-6 flex items-center gap-2">
              <Film className="w-4 h-4" />
              MP4, MOV, AVI, MKV, WebM
            </p>
          </>
        )}
      </motion.div>

      {/* Placeholder grid to mimic gallery (decorative) */}
      <div className="mt-6">
        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Video className="w-4 h-4" />
          Video gần đây
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={handleClick}
              className="aspect-video rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center cursor-pointer hover:bg-muted transition-colors"
            >
              <Video className="w-6 h-6 text-muted-foreground/50" />
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Chạm để chọn video từ thiết bị
        </p>
      </div>
    </div>
  );
}
