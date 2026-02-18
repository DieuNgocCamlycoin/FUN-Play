import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ReportSpamButtonProps {
  videoId: string;
  className?: string;
}

const REPORT_REASONS = [
  { value: "spam", label: "Video spam / rác" },
  { value: "fake", label: "Nội dung giả mạo" },
  { value: "reupload", label: "Video reupload / sao chép" },
  { value: "inappropriate", label: "Nội dung không phù hợp" },
  { value: "scam", label: "Lừa đảo" },
];

export function ReportSpamButton({ videoId, className }: ReportSpamButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async () => {
    if (!user) {
      toast({ title: "Vui lòng đăng nhập", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("video_reports").insert({
      video_id: videoId,
      reporter_id: user.id,
      reason,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Bạn đã báo cáo video này rồi", description: "Mỗi người chỉ được báo cáo 1 lần" });
      } else {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Đã báo cáo thành công ✅", description: "Cảm ơn bạn đã giúp cộng đồng sạch hơn!" });
    }

    setSubmitting(false);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Flag className="w-4 h-4 mr-1" />
        Báo cáo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Báo cáo video 🚩</DialogTitle>
          </DialogHeader>

          <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-3">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="cursor-pointer">{r.label}</Label>
              </div>
            ))}
          </RadioGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReport} disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi báo cáo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
