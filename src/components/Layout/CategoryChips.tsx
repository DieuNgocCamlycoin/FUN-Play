import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const categories = [
  "Tất cả",
  "Xu hướng",
  "Âm nhạc",
  "Thiền",
  "Trò chơi",
  "Podcast",
  "Tin tức",
  "Thiên nhiên",
  "Mới tải lên gần đây",
  "Đề xuất mới",
];

interface CategoryChipsProps {
  selected?: string;
  onSelect?: (category: string) => void;
}

export const CategoryChips = ({ selected = "Tất cả", onSelect }: CategoryChipsProps) => {
  return (
    <div className="border-b border-border bg-background">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-4 py-3">
          {categories.map((category) => {
            const isSelected = selected === category;
            return (
              <Button
                key={category}
                variant={isSelected ? "default" : "secondary"}
                size="sm"
                className={`relative overflow-hidden rounded-full px-4 h-8 text-sm transition-all ${
                  isSelected
                    ? "bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800] text-[#7C5800] font-extrabold border border-[#FFEA00]/60 shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(255,234,0,0.6)] hover:scale-105"
                    : "bg-[linear-gradient(90deg,#5EEAD4_0%,#22D3EE_35%,#06B6D4_50%,#0EA5E9_75%,#0284C7_100%)] text-white font-semibold border border-transparent !shadow-none hover:brightness-110 hover:!shadow-none"
                }`}
                onClick={() => onSelect?.(category)}
              >
                <span className="relative z-10">{category}</span>
                {isSelected && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer" />
                )}
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
