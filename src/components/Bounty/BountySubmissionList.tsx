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
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Chưa có đóng góp nào</p>
          <p className="text-sm mt-1">Hãy là người đầu tiên đóng góp! 🚀</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">Đóng góp cộng đồng ({submissions.length})</h2>
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
