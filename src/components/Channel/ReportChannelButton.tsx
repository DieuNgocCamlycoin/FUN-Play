import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ReportChannelButtonProps {
  channelId: string;
  className?: string;
}

const REPORT_REASONS = [
  { value: "spam", label: "Kênh spam / Nội dung rác" },
  { value: "impersonation", label: "Mạo danh người khác" },
  { value: "harassment", label: "Quấy rối / Bắt nạt" },
  { value: "misleading", label: "Thông tin gây hiểu lầm" },
  { value: "community_violation", label: "Vi phạm quy tắc cộng đồng" },
];

export function ReportChannelButton({ channelId, className }: ReportChannelButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(false);

  const handleReport = async () => {
    if (!user) {
      toast({ title: "Vui lòng đăng nhập", variant: "destructive" });
      return;
    }

    if (debounceRef.current) return;
    debounceRef.current = true;

    setSubmitting(true);
    const { error } = await supabase.from("channel_reports" as any).insert({
      channel_id: channelId,
      reporter_id: user.id,
      reason,
      detail: detail.trim() || null,
    } as any);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Bạn đã báo cáo kênh này rồi", description: "Mỗi người chỉ được báo cáo 1 lần" });
      } else {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Cảm ơn bạn đã đóng góp ánh sáng cho cộng đồng ✨", description: "Báo cáo kênh đã được ghi nhận" });
    }

    setSubmitting(false);
    setOpen(false);
    setDetail("");

    setTimeout(() => {
      debounceRef.current = false;
    }, 2000);
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
        Báo cáo kênh
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Báo cáo kênh 🚩</DialogTitle>
          </DialogHeader>

          <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-3">
                <RadioGroupItem value={r.value} id={`channel-${r.value}`} />
                <Label htmlFor={`channel-${r.value}`} className="cursor-pointer">{r.label}</Label>
              </div>
            ))}
          </RadioGroup>

          <Textarea
            placeholder="Chi tiết bổ sung (tùy chọn)..."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={500}
            className="mt-2"
          />

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
