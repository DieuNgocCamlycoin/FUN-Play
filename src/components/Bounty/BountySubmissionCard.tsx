import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, Lightbulb, Bug, MessageSquare, Sparkles, Award, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { BountySubmission } from "@/hooks/useBountySubmissions";

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  idea: { label: "Ý tưởng", icon: Lightbulb, color: "text-yellow-500" },
  bug: { label: "Báo lỗi", icon: Bug, color: "text-red-500" },
  feedback: { label: "Phản hồi", icon: MessageSquare, color: "text-blue-500" },
  feature: { label: "Tính năng", icon: Sparkles, color: "text-purple-500" },
  // Fallbacks for old categories
  bug_report: { label: "Báo Lỗi", icon: Bug, color: "text-red-500" },
  feature_request: { label: "Đề Xuất", icon: Lightbulb, color: "text-yellow-500" },
  content: { label: "Nội Dung", icon: MessageSquare, color: "text-blue-500" },
  translation: { label: "Dịch Thuật", icon: MessageSquare, color: "text-green-500" },
  other: { label: "Khác", icon: MessageSquare, color: "text-muted-foreground" },
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
  const TypeIcon = typeInfo.icon;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Upvote button */}
          <div className="flex flex-col items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 rounded-full ${
                hasUpvoted
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              onClick={() => onToggleUpvote(submission.id)}
              disabled={isTogglingUpvote}
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
            <span className={`text-sm font-bold ${hasUpvoted ? "text-primary" : "text-muted-foreground"}`}>
              {submission.upvote_count || 0}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="gap-1 text-xs">
                <TypeIcon className={`w-3 h-3 ${typeInfo.color}`} />
                {typeInfo.label}
              </Badge>
              {submission.status === "rewarded" && submission.reward_amount > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1 text-xs">
                  <Award className="w-3 h-3" />
                  {submission.reward_amount} CAMLY
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-sm leading-tight">{submission.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{submission.description}</p>

            {submission.image_url && (
              <a
                href={submission.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <ExternalLink className="w-3 h-3" /> Xem ảnh
              </a>
            )}

            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{submission.name || "Ẩn danh"}</span>
              <span>·</span>
              <span>{format(new Date(submission.created_at), "dd/MM/yyyy")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
