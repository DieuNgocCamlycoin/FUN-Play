import { useState, useCallback, useEffect } from "react";

interface MiniPlayerState {
  isVisible: boolean;
  videoUrl: string;
  title: string;
  channelName: string;
  thumbnailUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  videoId?: string;
}

const initialState: MiniPlayerState = {
  isVisible: false,
  videoUrl: "",
  title: "",
  channelName: "",
  thumbnailUrl: undefined,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  videoId: undefined,
};

export const useMiniPlayer = () => {
  const [miniPlayer, setMiniPlayer] = useState<MiniPlayerState>(initialState);

  const showMiniPlayer = useCallback(
    (data: Omit<MiniPlayerState, "isVisible">) => {
      setMiniPlayer({
        ...data,
        isVisible: true,
      });
    },
    []
  );

  const hideMiniPlayer = useCallback(() => {
    setMiniPlayer(initialState);
  }, []);

  const updateMiniPlayer = useCallback(
    (updates: Partial<MiniPlayerState>) => {
      setMiniPlayer((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    []
  );

  const togglePlayPause = useCallback(() => {
    setMiniPlayer((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, []);

  return {
    miniPlayer,
    showMiniPlayer,
    hideMiniPlayer,
    updateMiniPlayer,
    togglePlayPause,
  };
};
