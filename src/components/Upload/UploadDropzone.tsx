import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Video, Smartphone, Sparkles, Zap, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { isBlockedFilename, getBlockedFilenameError } from "@/lib/videoUploadValidation";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isShort?: boolean;
}

const ACCEPTED_VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/mov": [".mov"],
  "video/quicktime": [".mov"],
  "video/avi": [".avi"],
  "video/x-msvideo": [".avi"],
  "video/webm": [".webm"],
  "video/mkv": [".mkv"],
  "video/x-matroska": [".mkv"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

const UPLOAD_TIPS = [
  { icon: "🎬", text: "Video MP4 (H.264) cho chất lượng tốt nhất" },
  { icon: "📱", text: "Video dọc ≤3 phút sẽ thành Short" },
  { icon: "🖼️", text: "Thumbnail sẽ được tạo tự động" },
  { icon: "✨", text: "Chia sẻ ánh sáng đến cộng đồng!" },
];

export function UploadDropzone({ onFileSelect, isShort }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === "file-too-large") {
        setError("Ồ, video hơi to quá! Thử nén lại hoặc chọn video nhỏ hơn 10GB nhé 💕");
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setError("Định dạng này chưa hỗ trợ, dùng MP4 nhé! 🎬");
      } else {
        setError("Không thể tải file này, thử lại nhé! ✨");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (isBlockedFilename(file.name)) {
        setError(getBlockedFilenameError());
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_VIDEO_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const rootProps = getRootProps();

  return (
    <div className="space-y-6">
      {/* Main Dropzone with holographic effect */}
      <motion.div
        initial={false}
        animate={{
          scale: isDragActive ? 1.02 : 1,
        }}
        onClick={rootProps.onClick}
        onKeyDown={rootProps.onKeyDown}
        onFocus={rootProps.onFocus}
        onBlur={rootProps.onBlur}
        onDragEnter={rootProps.onDragEnter}
        onDragOver={rootProps.onDragOver}
        onDragLeave={rootProps.onDragLeave}
        onDrop={rootProps.onDrop}
        tabIndex={rootProps.tabIndex}
        role={rootProps.role}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center",
          isDragActive
            ? "border-[hsl(var(--cosmic-cyan))] bg-gradient-to-br from-[hsl(var(--cosmic-cyan)/0.1)] to-[hsl(var(--cosmic-magenta)/0.1)]"
            : "border-border hover:border-[hsl(var(--cosmic-cyan)/0.5)] hover:bg-muted/30",
          error && "border-destructive bg-destructive/5"
        )}
      >
        {/* Holographic border effect on drag */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: "linear-gradient(135deg, hsl(var(--cosmic-cyan)/0.2), hsl(var(--cosmic-magenta)/0.2), hsl(var(--cosmic-gold)/0.2))",
                backgroundSize: "400% 400%",
                animation: "shimmer 3s ease-in-out infinite",
              }}
            />
          )}
        </AnimatePresence>

        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          {/* Upload icon with glow */}
          <motion.div 
            animate={{
              scale: isDragActive ? 1.1 : 1,
              rotate: isDragActive ? [0, -5, 5, 0] : 0,
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300",
              isDragActive 
                ? "bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] shadow-lg shadow-[hsl(var(--cosmic-cyan)/0.4)]" 
                : "bg-muted"
            )}
          >
            <Upload className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-300",
              isDragActive ? "text-white" : "text-muted-foreground"
            )} />
          </motion.div>
          
          <div className="space-y-2">
            <p className="text-lg sm:text-xl font-semibold">
              {isDragActive ? (
                <span className="bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent">
                  Thả video vào đây! ✨
                </span>
              ) : (
                "Kéo thả video hoặc nhấn để chọn"
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              MP4, MOV, AVI, WebM, MKV • Tối đa 10GB
            </p>
          </div>

          {/* Gradient button */}
          <Button 
            type="button" 
            className="mt-2 bg-gradient-to-r from-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-purple)/1)] hover:from-[hsl(var(--cosmic-magenta)/0.9)] hover:to-[hsl(var(--cosmic-purple)/0.9)] text-white shadow-lg shadow-[hsl(var(--cosmic-magenta)/0.3)] transition-all duration-300 hover:shadow-xl hover:shadow-[hsl(var(--cosmic-magenta)/0.4)] min-h-[48px] px-6"
          >
            <Video className="w-5 h-5 mr-2" />
            Chọn video
          </Button>
        </div>
      </motion.div>

      {/* Error Message with friendly tone */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3"
          >
            <span className="text-xl">😅</span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Camera capture button - prominent on mobile */}
        <div className="relative">
          <label className="block cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-[hsl(var(--cosmic-cyan)/0.4)] bg-gradient-to-br from-[hsl(var(--cosmic-cyan)/0.05)] to-[hsl(var(--cosmic-magenta)/0.05)] hover:from-[hsl(var(--cosmic-cyan)/0.1)] hover:to-[hsl(var(--cosmic-magenta)/0.1)] transition-all duration-300 min-h-[80px]"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] flex items-center justify-center shadow-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-semibold bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent">
                  Quay video mới
                </span>
                <span className="block text-xs text-muted-foreground">
                  Mở camera điện thoại
                </span>
              </div>
            </motion.div>
            <input
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(file);
              }}
            />
          </label>
        </div>

        {/* Upload tips with floating animation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
        >
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[hsl(var(--cosmic-gold))]" />
            Mẹo upload
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            {UPLOAD_TIPS.map((tip, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <span>{tip.icon}</span>
                <span>{tip.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Short video indicator */}
      <AnimatePresence>
        {isShort && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[hsl(var(--cosmic-magenta)/0.1)] to-[hsl(var(--cosmic-purple)/0.1)] border border-[hsl(var(--cosmic-magenta)/0.3)]"
          >
            <Film className="w-5 h-5 text-[hsl(var(--cosmic-magenta))]" />
            <span className="text-sm font-medium">
              Video này sẽ được đăng dưới dạng <span className="text-[hsl(var(--cosmic-magenta))] font-bold">Short</span>
            </span>
            <Sparkles className="w-4 h-4 text-[hsl(var(--cosmic-gold))]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
