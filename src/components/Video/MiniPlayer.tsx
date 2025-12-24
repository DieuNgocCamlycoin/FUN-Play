import { useState, useEffect } from "react";
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
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 left-2 right-2 z-50 md:hidden"
      >
        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-primary to-cosmic-cyan transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center p-2 gap-3">
            {/* Thumbnail / Video Preview */}
            <div
              className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
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
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white opacity-70" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0" onClick={onExpand}>
              <p className="text-sm font-medium text-foreground truncate">
                {title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {channelName}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-foreground hover:bg-primary/10"
                onClick={onPlayPause}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-foreground hover:bg-primary/10"
                onClick={onNext}
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MiniPlayer;
