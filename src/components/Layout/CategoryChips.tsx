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
          {categories.map((category) => (
            <Button
              key={category}
              variant={selected === category ? "default" : "secondary"}
              size="sm"
              className={`rounded-full px-4 h-8 text-sm font-semibold transition-all duration-300 ${
                selected === category
                  ? "bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] text-white border border-[#00E7FF]/40 shadow-[0_0_15px_rgba(0,231,255,0.4)] hover:shadow-[0_0_20px_rgba(0,231,255,0.6)]"
                  : "bg-white/90 backdrop-blur-sm text-[#7A2BFF] border border-[#7A2BFF]/20 hover:border-[#00E7FF]/50 hover:shadow-[0_0_10px_rgba(0,231,255,0.3)] hover:text-[#7A2BFF]"
              }`}
              onClick={() => onSelect?.(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
