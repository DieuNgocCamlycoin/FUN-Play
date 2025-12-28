import { useState } from "react";
import { X, Play, Pause, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface MiniPlayerProps {
  videoUrl: string;
  title: string;
  channelName: string;
  thumbnailUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onClose: () => void;
  onExpand: () => void;
  onPlayPause: () => void;
  onNext: () => void;
}

const MiniPlayer = ({
  videoUrl,
  title,
  channelName,
  thumbnailUrl,
  isPlaying,
  currentTime,
  duration,
  onClose,
  onExpand,
  onPlayPause,
  onNext,
}: MiniPlayerProps) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    // Swipe down to close
    if (info.offset.y > 80) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag
        dragConstraints={{ left: -100, right: 0, top: -200, bottom: 80 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        className="fixed bottom-20 right-2 z-50 md:hidden touch-none"
        style={{ width: "160px" }}
      >
        <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Video Thumbnail - 16:9 ratio */}
          <div
            className="relative w-full cursor-pointer"
            style={{ aspectRatio: "16/9" }}
            onClick={!isDragging ? onExpand : undefined}
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                muted
              />
            )}
            
            {/* Progress bar overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Play/Pause overlay */}
            {!isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPause();
                  }}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Info & Controls */}
          <div className="p-2 bg-card">
            <div className="flex items-start gap-2">
              {/* Title & Channel */}
              <div className="flex-1 min-w-0" onClick={!isDragging ? onExpand : undefined}>
                <p className="text-xs font-medium text-foreground truncate leading-tight">
                  {title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {channelName}
                </p>
              </div>

              {/* Control buttons */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-foreground hover:bg-muted rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPause();
                  }}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-foreground hover:bg-muted rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MiniPlayer;
