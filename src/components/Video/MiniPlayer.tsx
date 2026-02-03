import { X, Play, Pause, SkipForward, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 right-2 z-50 md:hidden w-[160px]"
      >
        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Thumbnail / Video Preview */}
          <div
            className="relative aspect-video w-full cursor-pointer"
            onClick={onExpand}
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
            {/* Progress bar overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
              <div
                className="h-full bg-gradient-to-r from-primary to-cosmic-cyan transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Info + Controls */}
          <div className="p-2">
            {/* Title */}
            <p className="text-xs font-medium text-foreground truncate mb-1">
              {title}
            </p>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-primary/10"
                onClick={onPlayPause}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-primary/10"
                onClick={onNext}
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MiniPlayer;
