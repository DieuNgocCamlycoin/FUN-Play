import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useR2Upload } from "@/hooks/useR2Upload";

interface DragDropImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  bucketName?: string;
  folderPath?: string;
  label: string;
  aspectRatio?: string;
  maxSizeMB?: number;
}

export function DragDropImageUpload({
  currentImageUrl,
  onImageUploaded,
  bucketName = "uploads",
  folderPath = "profiles",
  label,
  aspectRatio = "aspect-square",
  maxSizeMB = 5,
}: DragDropImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);
  const { toast } = useToast();
  const { uploadToR2, uploading: isUploading } = useR2Upload({ folder: folderPath });

  const uploadFile = async (file: File) => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: "File too large",
        description: `Please select an image under ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Upload to R2
    const result = await uploadToR2(file);
    
    if (result) {
      setPreviewUrl(result.publicUrl);
      onImageUploaded(result.publicUrl);
      toast({
        title: "Upload successful",
        description: "Your image has been uploaded to cloud storage",
      });
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        uploadFile(file);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onImageUploaded("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        } ${aspectRatio} overflow-hidden`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {previewUrl ? (
          <div className="relative w-full h-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!isUploading && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max {maxSizeMB}MB
                </p>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
}
