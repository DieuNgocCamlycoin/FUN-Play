import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Video, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
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

export function UploadDropzone({ onFileSelect }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === "file-too-large") {
        setError("Video quá lớn. Vui lòng chọn video nhỏ hơn 10GB.");
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setError("Định dạng không hỗ trợ. Vui lòng chọn MP4, MOV, AVI, WebM hoặc MKV.");
      } else {
        setError("Không thể tải file này.");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_VIDEO_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  return (
    <div className="space-y-6">
      {/* Main Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          error && "border-destructive"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-colors",
            isDragActive ? "bg-primary/20" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-10 h-10 transition-colors",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? "Thả video vào đây" : "Kéo thả video hoặc nhấn để chọn"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              MP4, MOV, AVI, WebM, MKV - Tối đa 10GB
            </p>
          </div>

          <Button type="button" variant="outline" className="mt-2">
            <Video className="w-4 h-4 mr-2" />
            Chọn video
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Mobile Recording Option */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block cursor-pointer">
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
              <Smartphone className="w-6 h-6 text-primary" />
              <div className="text-left">
                <span className="block text-sm font-medium text-primary">Quay video mới</span>
                <span className="block text-xs text-primary/70">Mở camera điện thoại</span>
              </div>
            </div>
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

        <div className="p-4 rounded-xl bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Mẹo upload</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Video MP4 (H.264) cho chất lượng tốt nhất</li>
            <li>• Video dọc ≤3 phút sẽ được đăng là Short</li>
            <li>• Thumbnail sẽ được tạo tự động</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
