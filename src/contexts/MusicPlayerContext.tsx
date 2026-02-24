import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { requestPlayback, onPauseRequest } from "@/lib/mediaSessionManager";

export interface Track {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  video_url: string;
  duration?: number | null;
  channelName?: string;
}

type RepeatMode = 'off' | 'all' | 'one';

interface MusicPlayerContextType {
  // Current state
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentIndex: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  
  // Actions
  playTrack: (track: Track, playlist?: Track[]) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  closePlayer: () => void;
  
  // Audio ref for external control
  audioRef: React.RefObject<HTMLAudioElement>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return context;
};

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playedIndices, setPlayedIndices] = useState<Set<number>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sync audio element state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => handleTrackEnd();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, queue, repeatMode, shuffleEnabled]);

  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    // Mark current as played
    setPlayedIndices(prev => new Set(prev).add(currentIndex));

    if (shuffleEnabled) {
      // Find unplayed tracks
      const unplayedIndices = queue
        .map((_, i) => i)
        .filter(i => i !== currentIndex && !playedIndices.has(i));
      
      if (unplayedIndices.length > 0) {
        const randomIndex = unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)];
        setCurrentIndex(randomIndex);
        setCurrentTrack(queue[randomIndex]);
      } else if (repeatMode === 'all') {
        // Reset played indices and start again
        setPlayedIndices(new Set());
        const randomIndex = Math.floor(Math.random() * queue.length);
        setCurrentIndex(randomIndex);
        setCurrentTrack(queue[randomIndex]);
      } else {
        setIsPlaying(false);
      }
    } else {
      // Normal sequential playback
      if (currentIndex < queue.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setCurrentTrack(queue[nextIdx]);
      } else if (repeatMode === 'all') {
        setCurrentIndex(0);
        setCurrentTrack(queue[0]);
      } else {
        setIsPlaying(false);
      }
    }
  }, [currentIndex, queue, repeatMode, shuffleEnabled, playedIndices]);

  // Listen for pause requests from other media sources
  useEffect(() => {
    return onPauseRequest("music", () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    });
  }, []);

  // Auto-play when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.video_url;
      audioRef.current.volume = volume;
      requestPlayback("music");
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrack]);

  const playTrack = useCallback((track: Track, playlist?: Track[]) => {
    if (playlist && playlist.length > 0) {
      setQueue(playlist);
      const index = playlist.findIndex(t => t.id === track.id);
      setCurrentIndex(index >= 0 ? index : 0);
      setPlayedIndices(new Set());
    } else {
      setQueue([track]);
      setCurrentIndex(0);
    }
    setCurrentTrack(track);
  }, []);

  const playQueue = useCallback((tracks: Track[], startIndex = 0) => {
    setQueue(tracks);
    setCurrentIndex(startIndex);
    setCurrentTrack(tracks[startIndex]);
    setPlayedIndices(new Set());
  }, []);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        requestPlayback("music");
        audioRef.current.play().catch(console.error);
      }
    }
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    
    if (shuffleEnabled) {
      const unplayedIndices = queue
        .map((_, i) => i)
        .filter(i => i !== currentIndex && !playedIndices.has(i));
      
      if (unplayedIndices.length > 0) {
        setPlayedIndices(prev => new Set(prev).add(currentIndex));
        const randomIndex = unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)];
        setCurrentIndex(randomIndex);
        setCurrentTrack(queue[randomIndex]);
      } else if (repeatMode !== 'off') {
        setPlayedIndices(new Set());
        const randomIndex = Math.floor(Math.random() * queue.length);
        setCurrentIndex(randomIndex);
        setCurrentTrack(queue[randomIndex]);
      }
    } else {
      const nextIdx = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
      setCurrentIndex(nextIdx);
      setCurrentTrack(queue[nextIdx]);
    }
  }, [queue, currentIndex, shuffleEnabled, playedIndices, repeatMode]);

  const previousTrack = useCallback(() => {
    if (queue.length === 0) return;
    
    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }
    
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    setCurrentIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
  }, [queue, currentIndex, currentTime]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled(prev => !prev);
    setPlayedIndices(new Set());
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      
      // Adjust current index if needed
      if (index < currentIndex) {
        setCurrentIndex(curr => curr - 1);
      } else if (index === currentIndex && index >= newQueue.length) {
        setCurrentIndex(Math.max(0, newQueue.length - 1));
        if (newQueue.length > 0) {
          setCurrentTrack(newQueue[Math.max(0, newQueue.length - 1)]);
        }
      }
      
      return newQueue;
    });
  }, [currentIndex]);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      
      // Update current index if needed
      if (fromIndex === currentIndex) {
        setCurrentIndex(toIndex);
      } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
        setCurrentIndex(curr => curr - 1);
      } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
        setCurrentIndex(curr => curr + 1);
      }
      
      return newQueue;
    });
  }, [currentIndex]);

  const clearQueue = useCallback(() => {
    const current = currentTrack;
    if (current) {
      setQueue([current]);
      setCurrentIndex(0);
    } else {
      setQueue([]);
      setCurrentIndex(0);
    }
    setPlayedIndices(new Set());
  }, [currentTrack]);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack(null);
    setQueue([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setPlayedIndices(new Set());
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        queue,
        currentIndex,
        repeatMode,
        shuffleEnabled,
        volume,
        currentTime,
        duration,
        playTrack,
        playQueue,
        togglePlay,
        nextTrack,
        previousTrack,
        seekTo,
        setVolume,
        toggleRepeat,
        toggleShuffle,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        closePlayer,
        audioRef,
      }}
    >
      {children}
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />
    </MusicPlayerContext.Provider>
  );
};
