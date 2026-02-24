import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Music, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useMusic } from "@/contexts/MusicContext";
import { requestPlayback, onPauseRequest } from "@/lib/mediaSessionManager";

interface BackgroundMusicPlayerProps {
  musicUrl: string | null;
  autoPlay?: boolean;
  onClose?: () => void;
}

export const BackgroundMusicPlayer = ({ musicUrl, autoPlay = true, onClose }: BackgroundMusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showControls, setShowControls] = useState(false);
  const { setPageMusicActive } = useMusic();

  // Signal that page-level music is active
  useEffect(() => {
    if (musicUrl) {
      setPageMusicActive(true);
    }
    return () => setPageMusicActive(false);
  }, [musicUrl, setPageMusicActive]);

  // Cleanup: dừng phát và xoá src khi component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Listen for pause requests from other media sources
  useEffect(() => {
    return onPauseRequest("background-music", () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    });
  }, []);

  useEffect(() => {
    if (musicUrl && audioRef.current) {
      audioRef.current.volume = volume / 100;
      if (autoPlay) {
        requestPlayback("background-music");
        audioRef.current.play().catch(console.error);
      }
    }
  }, [musicUrl, autoPlay]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      requestPlayback("background-music");
      audioRef.current.play().catch(console.error);
    }
  };

  if (!musicUrl) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-3">
          <Music className={`h-5 w-5 text-primary ${isPlaying ? "animate-pulse" : ""}`} />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground mb-1">Nhạc nền</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8"
              >
                {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              
              {showControls && (
                <div className="w-24">
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowControls(!showControls)}
                className="h-8 w-8"
              >
                <Music className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={musicUrl}
        loop
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};
