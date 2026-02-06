import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BountySubmissionCard } from "./BountySubmissionCard";
import type { BountySubmission } from "@/hooks/useBountySubmissions";
import { Trophy } from "lucide-react";

interface BountySubmissionListProps {
  submissions: BountySubmission[];
  userUpvotes: string[];
  isLoading: boolean;
  onToggleUpvote: (id: string) => void;
  isTogglingUpvote: boolean;
}

export function BountySubmissionList({
  submissions,
  userUpvotes,
  isLoading,
  onToggleUpvote,
  isTogglingUpvote,
}: BountySubmissionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm text-foreground">Đóng góp từ cộng đồng</span>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border border-border/50">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">Đóng góp từ cộng đồng</span>
          <span className="text-xs text-muted-foreground">0 đóng góp</span>
        </div>
        <Card className="border border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">Chưa có đóng góp nào</p>
            <p className="text-xs mt-1">Hãy là người đầu tiên đóng góp! 🚀</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-foreground">Đóng góp từ cộng đồng</span>
        <span className="text-xs text-muted-foreground">{submissions.length} đóng góp</span>
      </div>
      {submissions.map((sub) => (
        <BountySubmissionCard
          key={sub.id}
          submission={sub}
          hasUpvoted={userUpvotes.includes(sub.id)}
          onToggleUpvote={onToggleUpvote}
          isTogglingUpvote={isTogglingUpvote}
        />
      ))}
    </div>
  );
}
