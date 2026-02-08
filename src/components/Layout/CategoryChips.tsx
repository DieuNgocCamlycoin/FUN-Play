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
              variant="ghost"
              size="sm"
              className={`rounded-full px-4 h-8 text-sm font-medium transition-all ${
                selected === category
                  ? "bg-[linear-gradient(90deg,#5EEAD4_0%,#22D3EE_35%,#06B6D4_50%,#0EA5E9_75%,#0284C7_100%)] text-white font-semibold border-[1.5px] border-transparent !shadow-none hover:brightness-110 hover:!shadow-none"
                  : "bg-white/90 text-[#0066FF] border-[1.5px] border-[#0066FF]/40 !shadow-none hover:bg-white hover:text-[#0052CC] hover:border-[#0066FF]/60 hover:!shadow-none"
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
