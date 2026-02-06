import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { VideoCommentList } from "@/components/Video/Comments/VideoCommentList";
import { useVideoComments } from "@/hooks/useVideoComments";

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  commentCount?: number;
  onCommentCountChange?: (count: number) => void;
  onSeek?: (seconds: number) => void;
}

export function CommentsDrawer({
  isOpen,
  onClose,
  videoId,
  onCommentCountChange,
  onSeek,
}: CommentsDrawerProps) {
  const { totalCount } = useVideoComments(videoId);

  // Update parent when count changes
  if (onCommentCountChange && totalCount > 0) {
    onCommentCountChange(totalCount);
  }

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl h-[80vh] flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Bình luận <span className="text-muted-foreground font-normal">{totalCount}</span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Comments List with new component */}
            <ScrollArea className="flex-1 px-4">
              <div className="py-4">
                <VideoCommentList videoId={videoId} onSeek={onSeek} />
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
