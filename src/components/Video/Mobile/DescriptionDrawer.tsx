import { X, ThumbsUp, Eye, Calendar } from "lucide-react";
import { formatViewsShort } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { parseChapters } from "@/lib/parseChapters";

interface DescriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  channelName: string;
  onSeekToChapter?: (seconds: number) => void;
}

export function DescriptionDrawer({
  isOpen,
  onClose,
  title,
  description,
  viewCount,
  likeCount,
  createdAt,
  channelName,
  onSeekToChapter,
}: DescriptionDrawerProps) {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Extract hashtags from description
  const extractHashtags = (text: string | null) => {
    if (!text) return [];
    const matches = text.match(/#\w+/g);
    return matches || [];
  };

  const hashtags = extractHashtags(description);
  const chapters = parseChapters(description);

  const formatChapterTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl max-h-[85vh] flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Nội dung mô tả</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-4 space-y-4">
                {/* Full Title */}
                <h3 className="text-base font-semibold text-foreground leading-tight">
                  {title}
                </h3>

                {/* Stats Row */}
                <div className="flex items-center gap-4 py-3 border-y border-border">
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-foreground font-semibold">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{formatViewsShort(likeCount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Lượt thích</p>
                  </div>
                  
                  <div className="w-px h-10 bg-border" />
                  
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-foreground font-semibold">
                      <Eye className="h-4 w-4" />
                      <span>{formatViewsShort(viewCount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Lượt xem</p>
                  </div>
                  
                  <div className="w-px h-10 bg-border" />
                  
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-foreground font-semibold">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Ngày đăng</p>
                  </div>
                </div>

                {/* Chapter Pills */}
                {chapters.length > 0 && (
                  <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 py-1">
                      {chapters.map((chapter, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            onSeekToChapter?.(chapter.time);
                            onClose();
                          }}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors active:scale-95"
                        >
                          <span className="text-primary font-medium">{formatChapterTime(chapter.time)}</span>
                          <span className="text-foreground whitespace-nowrap">{chapter.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Channel */}
                <p className="text-sm text-muted-foreground">
                  Kênh: <span className="text-foreground font-medium">{channelName}</span>
                </p>

                {/* Hashtags */}
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-sm text-primary hover:text-primary/80 cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <div className="pt-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {description || "Không có mô tả"}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
