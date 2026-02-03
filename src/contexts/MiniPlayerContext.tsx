import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface MiniPlayerVideo {
  id: string;
  videoUrl: string;
  title: string;
  channelName: string;
  thumbnailUrl: string | null;
  currentTime: number;
  duration: number;
}

interface MiniPlayerContextValue {
  miniPlayerVideo: MiniPlayerVideo | null;
  isPlaying: boolean;
  isVisible: boolean;
  showMiniPlayer: (video: MiniPlayerVideo) => void;
  hideMiniPlayer: () => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  updateProgress: (time: number, duration: number) => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextValue | undefined>(undefined);

export function MiniPlayerProvider({ children }: { children: React.ReactNode }) {
  const [miniPlayerVideo, setMiniPlayerVideo] = useState<MiniPlayerVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const showMiniPlayer = useCallback((video: MiniPlayerVideo) => {
    setMiniPlayerVideo(video);
    setIsPlaying(true);
    setIsVisible(true);
  }, []);

  const hideMiniPlayer = useCallback(() => {
    setMiniPlayerVideo(null);
    setIsPlaying(false);
    setIsVisible(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const updateProgress = useCallback((time: number, duration: number) => {
    setMiniPlayerVideo(prev => prev ? { ...prev, currentTime: time, duration } : null);
  }, []);

  return (
    <MiniPlayerContext.Provider
      value={{
        miniPlayerVideo,
        isPlaying,
        isVisible,
        showMiniPlayer,
        hideMiniPlayer,
        togglePlay,
        setIsPlaying,
        updateProgress,
      }}
    >
      {children}
    </MiniPlayerContext.Provider>
  );
}

export function useMiniPlayer() {
  const context = useContext(MiniPlayerContext);
  if (!context) {
    throw new Error("useMiniPlayer must be used within a MiniPlayerProvider");
  }
  return context;
}
