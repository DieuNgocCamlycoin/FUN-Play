import { Livestream } from "@/hooks/useLivestream";
import { LiveBadge } from "./LiveBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LiveCardProps {
  livestream: Livestream;
}

export const LiveCard = ({ livestream }: LiveCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/live/${livestream.id}`)}
      className="group cursor-pointer rounded-xl overflow-hidden border border-border bg-background hover:border-primary/30 transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {livestream.thumbnail_url ? (
          <img
            src={livestream.thumbnail_url}
            alt={livestream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-destructive/20 to-primary/20">
            <span className="text-4xl">📡</span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <LiveBadge size="sm" />
          <div className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            <Users className="h-2.5 w-2.5" />
            <span>{livestream.viewer_count}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex items-start gap-2">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={livestream.profile?.avatar_url || ""} />
          <AvatarFallback className="text-xs">
            {(livestream.profile?.display_name || "U")[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {livestream.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {livestream.profile?.display_name || livestream.profile?.username}
          </p>
        </div>
      </div>
    </div>
  );
};
