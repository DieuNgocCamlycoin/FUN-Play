import { Crown, Users, Video, Eye, MessageCircle, Coins, Bell, Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { cn } from "@/lib/utils";

interface HonoboardRightSidebarProps {
  className?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const getRankBadge = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}.`;
};

export const HonoboardRightSidebar = ({ className }: HonoboardRightSidebarProps) => {
  const { stats, loading } = useHonobarStats();

  const statItems = [
    { icon: Users, label: "Users", value: stats.totalUsers, color: "text-sky-500" },
    { icon: Video, label: "Videos", value: stats.totalVideos, color: "text-purple-500" },
    { icon: Eye, label: "Views", value: stats.totalViews, color: "text-cyan-500" },
    { icon: MessageCircle, label: "Comments", value: stats.totalComments, color: "text-green-500" },
    { icon: Bell, label: "Subscriptions", value: stats.totalSubscriptions, color: "text-orange-500" },
    { icon: Coins, label: "CAMLY Pool", value: stats.camlyPool, color: "text-yellow-500" },
  ];

  return (
    <aside 
      className={cn(
        "hidden xl:flex flex-col w-72 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14",
        className
      )}
    >
      <ScrollArea className="flex-1 px-3 py-4">
        {/* Header */}
        <div className="relative mb-4 p-4 rounded-xl bg-gradient-to-br from-yellow-50 via-white to-cyan-50 border-2 border-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/10 via-transparent to-cyan-400/10 animate-pulse" />
          <div className="relative flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500 animate-bounce" />
            <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600 bg-clip-text text-transparent">
              HONOR BOARD
            </h2>
            <Crown className="h-6 w-6 text-yellow-500 animate-bounce" />
          </div>
          {/* Realtime indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span>Realtime</span>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            📊 Platform Stats
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {statItems.map((item) => (
              <div 
                key={item.label}
                className="flex items-center gap-2 p-2 rounded-md bg-background/80 hover:bg-background transition-colors"
              >
                <item.icon className={cn("h-4 w-4", item.color)} />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold">
                    {loading ? "..." : formatNumber(item.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Creators */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50/50 via-white to-cyan-50/50 border border-purple-200/30">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top 10 Creators
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-2 bg-muted rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats.topCreators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No creators yet
            </p>
          ) : (
            <div className="space-y-1">
              {stats.topCreators.map((creator, index) => (
                <div 
                  key={creator.userId}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
                    "hover:bg-primary/5 hover:scale-[1.02]",
                    index < 3 && "bg-gradient-to-r from-yellow-50/50 to-transparent"
                  )}
                >
                  <span className="w-6 text-center font-medium text-sm">
                    {getRankBadge(index + 1)}
                  </span>
                  <Avatar className={cn(
                    "h-8 w-8 border-2",
                    index === 0 && "border-yellow-400 ring-2 ring-yellow-200",
                    index === 1 && "border-gray-400",
                    index === 2 && "border-orange-400",
                    index > 2 && "border-border"
                  )}>
                    <AvatarImage src={creator.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10">
                      {creator.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-sky-700">
                      {creator.displayName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Video className="h-3 w-3" />
                        {creator.videoCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        {formatNumber(creator.totalViews)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FUN Play Branding */}
        <div className="mt-4 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-sky-600">FUN Play</span>
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
};
