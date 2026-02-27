import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePplpEventIngest } from "@/hooks/usePplpEventIngest";
import { Star } from "lucide-react";

const PILLARS = [
  { key: "pillar_truth", label: "Chân Thật", desc: "Nội dung trung thực, không phóng đại", icon: "🔍" },
  { key: "pillar_sustain", label: "Bền Vững", desc: "Giá trị lâu dài, không gây hại", icon: "🌱" },
  { key: "pillar_heal_love", label: "Chữa Lành & Yêu Thương", desc: "Lan tỏa năng lượng tích cực", icon: "💛" },
  { key: "pillar_life_service", label: "Phụng Sự Sự Sống", desc: "Hữu ích cho cộng đồng", icon: "🙏" },
  { key: "pillar_unity_source", label: "Hợp Nhất & Nguồn Cội", desc: "Kết nối, không chia rẽ", icon: "✨" },
] as const;

type PillarKey = (typeof PILLARS)[number]["key"];

interface PPLPRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentType: "post" | "video" | "comment";
  authorUserId: string;
  onRated?: () => void;
}

export const PPLPRatingModal = ({
  open,
  onOpenChange,
  contentId,
  contentType,
  authorUserId,
  onRated,
}: PPLPRatingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { ingestEvent } = usePplpEventIngest();
  const [scores, setScores] = useState<Record<PillarKey, number>>({
    pillar_truth: 0,
    pillar_sustain: 0,
    pillar_heal_love: 0,
    pillar_life_service: 0,
    pillar_unity_source: 0,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleScore = (pillar: PillarKey, value: number) => {
    setScores((prev) => ({ ...prev, [pillar]: prev[pillar] === value ? 0 : value }));
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const handleSubmit = async () => {
    if (!user) return;
    if (user.id === authorUserId) {
      toast({ title: "Không thể tự đánh giá", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("pplp_ratings").insert({
        content_id: contentId,
        content_type: contentType,
        rater_user_id: user.id,
        author_user_id: authorUserId,
        pillar_truth: scores.pillar_truth,
        pillar_sustain: scores.pillar_sustain,
        pillar_heal_love: scores.pillar_heal_love,
        pillar_life_service: scores.pillar_life_service,
        pillar_unity_source: scores.pillar_unity_source,
        comment: comment || null,
        weight_applied: 1, // TODO: fetch rater's reputation weight
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Bạn đã đánh giá nội dung này rồi", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        // Ingest PPLP event
        await ingestEvent({
          event_type: "PPLP_RATING_SUBMITTED",
          target_type: contentType,
          target_id: contentId,
          payload_json: { scores, total: totalScore },
          scoring_tags: ["pplp_pillar_candidate"],
        });

        toast({ title: "Cảm ơn đánh giá của bạn! 🌟" });
        onRated?.();
        onOpenChange(false);
        // Reset
        setScores({ pillar_truth: 0, pillar_sustain: 0, pillar_heal_love: 0, pillar_life_service: 0, pillar_unity_source: 0 });
        setComment("");
      }
    } catch (err) {
      console.error("Rating error:", err);
      toast({ title: "Lỗi khi gửi đánh giá", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-[hsl(var(--cosmic-gold))]" />
            Đánh giá PPLP
          </DialogTitle>
          <DialogDescription>
            Chấm nội dung theo 5 trụ cột (0-2 điểm mỗi trụ)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {PILLARS.map((pillar) => (
            <div key={pillar.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {pillar.icon} {pillar.label}
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleScore(pillar.key, val)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                        scores[pillar.key] === val
                          ? val === 0
                            ? "bg-muted text-muted-foreground ring-2 ring-muted-foreground/30"
                            : val === 1
                            ? "bg-[hsl(var(--cosmic-cyan))]/20 text-[hsl(var(--cosmic-cyan))] ring-2 ring-[hsl(var(--cosmic-cyan))]/50"
                            : "bg-[hsl(var(--cosmic-gold))]/20 text-[hsl(var(--cosmic-gold))] ring-2 ring-[hsl(var(--cosmic-gold))]/50"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{pillar.desc}</p>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm font-semibold">Tổng điểm</span>
            <span className={`text-lg font-bold ${
              totalScore >= 8 ? "text-[hsl(var(--cosmic-gold))]" :
              totalScore >= 5 ? "text-[hsl(var(--cosmic-cyan))]" :
              "text-muted-foreground"
            }`}>
              {totalScore}/10
            </span>
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Nhận xét (tuỳ chọn)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
            rows={2}
          />

          <Button
            onClick={handleSubmit}
            disabled={submitting || totalScore === 0}
            className="w-full bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))]"
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
