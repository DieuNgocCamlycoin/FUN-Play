import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchBannedUserIds } from "@/hooks/useBannedUserIds";

// Context types for playback
export type PlaybackContextType = 
  | "PLAYLIST" 
  | "CHANNEL" 
  | "SEARCH_RESULTS" 
  | "HOME_FEED" 
  | "RELATED"
  | "MEDITATION";

export interface VideoItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  duration: number | null;
  view_count: number | null;
  channel_name?: string;
  channel_id?: string;
  category?: string | null;
}

export interface PlaybackSession {
  session_id: string;
  user_id: string | null;
  start_video_id: string;
  context_type: PlaybackContextType;
  context_id: string | null;
  queue: VideoItem[];
  history: string[];
  current_index: number;
  position_ms: number;
  autoplay: boolean;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  created_at: string;
}

interface VideoPlaybackContextType {
  session: PlaybackSession | null;
  currentVideo: VideoItem | null;
  isAutoplayEnabled: boolean;
  createSession: (
    videoId: string, 
    contextType: PlaybackContextType, 
    contextId?: string | null,
    initialQueue?: VideoItem[]
  ) => Promise<void>;
  resumeSession: () => void;
  clearSession: () => void;
  nextVideo: () => VideoItem | null;
  previousVideo: () => VideoItem | null;
  skipToVideo: (videoId: string) => void;
  addToQueue: (video: VideoItem) => void;
  removeFromQueue: (videoId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  setAutoplay: (enabled: boolean) => void;
  setShuffle: (enabled: boolean) => void;
  setRepeat: (mode: "off" | "all" | "one") => void;
  updateProgress: (positionMs: number) => void;
  getUpNext: (count?: number) => VideoItem[];
  canPlayVideo: (videoId: string) => boolean;
}

const VideoPlaybackContext = createContext<VideoPlaybackContextType | undefined>(undefined);

const HISTORY_LIMIT = 20;
const SESSION_STORAGE_KEY = "funplay_playback_session";
const SESSION_SEEN_KEY = "funplay_seen_video_ids";
const MAX_PER_CHANNEL = 2;
const MIN_UNIQUE_CHANNELS = 8;
const MAX_SEEN_IDS = 100;

// Session seen IDs management
const getSessionSeenIds = (): Set<string> => {
  try {
    const stored = sessionStorage.getItem(SESSION_SEEN_KEY);
    if (stored) {
      const arr = JSON.parse(stored) as string[];
      return new Set(arr.slice(-MAX_SEEN_IDS));
    }
  } catch {}
  return new Set();
};

const addSessionSeenIds = (ids: string[]) => {
  const existing = getSessionSeenIds();
  ids.forEach(id => existing.add(id));
  const arr = Array.from(existing).slice(-MAX_SEEN_IDS);
  sessionStorage.setItem(SESSION_SEEN_KEY, JSON.stringify(arr));
};

// Shuffle array in place (Fisher-Yates)
const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export function VideoPlaybackProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlaybackSession | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const exhaustedPoolRef = useRef<Set<string>>(new Set());

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        if (parsed.queue[parsed.current_index]) {
          setCurrentVideo(parsed.queue[parsed.current_index]);
        }
      } catch (e) {
        console.error("Failed to restore playback session:", e);
      }
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Map raw video data to VideoItem
  const mapVideoItem = (v: any): VideoItem => ({
    id: v.id,
    title: v.title,
    thumbnail_url: v.thumbnail_url,
    video_url: v.video_url,
    duration: v.duration,
    view_count: v.view_count,
    channel_name: (v.channels as any)?.name,
    channel_id: (v.channels as any)?.id,
    category: v.category,
  });

  // Base filters for approved, visible videos
  const applyBaseFilters = (query: any) => {
    return query
      .eq("is_public", true)
      .eq("approval_status", "approved")
      .or("is_hidden.is.null,is_hidden.eq.false");
  };

  // ============================================================
  // DIVERSITY-FIRST RECOMMENDATION ENGINE
  // ============================================================
  const fetchDiverseRecommendations = async (
    currentVideoId: string,
    category: string | null,
    channelId: string | null,
    limit: number = 20
  ): Promise<VideoItem[]> => {
    const seenIds = getSessionSeenIds();
    const excludeIds = new Set([currentVideoId, ...seenIds]);
    const bannedIds = await fetchBannedUserIds();

    // Step 1: Fetch 200 candidate videos
    const q = supabase
      .from("videos")
      .select(`
        id, title, thumbnail_url, video_url, duration, view_count, category, user_id,
        channels!inner (id, name, is_verified)
      `)
      .not("id", "in", `(${[...excludeIds].join(",")})`)
      .order("view_count", { ascending: false })
      .limit(200);

    const { data: allVideos } = await applyBaseFilters(q);
    
    if (!allVideos || allVideos.length === 0) {
      // Fallback: if all videos seen, clear seen list and retry without exclusion
      console.warn("[Recommendations] All videos seen, clearing session seen list");
      sessionStorage.removeItem(SESSION_SEEN_KEY);
      
      const fallbackQ = supabase
        .from("videos")
        .select(`
          id, title, thumbnail_url, video_url, duration, view_count, category, user_id,
          channels!inner (id, name, is_verified)
        `)
        .neq("id", currentVideoId)
        .order("view_count", { ascending: false })
        .limit(200);
      
      const { data: fallbackVideos } = await applyBaseFilters(fallbackQ);
      if (!fallbackVideos || fallbackVideos.length === 0) return [];
      const filtered = fallbackVideos.filter((v: any) => !bannedIds.has(v.user_id));
      return buildDiverseList(filtered.map(mapVideoItem), category, limit);
    }

    const filtered = allVideos.filter((v: any) => !bannedIds.has(v.user_id));
    return buildDiverseList(filtered.map(mapVideoItem), category, limit);
  };

  const buildDiverseList = (candidates: VideoItem[], category: string | null, limit: number): VideoItem[] => {
    // Step 2: Group by channel
    const channelGroups = new Map<string, VideoItem[]>();
    for (const video of candidates) {
      const chId = video.channel_id || 'unknown';
      if (!channelGroups.has(chId)) channelGroups.set(chId, []);
      channelGroups.get(chId)!.push(video);
    }

    // Step 3: Prioritize same-category channels, then shuffle order
    const sameCategoryChannels = new Set<string>();
    const otherChannels = new Set<string>();
    
    for (const [chId, videos] of channelGroups) {
      if (category && videos.some(v => v.category === category)) {
        sameCategoryChannels.add(chId);
      } else {
        otherChannels.add(chId);
      }
    }

    // Shuffle within each priority group to avoid deterministic ordering
    const orderedChannels = [
      ...shuffleArray(Array.from(sameCategoryChannels)),
      ...shuffleArray(Array.from(otherChannels)),
    ];

    // Step 4: Strict round-robin selection
    // Round 1: exactly 1 video per channel
    const result: VideoItem[] = [];
    const channelPickCount = new Map<string, number>();

    for (const chId of orderedChannels) {
      if (result.length >= limit) break;
      const videos = channelGroups.get(chId)!;
      if (videos.length > 0) {
        result.push(videos[0]); // Best video (highest views) from each channel
        channelPickCount.set(chId, 1);
      }
    }

    // Round 2: allow 2nd video per channel (if needed to reach limit)
    if (result.length < limit) {
      for (const chId of orderedChannels) {
        if (result.length >= limit) break;
        const count = channelPickCount.get(chId) || 0;
        if (count >= MAX_PER_CHANNEL) continue;
        const videos = channelGroups.get(chId)!;
        if (videos.length > 1) {
          result.push(videos[1]);
          channelPickCount.set(chId, count + 1);
        }
      }
    }

    // Step 5: Apply consecutive channel rule (no 2+ in a row from same channel)
    const finalList = applyConsecutiveRule(result);

    // Step 6: Debug logging
    const uniqueChannels = new Set(finalList.map(v => v.channel_id));
    const perChannelCounts: Record<string, number> = {};
    finalList.forEach(v => {
      const ch = v.channel_name || v.channel_id || 'unknown';
      perChannelCounts[ch] = (perChannelCounts[ch] || 0) + 1;
    });

    console.log(`[Recommendations] ✅ ${finalList.length} videos from ${uniqueChannels.size} unique channels`);
    console.log(`[Recommendations] Per-channel:`, perChannelCounts);
    if (uniqueChannels.size < MIN_UNIQUE_CHANNELS) {
      console.warn(`[Recommendations] ⚠️ Only ${uniqueChannels.size} unique channels (target: ${MIN_UNIQUE_CHANNELS}+)`);
    }

    // Save to session seen list
    addSessionSeenIds(finalList.map(v => v.id));

    return finalList;
  };

  // Ensure no more than 1 consecutive video from same channel
  const applyConsecutiveRule = (videos: VideoItem[]): VideoItem[] => {
    if (videos.length <= 1) return videos;
    
    const result: VideoItem[] = [videos[0]];
    const remaining = videos.slice(1);
    
    while (remaining.length > 0) {
      const lastChannel = result[result.length - 1].channel_id;
      
      // Find first video from a different channel
      const diffIdx = remaining.findIndex(v => v.channel_id !== lastChannel);
      
      if (diffIdx !== -1) {
        result.push(remaining[diffIdx]);
        remaining.splice(diffIdx, 1);
      } else {
        // All remaining are same channel, just append
        result.push(remaining.shift()!);
      }
    }
    
    return result;
  };

  // Fetch playlist videos
  const fetchPlaylistVideos = async (playlistId: string): Promise<VideoItem[]> => {
    const { data } = await supabase
      .from("playlist_videos")
      .select(`
        position,
        videos (
          id, title, thumbnail_url, video_url, duration, view_count, category,
          channels (id, name)
        )
      `)
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    if (!data) return [];

    return data
      .filter(item => item.videos)
      .map(item => {
        const v = item.videos as any;
        return {
          id: v.id,
          title: v.title,
          thumbnail_url: v.thumbnail_url,
          video_url: v.video_url,
          duration: v.duration,
          view_count: v.view_count,
          channel_name: v.channels?.name,
          channel_id: v.channels?.id,
          category: v.category,
        };
      });
  };

  // Fetch channel videos
  const fetchChannelVideos = async (channelId: string, currentVideoId: string): Promise<VideoItem[]> => {
    const { data } = await supabase
      .from("videos")
      .select(`
        id, title, thumbnail_url, video_url, duration, view_count, category,
        channels (id, name)
      `)
      .eq("is_public", true)
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) return [];

    return data.map(v => ({
      id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      video_url: v.video_url,
      duration: v.duration,
      view_count: v.view_count,
      channel_name: (v.channels as any)?.name,
      channel_id: (v.channels as any)?.id,
      category: v.category,
    }));
  };

  // Create a new playback session
  const createSession = useCallback(async (
    videoId: string,
    contextType: PlaybackContextType,
    contextId?: string | null,
    initialQueue?: VideoItem[]
  ) => {
    let queue: VideoItem[] = initialQueue || [];
    
    // Fetch current video info if not in queue
    let startVideo: VideoItem | null = queue.find(v => v.id === videoId) || null;
    
    if (!startVideo) {
      const { data } = await supabase
        .from("videos")
        .select(`
          id, title, thumbnail_url, video_url, duration, view_count, category,
          channels (id, name)
        `)
        .eq("id", videoId)
        .single();
      
      if (data) {
        startVideo = {
          id: data.id,
          title: data.title,
          thumbnail_url: data.thumbnail_url,
          video_url: data.video_url,
          duration: data.duration,
          view_count: data.view_count,
          channel_name: (data.channels as any)?.name,
          channel_id: (data.channels as any)?.id,
          category: data.category,
        };
      }
    }

    if (!startVideo) return;

    // Build queue based on context
    if (queue.length === 0 || contextType !== "PLAYLIST") {
      switch (contextType) {
        case "PLAYLIST":
          if (contextId) {
            queue = await fetchPlaylistVideos(contextId);
          }
          break;
        case "CHANNEL":
          if (contextId) {
            queue = await fetchChannelVideos(contextId, videoId);
          }
          break;
        case "HOME_FEED":
        case "RELATED":
        case "SEARCH_RESULTS":
        default:
          // Use diversity-first algorithm
          queue = [startVideo];
          const related = await fetchDiverseRecommendations(
            videoId,
            startVideo.category || null,
            startVideo.channel_id || null,
            20
          );
          queue.push(...related);
          break;
      }
    }

    // Ensure current video is in queue
    const currentIndex = queue.findIndex(v => v.id === videoId);
    if (currentIndex === -1) {
      queue.unshift(startVideo);
    }

    const newSession: PlaybackSession = {
      session_id: generateSessionId(),
      user_id: null,
      start_video_id: videoId,
      context_type: contextType,
      context_id: contextId || null,
      queue,
      history: [videoId],
      current_index: currentIndex === -1 ? 0 : currentIndex,
      position_ms: 0,
      autoplay: true,
      shuffle: false,
      repeat: "off",
      created_at: new Date().toISOString(),
    };

    setSession(newSession);
    setCurrentVideo(startVideo);
    exhaustedPoolRef.current.clear();
  }, []);

  // Check if a video can be played (anti-repeat)
  const canPlayVideo = useCallback((videoId: string): boolean => {
    if (!session) return true;
    if (session.history.length > 0 && session.history[session.history.length - 1] === videoId) {
      return false;
    }
    const recentHistory = session.history.slice(-HISTORY_LIMIT);
    if (recentHistory.includes(videoId)) {
      const eligibleVideos = session.queue.filter(v => !recentHistory.includes(v.id));
      if (eligibleVideos.length > 0) return false;
      if (exhaustedPoolRef.current.has(videoId)) return false;
    }
    return true;
  }, [session]);

  // Get next video
  const nextVideo = useCallback((): VideoItem | null => {
    if (!session || session.queue.length === 0) return null;

    if (session.repeat === "one") return currentVideo;

    let nextIdx: number;
    let nextVid: VideoItem | null = null;

    if (session.shuffle) {
      const recentHistory = session.history.slice(-HISTORY_LIMIT);
      let candidates = session.queue.filter(v => 
        v.id !== currentVideo?.id && !recentHistory.includes(v.id)
      );
      if (candidates.length === 0) {
        if (session.repeat === "all") {
          candidates = session.queue.filter(v => v.id !== currentVideo?.id);
          exhaustedPoolRef.current.clear();
        } else {
          return null;
        }
      }
      if (candidates.length > 0) {
        nextVid = candidates[Math.floor(Math.random() * candidates.length)];
        nextIdx = session.queue.findIndex(v => v.id === nextVid!.id);
      } else {
        return null;
      }
    } else {
      nextIdx = session.current_index + 1;
      if (nextIdx >= session.queue.length) {
        if (session.repeat === "all") {
          nextIdx = 0;
        } else {
          return null;
        }
      }
      nextVid = session.queue[nextIdx];
      if (!canPlayVideo(nextVid.id)) {
        for (let i = 1; i <= session.queue.length; i++) {
          const checkIdx = (session.current_index + i) % session.queue.length;
          if (canPlayVideo(session.queue[checkIdx].id)) {
            nextIdx = checkIdx;
            nextVid = session.queue[checkIdx];
            break;
          }
        }
      }
    }

    if (nextVid) {
      setSession(prev => {
        if (!prev) return null;
        const newHistory = [...prev.history, nextVid!.id].slice(-50);
        return { ...prev, current_index: nextIdx, history: newHistory, position_ms: 0 };
      });
      setCurrentVideo(nextVid);
    }

    return nextVid;
  }, [session, currentVideo, canPlayVideo]);

  // Get previous video
  const previousVideo = useCallback((): VideoItem | null => {
    if (!session || session.history.length < 2) return null;
    const prevVideoId = session.history[session.history.length - 2];
    const prevVid = session.queue.find(v => v.id === prevVideoId);
    if (prevVid) {
      const prevIdx = session.queue.findIndex(v => v.id === prevVideoId);
      setSession(prev => {
        if (!prev) return null;
        return { ...prev, current_index: prevIdx, history: prev.history.slice(0, -1), position_ms: 0 };
      });
      setCurrentVideo(prevVid);
    }
    return prevVid || null;
  }, [session]);

  // Skip to specific video
  const skipToVideo = useCallback((videoId: string) => {
    if (!session) return;
    const idx = session.queue.findIndex(v => v.id === videoId);
    if (idx === -1) return;
    const video = session.queue[idx];
    setSession(prev => {
      if (!prev) return null;
      return { ...prev, current_index: idx, history: [...prev.history, videoId].slice(-50), position_ms: 0 };
    });
    setCurrentVideo(video);
  }, [session]);

  // Queue management
  const addToQueue = useCallback((video: VideoItem) => {
    setSession(prev => prev ? { ...prev, queue: [...prev.queue, video] } : null);
  }, []);

  const removeFromQueue = useCallback((videoId: string) => {
    setSession(prev => {
      if (!prev) return null;
      const newQueue = prev.queue.filter(v => v.id !== videoId);
      let newIndex = prev.current_index;
      const removedIdx = prev.queue.findIndex(v => v.id === videoId);
      if (removedIdx < prev.current_index) newIndex = Math.max(0, newIndex - 1);
      return { ...prev, queue: newQueue, current_index: newIndex };
    });
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setSession(prev => {
      if (!prev) return null;
      const newQueue = [...prev.queue];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      let newIndex = prev.current_index;
      if (fromIndex === prev.current_index) newIndex = toIndex;
      else if (fromIndex < prev.current_index && toIndex >= prev.current_index) newIndex--;
      else if (fromIndex > prev.current_index && toIndex <= prev.current_index) newIndex++;
      return { ...prev, queue: newQueue, current_index: newIndex };
    });
  }, []);

  // Settings
  const setAutoplay = useCallback((enabled: boolean) => {
    setSession(prev => prev ? { ...prev, autoplay: enabled } : null);
  }, []);

  const setShuffle = useCallback((enabled: boolean) => {
    setSession(prev => prev ? { ...prev, shuffle: enabled } : null);
    if (enabled) exhaustedPoolRef.current.clear();
  }, []);

  const setRepeat = useCallback((mode: "off" | "all" | "one") => {
    setSession(prev => prev ? { ...prev, repeat: mode } : null);
  }, []);

  const updateProgress = useCallback((positionMs: number) => {
    setSession(prev => prev ? { ...prev, position_ms: positionMs } : null);
  }, []);

  const resumeSession = useCallback(() => {
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      setSession(parsed);
      if (parsed.queue[parsed.current_index]) {
        setCurrentVideo(parsed.queue[parsed.current_index]);
      }
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setCurrentVideo(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    exhaustedPoolRef.current.clear();
  }, []);

  const getUpNext = useCallback((count: number = 5): VideoItem[] => {
    if (!session) return [];
    const upNextVideos: VideoItem[] = [];
    let idx = session.current_index + 1;
    while (upNextVideos.length < count && idx < session.queue.length) {
      upNextVideos.push(session.queue[idx]);
      idx++;
    }
    if (session.repeat === "all" && upNextVideos.length < count) {
      idx = 0;
      while (upNextVideos.length < count && idx < session.current_index) {
        upNextVideos.push(session.queue[idx]);
        idx++;
      }
    }
    return upNextVideos;
  }, [session]);

  return (
    <VideoPlaybackContext.Provider
      value={{
        session, currentVideo,
        isAutoplayEnabled: session?.autoplay ?? true,
        createSession, resumeSession, clearSession,
        nextVideo, previousVideo, skipToVideo,
        addToQueue, removeFromQueue, reorderQueue,
        setAutoplay, setShuffle, setRepeat,
        updateProgress, getUpNext, canPlayVideo,
      }}
    >
      {children}
    </VideoPlaybackContext.Provider>
  );
}

export function useVideoPlayback() {
  const context = useContext(VideoPlaybackContext);
  if (context === undefined) {
    throw new Error("useVideoPlayback must be used within a VideoPlaybackProvider");
  }
  return context;
}
