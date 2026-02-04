import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface VideoConfirmationProps {
  videoFile: File;
  videoPreviewUrl: string;
  duration: number;
  isShort: boolean;
  onNext: () => void;
  onConvertToShort: () => void;
}

export function VideoConfirmation({
  videoFile,
  videoPreviewUrl,
  duration,
  isShort,
  onNext,
  onConvertToShort,
}: VideoConfirmationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const { lightTap, mediumTap } = useHapticFeedback();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    lightTap();
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const canConvertToShort = !isShort && duration <= 180;

  return (
    <div className="flex flex-col h-full">
      {/* Video Player Section */}
      <div className="relative flex-1 bg-black flex items-center justify-center touch-manipulation">
        <video
          ref={videoRef}
          src={videoPreviewUrl}
          className="max-w-full max-h-full object-contain"
          playsInline
          preload="metadata"
          onClick={togglePlay}
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center touch-manipulation"
          >
            <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>
          </motion.button>
        )}

        {/* Short Badge */}
        {isShort && (
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-purple)/1)] text-white text-sm font-bold flex items-center gap-1 shadow-lg"
          >
            <Zap className="w-4 h-4" />
            SHORT
          </motion.div>
        )}
      </div>

      {/* Controls Section */}
      <div className="bg-background p-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[hsl(var(--cosmic-cyan))]"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* File Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[hsl(var(--cosmic-cyan)/0.3)] to-[hsl(var(--cosmic-magenta)/0.3)] flex items-center justify-center">
            <Play className="w-6 h-6 text-[hsl(var(--cosmic-cyan))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{videoFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • {formatTime(duration)}
            </p>
          </div>
        </div>

        {/* Convert to Shorts Button */}
        {canConvertToShort && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              mediumTap();
              onConvertToShort();
            }}
            className="w-full py-3 px-4 rounded-xl border border-[hsl(var(--cosmic-magenta)/0.3)] text-[hsl(var(--cosmic-magenta))] font-medium flex items-center justify-center gap-2 active:bg-[hsl(var(--cosmic-magenta)/0.1)] transition-colors min-h-[48px] touch-manipulation"
          >
            <Zap className="w-5 h-5" />
            Chỉnh sửa thành video Shorts
          </motion.button>
        )}

        {/* Next Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            mediumTap();
            onNext();
          }}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 min-h-[56px] relative overflow-hidden touch-manipulation",
            "bg-gradient-to-r from-[hsl(var(--cosmic-magenta))] via-[hsl(var(--cosmic-purple)/1)] to-[hsl(var(--cosmic-magenta))]",
            "shadow-lg shadow-[hsl(var(--cosmic-magenta)/0.3)] active:opacity-90 transition-opacity"
          )}
        >
          {/* Pulse glow effect */}
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          <span className="relative z-10 flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5" />
            Tiếp
          </span>
        </motion.button>
      </div>
    </div>
  );
}
