import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Livestream = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
  category: string | null;
  started_at: string | null;
  ended_at: string | null;
  viewer_count: number;
  peak_viewers: number;
  total_donations: number;
  vod_video_id: string | null;
  last_heartbeat_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string;
  };
};

export function useLivestream(livestreamId?: string) {
  const [livestream, setLivestream] = useState<Livestream | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!livestreamId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("livestreams")
        .select("*")
        .eq("id", livestreamId)
        .single();

      if (data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, username")
          .eq("id", data.user_id)
          .single();

        setLivestream({ ...data, profile: profile as Livestream["profile"] });
      }
      setIsLoading(false);
    };

    load();

    // Realtime updates for viewer count etc
    const channel = supabase
      .channel(`livestream-${livestreamId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "livestreams",
          filter: `id=eq.${livestreamId}`,
        },
        (payload) => {
          setLivestream((prev) =>
            prev ? { ...prev, ...payload.new } : null
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [livestreamId]);

  return { livestream, isLoading };
}

export function useLiveDirectory() {
  const [livestreams, setLivestreams] = useState<Livestream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("livestreams")
        .select("*")
        .eq("status", "live")
        .order("viewer_count", { ascending: false });

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((l) => l.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, username")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        setLivestreams(
          data.map((l) => ({
            ...l,
            profile: profileMap.get(l.user_id) as Livestream["profile"],
          }))
        );
      }
      setIsLoading(false);
    };

    load();

    // Realtime for new/ended streams
    const channel = supabase
      .channel("live-directory")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "livestreams" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { livestreams, isLoading };
}

export function useCreateLivestream() {
  const { user } = useAuth();

  const createLivestream = useCallback(
    async (data: { title: string; description?: string; category?: string; thumbnail_url?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: result, error } = await supabase
        .from("livestreams")
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          category: data.category || "general",
          thumbnail_url: data.thumbnail_url || null,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    [user]
  );

  const goLive = useCallback(async (livestreamId: string) => {
    const { error } = await supabase
      .from("livestreams")
      .update({ status: "live", started_at: new Date().toISOString() })
      .eq("id", livestreamId);
    if (error) throw error;
  }, []);

  const endLive = useCallback(async (livestreamId: string) => {
    const { error } = await supabase
      .from("livestreams")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", livestreamId);
    if (error) throw error;
  }, []);

  const updateViewerCount = useCallback(async (livestreamId: string, count: number) => {
    await supabase.rpc("update_livestream_viewers", {
      p_livestream_id: livestreamId,
      p_count: count,
    });
  }, []);

  return { createLivestream, goLive, endLive, updateViewerCount };
}
