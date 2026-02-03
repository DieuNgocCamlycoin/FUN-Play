import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface CommentsCardProps {
  commentCount: number;
  latestComment?: Comment | null;
  onClick: () => void;
}

export function CommentsCard({ commentCount, latestComment, onClick }: CommentsCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full mx-3 my-2 p-3 bg-muted/50 rounded-xl text-left active:bg-muted/70 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Bình luận</span>
          <span className="text-sm text-muted-foreground">{commentCount}</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Preview comment */}
      {latestComment ? (
        <div className="flex items-start gap-2">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={latestComment.profiles.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {latestComment.profiles.display_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {latestComment.content}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </p>
      )}
    </button>
  );
}
