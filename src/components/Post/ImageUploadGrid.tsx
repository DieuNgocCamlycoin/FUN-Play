import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Plus, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface ImageUploadGridProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  previewUrls: string[];
  maxImages?: number;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

export const ImageUploadGrid = ({
  images,
  onImagesChange,
  previewUrls,
  maxImages = 30,
  disabled = false,
}: ImageUploadGridProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = maxImages - images.length;
      
      if (acceptedFiles.length > remainingSlots) {
        toast({
          title: `Chỉ có thể thêm ${remainingSlots} ảnh nữa`,
          description: `Tối đa ${maxImages} ảnh/bài viết`,
          variant: "destructive",
        });
      }

      const validFiles = acceptedFiles
        .slice(0, remainingSlots)
        .filter((file) => {
          if (file.size > MAX_FILE_SIZE) {
            toast({
              title: "File quá lớn",
              description: `${file.name} vượt quá 10MB`,
              variant: "destructive",
            });
            return false;
          }
          return true;
        });

      if (validFiles.length > 0) {
        onImagesChange([...images, ...validFiles]);
      }
    },
    [images, maxImages, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    disabled,
    noClick: images.length > 0, // Disable click on dropzone if there are images
    noKeyboard: true,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const getGridCols = () => {
    const count = previewUrls.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    return "grid-cols-3 sm:grid-cols-4 md:grid-cols-5";
  };

  if (images.length === 0) {
    return (
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
          ${isDragActive 
            ? "border-[hsl(var(--cosmic-cyan))] bg-[hsl(var(--cosmic-cyan))]/10" 
            : "border-border hover:border-[hsl(var(--cosmic-cyan))]/50 hover:bg-muted/30"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImagePlus className="w-8 h-8" />
          <p className="text-sm text-center">
            {isDragActive ? (
              "Thả ảnh vào đây..."
            ) : (
              <>
                Kéo thả ảnh hoặc <span className="text-[hsl(var(--cosmic-cyan))]">bấm để chọn</span>
              </>
            )}
          </p>
          <p className="text-xs">Tối đa {maxImages} ảnh, mỗi ảnh ≤ 10MB</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Image Grid */}
      <div
        {...getRootProps()}
        className={`
          grid ${getGridCols()} gap-2 p-2 rounded-xl border-2 border-dashed transition-all
          ${isDragActive 
            ? "border-[hsl(var(--cosmic-cyan))] bg-[hsl(var(--cosmic-cyan))]/10" 
            : "border-transparent hover:border-border"
          }
        `}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="popLayout">
          {previewUrls.map((url, index) => (
            <motion.div
              key={url}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
              className="relative group aspect-square"
            >
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              {/* Remove button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              {/* Index badge */}
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </motion.div>
          ))}

          {/* Add more button */}
          {images.length < maxImages && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan))]/10 flex flex-col items-center justify-center gap-1 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              <Plus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{images.length}/{maxImages}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Counter */}
      <p className="text-xs text-muted-foreground text-center">
        {images.length}/{maxImages} ảnh
      </p>
    </div>
  );
};

export default ImageUploadGrid;
