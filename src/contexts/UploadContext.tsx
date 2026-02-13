import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export interface UploadItem {
  id: string;
  file: File;
  metadata: {
    title: string;
    description: string;
    visibility: "public" | "unlisted" | "private";
    isShort: boolean;
    duration: number;
    channelId: string;
  };
  thumbnailBlob: Blob | null;
  thumbnailPreview: string | null;
  progress: number;
  stage: string;
  status: "pending" | "uploading" | "completed" | "error";
  videoId?: string;
  error?: string;
}

interface UploadContextType {
  uploads: UploadItem[];
  addUpload: (
    file: File,
    metadata: UploadItem["metadata"],
    thumbnailBlob: Blob | null,
    thumbnailPreview: string | null
  ) => void;
  removeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
  hasActiveUploads: boolean;
}

export const UploadContext = createContext<UploadContextType | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const { toast } = useToast();
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const updateUpload = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
    abortControllers.current.delete(id);
  }, []);

  const cancelUpload = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
    }
    removeUpload(id);
    toast({
      title: "Đã hủy tải lên",
      description: "Video đã được hủy.",
    });
  }, [removeUpload, toast]);

  const processUpload = useCallback(
    async (uploadItem: UploadItem) => {
      const { id, file, metadata, thumbnailBlob } = uploadItem;
      const controller = new AbortController();
      abortControllers.current.set(id, controller);

      try {
        updateUpload(id, { status: "uploading", stage: "Đang chuẩn bị..." });

        // Step 1: Upload video to R2
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        updateUpload(id, {
          stage: `Đang tải video lên... (${fileSizeMB} MB)`,
          progress: 5,
        });

        const sanitizedVideoName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
        const videoFileName = `videos/${Date.now()}-${sanitizedVideoName}`;

        let videoUrl: string;

        if (file.size > 100 * 1024 * 1024) {
          // Multipart upload for large files
          const { data: initData, error: initError } = await supabase.functions.invoke(
            "r2-upload",
            {
              body: {
                action: "initiateMultipart",
                fileName: videoFileName,
                contentType: file.type,
                fileSize: file.size,
              },
            }
          );

          if (initError || !initData?.uploadId) {
            throw new Error("Không thể khởi tạo upload.");
          }

          const { uploadId, publicUrl } = initData;
          const CHUNK_SIZE = 100 * 1024 * 1024;
          const totalParts = Math.ceil(file.size / CHUNK_SIZE);
          const uploadedParts: { partNumber: number; etag: string }[] = [];

          for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            if (controller.signal.aborted) throw new Error("Upload cancelled");

            const start = (partNumber - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const { data: partData } = await supabase.functions.invoke("r2-upload", {
              body: {
                action: "getPartUrl",
                fileName: videoFileName,
                uploadId,
                partNumber,
              },
            });

            if (!partData?.presignedUrl) throw new Error(`Lỗi phần ${partNumber}`);

            const partResponse = await new Promise<{ etag: string }>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  const partProgress = (start + e.loaded) / file.size;
                  updateUpload(id, {
                    progress: 5 + Math.round(partProgress * 75),
                    stage: `Đang tải phần ${partNumber}/${totalParts}...`,
                  });
                }
              };
              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  const etag = xhr.getResponseHeader("ETag") || `part-${partNumber}`;
                  resolve({ etag: etag.replace(/"/g, "") });
                } else reject(new Error(`Part ${partNumber} failed`));
              };
              xhr.onerror = () => reject(new Error("Network error"));
              xhr.open("PUT", partData.presignedUrl);
              xhr.timeout = 10 * 60 * 1000;
              xhr.send(chunk);
            });

            uploadedParts.push({ partNumber, etag: partResponse.etag });
          }

          await supabase.functions.invoke("r2-upload", {
            body: {
              action: "completeMultipart",
              fileName: videoFileName,
              uploadId,
              parts: uploadedParts,
            },
          });

          videoUrl = publicUrl;
        } else {
          // Simple upload for small files
          const { data: presignData } = await supabase.functions.invoke("r2-upload", {
            body: {
              action: "getPresignedUrl",
              fileName: videoFileName,
              contentType: file.type,
              fileSize: file.size,
            },
          });

          if (!presignData?.presignedUrl) throw new Error("Không thể tạo link upload");

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                updateUpload(id, {
                  progress: 5 + Math.round((e.loaded / e.total) * 75),
                });
              }
            };
            xhr.onload = () =>
              xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Tải lên thất bại"));
            xhr.onerror = () => reject(new Error("Lỗi mạng"));
            xhr.open("PUT", presignData.presignedUrl);
            xhr.timeout = 30 * 60 * 1000;
            xhr.send(file);
          });

          videoUrl = presignData.publicUrl;
        }

        updateUpload(id, { progress: 80 });

        // Step 2: Upload thumbnail
        let thumbnailUrl = null;
        if (thumbnailBlob) {
          updateUpload(id, { stage: "Đang tải thumbnail..." });
          const thumbnailFileName = `thumbnails/${Date.now()}-thumb.jpg`;

          const { data: thumbPresign } = await supabase.functions.invoke("r2-upload", {
            body: {
              action: "getPresignedUrl",
              fileName: thumbnailFileName,
              contentType: "image/jpeg",
              fileSize: thumbnailBlob.size,
            },
          });

          if (thumbPresign?.presignedUrl) {
            const thumbResponse = await fetch(thumbPresign.presignedUrl, {
              method: "PUT",
              body: thumbnailBlob,
              headers: { "Content-Type": "image/jpeg" },
            });
            if (thumbResponse.ok) {
              thumbnailUrl = thumbPresign.publicUrl;
            }
          }
        }

        updateUpload(id, { progress: 90, stage: "Đang lưu thông tin..." });

        // Step 3: Get user info
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Chưa đăng nhập");

        // PPLP Content Moderation via Angel AI
        updateUpload(id, { progress: 91, stage: "Angel AI đang kiểm duyệt..." });
        let approvalStatus = "approved";
        try {
          const { data: moderationResult } = await supabase.functions.invoke('moderate-content', {
            body: { content: `${metadata.title}\n${metadata.description}`, contentType: 'video_title' }
          });
          if (moderationResult && !moderationResult.approved) {
            approvalStatus = "pending_review";
          }
        } catch (modErr) {
          console.warn("[Moderation] Error (non-blocking):", modErr);
        }

        // Step 4: Create database record
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .insert({
            user_id: user.id,
            channel_id: metadata.channelId,
            title: metadata.title,
            description: metadata.description,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            file_size: file.size,
            duration: metadata.duration > 0 ? Math.round(metadata.duration) : null,
            is_public: metadata.visibility === "public",
            category: metadata.isShort ? "shorts" : "general",
            approval_status: approvalStatus,
          })
          .select("id")
          .single();

        if (videoError) throw videoError;

        updateUpload(id, {
          progress: 100,
          status: "completed",
          stage: approvalStatus === "approved" ? "Hoàn thành!" : "Đang chờ xem xét nội dung",
          videoId: videoData.id,
        });

        // Award upload reward (mobile background upload) - only if content approved
        if (approvalStatus === "approved") {
          try {
            console.log("[Upload Reward] Starting reward process for video:", videoData.id);
            
            // Check first upload reward (500K)
            const { data: profileData } = await supabase
              .from("profiles")
              .select("first_upload_rewarded")
              .eq("id", user.id)
              .single();

            let rewardAwarded = false;

            if (!profileData?.first_upload_rewarded) {
              console.log("[Upload Reward] Attempting FIRST_UPLOAD for video:", videoData.id);
              const { data: firstResult, error: firstError } = await supabase.functions.invoke("award-camly", {
                body: { type: "FIRST_UPLOAD", videoId: videoData.id },
              });
              
              if (!firstError && firstResult?.success) {
                rewardAwarded = true;
                await supabase
                  .from("profiles")
                  .update({ first_upload_rewarded: true })
                  .eq("id", user.id);
                
                window.dispatchEvent(new CustomEvent("camly-reward", {
                  detail: { type: "FIRST_UPLOAD", amount: firstResult?.amount || 500000, autoApproved: firstResult?.autoApproved }
                }));
              }
            }

            // Only award duration-based reward if FIRST_UPLOAD was NOT awarded
            if (!rewardAwarded) {
              const SHORT_VIDEO_MAX_DURATION = 180;
              const effectiveDuration = metadata.duration || 0;
              const uploadType = effectiveDuration <= SHORT_VIDEO_MAX_DURATION
                ? "SHORT_VIDEO_UPLOAD"
                : "LONG_VIDEO_UPLOAD";
              
              const { data: durationResult, error: durationError } = await supabase.functions.invoke("award-camly", {
                body: { type: uploadType, videoId: videoData.id },
              });
              
              if (!durationError && durationResult?.success) {
                window.dispatchEvent(new CustomEvent("camly-reward", {
                  detail: { type: uploadType, amount: durationResult?.amount || 0, autoApproved: durationResult?.autoApproved }
                }));
              }
            }

            // Mark video as rewarded
            await supabase
              .from("videos")
              .update({ upload_rewarded: true })
              .eq("id", videoData.id);
          } catch (rewardError) {
            console.error("[Upload Reward] Error (non-blocking):", rewardError);
          }
        } else {
          console.log("[Upload Reward] Skipped - content pending review");
        }

        toast({
          title: "Tải lên thành công! 🎉",
          description: `Video "${metadata.title}" đã sẵn sàng.`,
          action: (
            <a
              href={`/watch/${videoData.id}`}
              className="text-[hsl(var(--cosmic-cyan))] font-medium underline"
            >
              Xem ngay
            </a>
          ),
        });

        // Auto remove after 5 seconds
        setTimeout(() => removeUpload(id), 5000);
      } catch (error: any) {
        if (error.message === "Upload cancelled") return;

        console.error("Background upload error:", error);
        updateUpload(id, {
          status: "error",
          error: error.message || "Có lỗi xảy ra",
          stage: "Lỗi",
        });

        toast({
          title: "Lỗi tải lên",
          description: error.message || "Vui lòng thử lại sau.",
          variant: "destructive",
        });
      }
    },
    [updateUpload, removeUpload, toast]
  );

  const addUpload = useCallback(
    (
      file: File,
      metadata: UploadItem["metadata"],
      thumbnailBlob: Blob | null,
      thumbnailPreview: string | null
    ) => {
      const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newUpload: UploadItem = {
        id,
        file,
        metadata,
        thumbnailBlob,
        thumbnailPreview,
        progress: 0,
        stage: "Đang chờ...",
        status: "pending",
      };

      setUploads((prev) => [...prev, newUpload]);

      // Start processing immediately
      processUpload(newUpload);
    },
    [processUpload]
  );

  const hasActiveUploads = uploads.some(
    (u) => u.status === "pending" || u.status === "uploading"
  );

  return (
    <UploadContext.Provider
      value={{
        uploads,
        addUpload,
        removeUpload,
        cancelUpload,
        hasActiveUploads,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
