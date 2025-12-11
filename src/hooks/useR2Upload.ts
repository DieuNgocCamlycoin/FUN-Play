import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseR2UploadOptions {
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
}

export function useR2Upload(options: UseR2UploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const { toast } = useToast();

  const uploadToR2 = async (
    file: File, 
    customFileName?: string
  ): Promise<{ publicUrl: string; fileName: string } | null> => {
    try {
      setUploading(true);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      // Get current user for folder naming
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Authentication required");
      }

      // Generate file path
      const fileExt = file.name.split(".").pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 50);
      const fileName = customFileName || 
        `${options.folder || 'uploads'}/${user.id}/${Date.now()}-${sanitizedName}`;

      // Get presigned URL from edge function
      const { data: presignData, error: presignError } = await supabase.functions.invoke('r2-upload', {
        body: {
          action: 'getPresignedUrl',
          fileName,
          contentType: file.type,
          fileSize: file.size,
        }
      });

      if (presignError || !presignData?.presignedUrl) {
        console.error("Presign error:", presignError, presignData);
        throw new Error(presignData?.error || "Failed to get upload URL");
      }

      // Upload directly to R2 using presigned URL with progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const uploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            setProgress(uploadProgress);
            options.onProgress?.(uploadProgress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.ontimeout = () => reject(new Error("Upload timed out"));

        xhr.open('PUT', presignData.presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.timeout = 600000; // 10 minutes
        xhr.send(file);
      });

      await uploadPromise;

      console.log("R2 Upload successful:", presignData.publicUrl);

      return {
        publicUrl: presignData.publicUrl,
        fileName: presignData.fileName,
      };

    } catch (error: any) {
      console.error("R2 Upload error:", error);
      toast({
        title: "Lỗi tải lên",
        description: error.message || "Không thể tải file lên",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const deleteFromR2 = async (fileName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('r2-upload', {
        body: {
          action: 'delete',
          fileName,
        }
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("R2 Delete error:", error);
      return false;
    }
  };

  return {
    uploadToR2,
    deleteFromR2,
    uploading,
    progress,
  };
}
