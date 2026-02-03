import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThumbnailUploadProps {
  onUpload: (blob: Blob, preview: string) => void;
}

const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ThumbnailUpload({ onUpload }: ThumbnailUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === "file-too-large") {
        setError("Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.");
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setError("Định dạng không hỗ trợ. Vui lòng chọn JPEG, PNG hoặc WebP.");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Resize to 1280x720 if needed
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          // Calculate crop/fit dimensions
          const ratio = Math.max(1280 / img.width, 720 / img.height);
          const newWidth = img.width * ratio;
          const newHeight = img.height * ratio;
          const x = (1280 - newWidth) / 2;
          const y = (720 - newHeight) / 2;
          
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, 1280, 720);
          ctx.drawImage(img, x, y, newWidth, newHeight);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const previewUrl = URL.createObjectURL(blob);
              setPreview(previewUrl);
              onUpload(blob, previewUrl);
            }
          }, "image/jpeg", 0.9);
        }
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/30 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Uploaded thumbnail"
              className="w-full max-w-md mx-auto rounded-lg aspect-video object-cover"
            />
            <p className="text-sm text-muted-foreground">
              Nhấn hoặc kéo thả để thay đổi
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {isDragActive ? "Thả ảnh vào đây" : "Kéo thả hoặc nhấn để chọn ảnh"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                JPEG, PNG, WebP - Tối đa 5MB
              </p>
              <p className="text-xs text-muted-foreground">
                Khuyến nghị: 1280x720 (tỉ lệ 16:9)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
