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
            variant="ghost"
            size="sm"
            className={`rounded-full px-5 h-10 text-sm font-semibold transition-all duration-300 ${
              selected === category
                ? "!bg-cyan-400 !text-white shadow-lg shadow-cyan-400/50 hover:shadow-xl hover:shadow-cyan-400/70 hover:scale-105 hover:!bg-cyan-500"
                : "!bg-cyan-400/80 !text-white border border-cyan-300/50 hover:!bg-cyan-500 hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/40"
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
