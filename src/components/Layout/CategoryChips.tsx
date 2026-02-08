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
              className={`rounded-full px-4 h-8 text-sm transition-all ${
                selected === category
                  ? "bg-gradient-to-r from-[#0066FF] via-[#00CC66] to-[#FFD700] text-white font-semibold shadow-[0_0_12px_rgba(0,204,102,0.35)] border border-[#00CC66]/40 hover:shadow-[0_0_18px_rgba(0,204,102,0.5)]"
                  : "bg-white/90 text-[#0066FF] font-medium border border-[#00CC66]/25 hover:bg-white hover:text-[#0055DD] hover:border-[#00CC66]/50 hover:shadow-[0_0_8px_rgba(0,204,102,0.2)]"
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
