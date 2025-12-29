import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const categories = [
  "Tất cả",
  "Âm nhạc",
  "Trực tiếp",
  "Danh sách kết hợp",
  "Trò chơi",
  "Podcast",
  "Tin tức",
  "Thiên nhiên",
  "Thủ công",
  "Mới tải lên gần đây",
  "Đã xem",
  "Đề xuất mới",
];

interface CategoryChipsProps {
  selected?: string;
  onSelect?: (category: string) => void;
}

export const CategoryChips = ({ selected = "Tất cả", onSelect }: CategoryChipsProps) => {
  return (
    <div className="sticky top-14 z-30 border-b border-border bg-background">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-4 py-3">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selected === category ? "default" : "secondary"}
              size="sm"
              className={`rounded-full px-4 h-9 text-sm font-medium transition-all duration-300 ${
                selected === category
                  ? "bg-cosmic-cyan text-white shadow-[0_0_20px_rgba(0,255,255,0.8)] hover:shadow-[0_0_30px_rgba(0,255,255,1)] hover:scale-105"
                  : "bg-cosmic-cyan/20 text-cosmic-cyan border border-cosmic-cyan/40 hover:bg-cosmic-cyan/40 hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] hover:scale-105"
              }`}
              onClick={() => onSelect?.(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
};
