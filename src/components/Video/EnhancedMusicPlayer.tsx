import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  X, Repeat, Repeat1, Shuffle, ListMusic, Sparkles,
  ChevronUp, ChevronDown, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { QueuePanel } from "./QueuePanel";
import { ShareModal } from "./ShareModal";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/useAuth";

export const EnhancedMusicPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    repeatMode,
    shuffleEnabled,
    volume,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    closePlayer,
    queue,
  } = useMusicPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { user } = useAuth();

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRepeat = () => {
    toggleRepeat();
    // Celebration effect when turning on
    if (repeatMode === 'off') {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.9, x: 0.5 },
        colors: ['#00E7FF', '#FFD700'],
      });
    }
  };

  const handleToggleShuffle = () => {
    toggleShuffle();
    // Celebration effect when turning on
    if (!shuffleEnabled) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.9, x: 0.5 },
        colors: ['#FFD700', '#00E7FF'],
      });
    }
  };

  const handleNext = () => {
    // Light wave effect
    const wave = document.createElement('div');
    wave.className = 'fixed inset-0 pointer-events-none z-[100]';
    wave.innerHTML = `
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-[wave_0.5s_ease-out]"></div>
    `;
    document.body.appendChild(wave);
    setTimeout(() => wave.remove(), 500);
    nextTrack();
  };

  const handlePrevious = () => {
    // Light wave effect (reverse)
    const wave = document.createElement('div');
    wave.className = 'fixed inset-0 pointer-events-none z-[100]';
    wave.innerHTML = `
      <div class="absolute inset-0 bg-gradient-to-l from-transparent via-amber-500/20 to-transparent animate-[wave_0.5s_ease-out]"></div>
    `;
    document.body.appendChild(wave);
    setTimeout(() => wave.remove(), 500);
    previousTrack();
  };

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 z-50 w-[400px] max-w-[calc(100vw-2rem)]"
        >
          <Card className="overflow-hidden border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950" />
            
            {/* Sparkle effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + (i % 3) * 20}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                  }}
                >
                  <Sparkles className="w-3 h-3 text-amber-400/40" />
                </motion.div>
              ))}
            </div>

            <div className="relative p-4">
              {/* Header with track info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <motion.div 
                    className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-cyan-500/30"
                    animate={isPlaying ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {currentTrack.thumbnail_url ? (
                      <img 
                        src={currentTrack.thumbnail_url} 
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-amber-500 flex items-center justify-center">
                        <ListMusic className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cyan-400 mb-0.5">Đang phát</p>
                    <h4 className="text-sm font-semibold text-white truncate">
                      {currentTrack.title}
                    </h4>
                    {currentTrack.channelName && (
                      <p className="text-xs text-white/50 truncate">{currentTrack.channelName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closePlayer}
                    className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <Slider
                  value={[currentTime]}
                  onValueChange={(v) => seekTo(v[0])}
                  max={duration || 100}
                  step={1}
                  className="cursor-pointer [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-400 [&_[role=slider]]:to-amber-400 [&_.relative]:bg-white/20"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-between">
                {/* Left: Shuffle & Repeat */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleShuffle}
                    className={cn(
                      "h-9 w-9 transition-all duration-300 hover:scale-110",
                      shuffleEnabled 
                        ? "text-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/20" 
                        : "text-white/50 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleRepeat}
                    className={cn(
                      "h-9 w-9 transition-all duration-300 hover:scale-110",
                      repeatMode !== 'off' 
                        ? "text-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/20" 
                        : "text-white/50 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <RepeatIcon className="w-4 h-4" />
                  </Button>
                </div>

                {/* Center: Playback */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    className="h-10 w-10 text-white hover:text-cyan-400 hover:bg-white/10 transition-all hover:scale-110"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </Button>
                  
                  <Button
                    size="icon"
                    onClick={togglePlay}
                    className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="h-10 w-10 text-white hover:text-amber-400 hover:bg-white/10 transition-all hover:scale-110"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </Button>
                </div>

                {/* Right: Share, Volume & Queue */}
                <div className="flex items-center gap-1">
                  {/* Share Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowShareModal(true)}
                    className="h-9 w-9 text-white/50 hover:text-cosmic-cyan hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      className="h-9 w-9 text-white/50 hover:text-white hover:bg-white/10"
                    >
                      {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    
                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-800 rounded-lg shadow-xl"
                          onMouseLeave={() => setShowVolumeSlider(false)}
                        >
                          <Slider
                            value={[volume * 100]}
                            onValueChange={(v) => setVolume(v[0] / 100)}
                            max={100}
                            step={1}
                            orientation="vertical"
                            className="h-24"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowQueue(true)}
                    className="h-9 w-9 text-white/50 hover:text-white hover:bg-white/10 relative"
                  >
                    <ListMusic className="w-4 h-4" />
                    {queue.length > 1 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-cyan-500 to-amber-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                        {queue.length}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded view with more info */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-white/10"
                  >
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>
                        {repeatMode === 'off' && 'Không lặp'}
                        {repeatMode === 'all' && '🔁 Lặp tất cả'}
                        {repeatMode === 'one' && '🔂 Lặp một bài'}
                      </span>
                      <span>
                        {shuffleEnabled && '🔀 Ngẫu nhiên'}
                      </span>
                    </div>
                    {queue.length > 1 && (
                      <p className="text-xs text-white/40 mt-2">
                        {queue.length - 1} bài tiếp theo trong hàng đợi
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Queue Panel */}
      <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        contentId={currentTrack.id}
        contentTitle={currentTrack.title}
        contentType="music"
        thumbnailUrl={currentTrack.thumbnail_url}
        channelName={currentTrack.channelName}
        userId={user?.id}
      />

      {/* Wave animation styles */}
      <style>{`
        @keyframes wave {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
};
