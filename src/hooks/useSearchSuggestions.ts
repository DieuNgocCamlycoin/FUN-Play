import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VideoSuggestion {
  id: string;
  title: string;
}

export interface ChannelSuggestion {
  id: string;
  name: string;
  avatar_url: string | null;
  subscriber_count: number | null;
}

interface UseSearchSuggestionsResult {
  videos: VideoSuggestion[];
  channels: ChannelSuggestion[];
  isOpen: boolean;
  query: string;
  setQuery: (q: string) => void;
  open: () => void;
  close: () => void;
  clear: () => void;
}

export function useSearchSuggestions(debounceMs = 300): UseSearchSuggestionsResult {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<VideoSuggestion[]>([]);
  const [channels, setChannels] = useState<ChannelSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const clear = useCallback(() => {
    setQuery("");
    setVideos([]);
    setChannels([]);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length < 2) {
      setVideos([]);
      setChannels([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const q = query.trim();
        const [videosRes, channelsRes] = await Promise.all([
          supabase
            .from("videos")
            .select("id, title")
            .eq("is_public", true)
            .eq("approval_status", "approved")
            .ilike("title", `%${q}%`)
            .order("view_count", { ascending: false })
            .limit(5),
          supabase
            .from("channels")
            .select("id, name, subscriber_count, user_id")
            .ilike("name", `%${q}%`)
            .order("subscriber_count", { ascending: false })
            .limit(3),
        ]);

        setVideos(videosRes.data || []);

        // Fetch avatars for channels
        const channelData = channelsRes.data || [];
        if (channelData.length > 0) {
          const userIds = channelData.map((c) => c.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, avatar_url")
            .in("id", userIds);
          const avatarMap = new Map(profiles?.map((p) => [p.id, p.avatar_url]) || []);
          setChannels(
            channelData.map((c) => ({
              id: c.id,
              name: c.name,
              subscriber_count: c.subscriber_count,
              avatar_url: avatarMap.get(c.user_id) || null,
            }))
          );
        } else {
          setChannels([]);
        }
      } catch {
        setVideos([]);
        setChannels([]);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  return { videos, channels, isOpen, query, setQuery, open, close, clear };
}
