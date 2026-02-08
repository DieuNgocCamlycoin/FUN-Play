import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DescriptionDrawer } from "./DescriptionDrawer";
import { formatViewsShort, formatTimestamp } from "@/lib/formatters";

interface VideoInfoSectionProps {
  title: string;
  description: string | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  channelName: string;
  onSeekToChapter?: (seconds: number) => void;
}

export function VideoInfoSection({
  title,
  description,
  viewCount,
  likeCount,
  createdAt,
  channelName,
  onSeekToChapter,
}: VideoInfoSectionProps) {
  const [showDescriptionDrawer, setShowDescriptionDrawer] = useState(false);

  return (
    <>
      <div className="px-3 py-2">
        {/* Title - Max 2 lines with ellipsis */}
        <h1 className="text-base font-semibold text-foreground line-clamp-2 leading-tight">
          {title}
        </h1>

        {/* Info row - Views + Date + "...xem thêm" */}
        <button
          onClick={() => setShowDescriptionDrawer(true)}
          className="flex items-center gap-1 mt-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
        >
          <span>{formatViewsShort(viewCount)} lượt xem</span>
          <span>•</span>
          <span>{formatTimestamp(createdAt)}</span>
          <span className="ml-1 text-foreground font-medium">...xem thêm</span>
          <ChevronDown className="h-4 w-4 ml-auto" />
        </button>
      </div>

      <DescriptionDrawer
        isOpen={showDescriptionDrawer}
        onClose={() => setShowDescriptionDrawer(false)}
        title={title}
        description={description}
        viewCount={viewCount}
        likeCount={likeCount}
        createdAt={createdAt}
        channelName={channelName}
        onSeekToChapter={onSeekToChapter}
      />
    </>
  );
}
