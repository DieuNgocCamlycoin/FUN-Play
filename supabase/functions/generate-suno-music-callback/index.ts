import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SunoCallbackSong = {
  audio_url?: string;
  image_url?: string;
  duration?: number;
  title?: string;
};

type SunoCallbackBody = {
  code?: number;
  msg?: string;
  data?: {
    callbackType?: string;
    task_id?: string;
    taskId?: string;
    data?: SunoCallbackSong[];
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Received Suno callback");

    const body = (await req.json()) as SunoCallbackBody;
    console.log("Callback body:", JSON.stringify(body, null, 2));

    const callbackType = body.data?.callbackType;
    if (callbackType !== "complete") {
      console.log("Ignoring non-complete callback:", callbackType);
      return new Response(
        JSON.stringify({ success: true, message: "Callback received (ignored)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    let musicId = url.searchParams.get("musicId");

    const songs = body.data?.data ?? [];
    const firstSongWithAudio = songs.find((s) => !!s.audio_url) ?? songs[0];

    const audioUrl = firstSongWithAudio?.audio_url ?? null;
    const thumbnailUrl = firstSongWithAudio?.image_url ?? null;
    const duration = typeof firstSongWithAudio?.duration === "number"
      ? Math.round(firstSongWithAudio.duration)
      : null;

    if (!audioUrl) {
      console.warn("Complete callback received but no audio_url present", { musicId });
      return new Response(
        JSON.stringify({ success: false, error: "No audio_url in callback" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Fallback reconciliation if musicId missing
    if (!musicId) {
      const title = firstSongWithAudio?.title;
      if (title) {
        const { data: candidate } = await supabase
          .from("ai_generated_music")
          .select("id")
          .eq("status", "processing")
          .eq("title", title)
          .is("audio_url", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (candidate?.id) {
          musicId = candidate.id;
          console.log("Reconciled missing musicId from callback:", { musicId });
        }
      }
      
      if (!musicId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing musicId" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = {
      audio_url: audioUrl,
      status: "completed",
      error_message: null,
    };
    if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl;
    if (duration !== null) updateData.duration = duration;

    const { error } = await supabase
      .from("ai_generated_music")
      .update(updateData)
      .eq("id", musicId);

    if (error) {
      console.error("Failed to update ai_generated_music:", error);
      throw error;
    }

    console.log("Updated ai_generated_music from callback:", { musicId });

    return new Response(
      JSON.stringify({ success: true, message: "Callback processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Callback processing failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
