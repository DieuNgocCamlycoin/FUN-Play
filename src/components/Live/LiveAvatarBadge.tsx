import { cn } from "@/lib/utils";
import { LiveBadge } from "./LiveBadge";

interface LiveAvatarBadgeProps {
  isLive: boolean;
  children: React.ReactNode;
  className?: string;
}

export const LiveAvatarBadge = ({ isLive, children, className }: LiveAvatarBadgeProps) => {
  return (
    <div className={cn("relative inline-block", className)}>
      {children}
      {isLive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
          <LiveBadge size="sm" />
        </div>
      )}
    </div>
  );
};
