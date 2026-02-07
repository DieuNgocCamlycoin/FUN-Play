import { ScrollArea } from "@/components/ui/scroll-area";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { cn } from "@/lib/utils";
import { HonorBoardCard } from "@/components/Layout/HonorBoardCard";
import { TopRankingCard } from "@/components/Layout/TopRankingCard";
import { TopSponsorsCard } from "@/components/Layout/TopSponsorsCard";

interface HonoboardRightSidebarProps {
  className?: string;
}

export const HonoboardRightSidebar = ({ className }: HonoboardRightSidebarProps) => {
  const { stats, loading } = useHonobarStats();

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col w-[280px] shrink-0 h-[calc(100vh-3.5rem)]",
        "fixed right-0 top-14 z-40",
        "bg-gradient-to-b from-white via-white to-[#F0FDFF]",
        "border-l border-border/50",
        "shadow-[-10px_0_40px_rgba(0,231,255,0.1)]",
        className
      )}
    >
      <ScrollArea className="flex-1 px-3 py-3 overflow-x-hidden">
        {/* 3 Separate Cards stacked vertically */}
        <div className="space-y-3">
          {/* 1. Honor Board Card */}
          <HonorBoardCard stats={stats} loading={loading} />

          {/* 2. Top Ranking Card */}
          <TopRankingCard />

          {/* 3. Top Sponsors Card */}
          <TopSponsorsCard />
        </div>

        {/* FUN Play Branding */}
        <div className="mt-4 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">
            Powered by <span className="font-semibold bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">FUN Play</span>
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
};
