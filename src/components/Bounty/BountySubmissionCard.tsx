import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { BountySubmission } from "@/hooks/useBountySubmissions";

const TYPE_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  idea: { label: "💡 Ý tưởng", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  bug: { label: "🐛 Báo lỗi", bgColor: "bg-red-100", textColor: "text-red-600" },
  feedback: { label: "💬 Feedback", bgColor: "bg-blue-100", textColor: "text-blue-600" },
  feature: { label: "✨ Đề xuất tính năng", bgColor: "bg-green-100", textColor: "text-green-600" },
  // Fallbacks
  bug_report: { label: "🐛 Báo Lỗi", bgColor: "bg-red-100", textColor: "text-red-600" },
  feature_request: { label: "💡 Đề Xuất", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  content: { label: "💬 Nội Dung", bgColor: "bg-blue-100", textColor: "text-blue-600" },
  translation: { label: "🌐 Dịch Thuật", bgColor: "bg-emerald-100", textColor: "text-emerald-600" },
  other: { label: "📝 Khác", bgColor: "bg-gray-100", textColor: "text-gray-600" },
};

interface BountySubmissionCardProps {
  submission: BountySubmission;
  hasUpvoted: boolean;
  onToggleUpvote: (id: string) => void;
  isTogglingUpvote: boolean;
}

export function BountySubmissionCard({
  submission,
  hasUpvoted,
  onToggleUpvote,
  isTogglingUpvote,
}: BountySubmissionCardProps) {
  const typeKey = submission.contribution_type || submission.category;
  const typeInfo = TYPE_CONFIG[typeKey] || TYPE_CONFIG.other;

  const isRewarded = submission.status === "rewarded" && submission.reward_amount > 0;
  const timeAgo = formatDistanceToNow(new Date(submission.created_at), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-2.5">
        {/* Top: Type badge + Rewarded badge */}
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`text-[11px] font-medium border-0 ${typeInfo.bgColor} ${typeInfo.textColor} rounded-full px-2.5 py-0.5`}
          >
            {typeInfo.label}
          </Badge>
          {isRewarded && (
            <Badge className="text-[11px] font-medium bg-green-100 text-green-600 border-0 rounded-full px-2.5 py-0.5">
              ✅ Rewarded
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm leading-snug text-foreground">
          {submission.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {submission.description}
        </p>

        {/* Author + Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="w-3 h-3" />
          <span>{submission.name || "Ẩn danh"}</span>
          <span className="mx-0.5">·</span>
          <span>{timeAgo}</span>
        </div>

        {/* Bottom: Upvote + Reward amount */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onToggleUpvote(submission.id)}
            disabled={isTogglingUpvote}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              hasUpvoted
                ? "text-pink-500"
                : "text-muted-foreground hover:text-pink-400"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${hasUpvoted ? "fill-pink-500" : ""}`}
            />
            <span>{submission.upvote_count || 0}</span>
          </button>

          {isRewarded && (
            <Badge className="text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2.5 py-0.5">
              ✨ {submission.reward_amount.toLocaleString()} CAMLY
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
