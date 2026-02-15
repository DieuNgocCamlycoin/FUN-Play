import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UploadGateResult } from "@/hooks/useUploadGate";

interface ContentModerationFeedbackProps {
  isChecking: boolean;
  result: UploadGateResult | null;
  onRetry?: () => void;
  onClose?: () => void;
}

export function ContentModerationFeedback({
  isChecking,
  result,
  onRetry,
  onClose,
}: ContentModerationFeedbackProps) {
  // Loading state
  if (isChecking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4"
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] opacity-20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[hsl(var(--cosmic-cyan))] animate-spin" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Angel AI đang kiểm duyệt...</p>
          <p className="text-xs text-muted-foreground">
            Đang đánh giá nội dung theo tiêu chuẩn PPLP ✨
          </p>
        </div>
      </motion.div>
    );
  }

  // Content blocked
  if (result && !result.allowed && result.reason === "content_blocked") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="font-bold text-destructive">Nội dung chưa phù hợp</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.message}
          </p>
        </div>
        <div className="flex gap-3">
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="min-h-[44px]">
              Chỉnh sửa lại
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="min-h-[44px]">
              Đóng
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // Pending review
  if (result?.allowed && result.approvalStatus === "pending_review") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--cosmic-gold)/0.1)] border border-[hsl(var(--cosmic-gold)/0.3)]"
      >
        <AlertTriangle className="w-5 h-5 text-[hsl(var(--cosmic-gold))] flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Nội dung sẽ được Admin xem xét trước khi hiển thị công khai.
        </p>
      </motion.div>
    );
  }

  // Approved
  if (result?.allowed && result.approvalStatus === "approved") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--cosmic-cyan)/0.1)] border border-[hsl(var(--cosmic-cyan)/0.3)]"
      >
        <CheckCircle className="w-5 h-5 text-[hsl(var(--cosmic-cyan))] flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Angel AI đã duyệt nội dung ✨
        </p>
      </motion.div>
    );
  }

  return null;
}
