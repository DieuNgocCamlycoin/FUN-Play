import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DescriptionDrawer } from "./DescriptionDrawer";

interface VideoInfoSectionProps {
  title: string;
  description: string | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  channelName: string;
}

export function VideoInfoSection({
  title,
  description,
  viewCount,
  likeCount,
  createdAt,
  channelName,
}: VideoInfoSectionProps) {
  const [showDescriptionDrawer, setShowDescriptionDrawer] = useState(false);

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}N`;
    return views.toString();
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "1 ngày trước";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

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
          <span>{formatViews(viewCount)} lượt xem</span>
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
      />
    </>
  );
}
