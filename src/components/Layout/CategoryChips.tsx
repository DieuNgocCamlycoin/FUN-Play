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
    <div className="border-b border-border bg-white/95 backdrop-blur-sm">
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
                    ? "bg-gradient-to-r from-[#22D3EE] via-[#FFD700] to-[#FFB7F6] text-gray-900 font-semibold border border-[#FFD700]/50 shadow-[0_0_14px_rgba(255,215,0,0.4)] hover:shadow-[0_0_22px_rgba(255,215,0,0.6)] hover:scale-105"
                    : "bg-white/90 backdrop-blur-sm text-[#0284C7] border border-[#22D3EE]/30 hover:bg-white hover:text-[#0369A1] hover:border-[#FFD700]/50 hover:shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                }`}
                onClick={() => onSelect?.(category)}
              >
                {isSelected && (
                  <div
                    className="absolute inset-0 animate-mirror-shimmer pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                      width: "50%",
                    }}
                  />
                )}
                <span className="relative z-10">{category}</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
