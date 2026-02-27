import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UploadGateResult {
  allowed: boolean;
  reason?: "avatar" | "content_blocked";
  message?: string;
  approvalStatus?: "approved" | "pending_review";
}

export function useUploadGate() {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [gateResult, setGateResult] = useState<UploadGateResult | null>(null);

  const checkBeforeUpload = useCallback(
    async (title: string, description: string): Promise<UploadGateResult> => {
      if (!user) {
        return { allowed: false, reason: "avatar", message: "Chưa đăng nhập" };
      }

      setIsChecking(true);
      setGateResult(null);

      try {
        // Step 1: Check avatar_verified
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_verified, suspicious_score")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.avatar_verified) {
          const result: UploadGateResult = {
            allowed: false,
            reason: "avatar",
            message: "Vui lòng xác minh ảnh đại diện thật trước khi tải video lên.",
          };
          setGateResult(result);
          return result;
        }

        // Step 1b: Suspicious score check - log only, auto-approve all uploads
        if ((profile?.suspicious_score ?? 0) >= 3) {
          console.warn("[UploadGate] User has suspicious_score >= 3, but auto-approving per policy");
        }

        // Step 2: Run content moderation via moderate-content edge function
        const contentToCheck = `${title}\n${description}`;
        try {
          const { data: moderationResult } = await supabase.functions.invoke(
            "moderate-content",
            {
              body: {
                content: contentToCheck,
                contentType: "video_title",
              },
            }
          );

          if (moderationResult) {
            const score = moderationResult.score ?? 10;

            if (score < 3) {
              const result: UploadGateResult = {
                allowed: false,
                reason: "content_blocked",
                message:
                  moderationResult.reason ||
                  "Nội dung không phù hợp với tiêu chuẩn PPLP (Tích cực, Hướng thiện, Yêu thương, Ánh sáng). Vui lòng chỉnh sửa tiêu đề hoặc mô tả.",
              };
              setGateResult(result);
              return result;
            }

            // Score 3-5: auto-approve (previously pending_review)
            if (score <= 5) {
              console.warn("[UploadGate] Moderation score borderline:", score, "- auto-approving per policy");
            }
          }
        } catch (modErr) {
          console.warn("[UploadGate] Moderation error (non-blocking):", modErr);
          // If moderation fails, allow upload with approved status
        }

        // Score > 5 or moderation unavailable → approved
        const result: UploadGateResult = {
          allowed: true,
          approvalStatus: "approved",
        };
        setGateResult(result);
        return result;
      } finally {
        setIsChecking(false);
      }
    },
    [user]
  );

  const resetGate = useCallback(() => {
    setGateResult(null);
    setIsChecking(false);
  }, []);

  return { checkBeforeUpload, isChecking, gateResult, resetGate };
}
