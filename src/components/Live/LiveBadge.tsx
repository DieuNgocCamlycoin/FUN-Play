import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export const LiveBadge = ({ className, size = "md", pulse = true }: LiveBadgeProps) => {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 bg-destructive text-destructive-foreground font-bold rounded uppercase tracking-wider",
        sizeClasses[size],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive-foreground" />
        </span>
      )}
      Live
    </span>
  );
};
