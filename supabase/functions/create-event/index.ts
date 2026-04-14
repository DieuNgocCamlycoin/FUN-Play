/**
 * create-event — POST /v1/events
 * OpenAPI v1 aligned: event_type, source_platform, zoom_meeting_id, livestream_links
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OpenAPI v1 aligned enum values
const VALID_EVENT_TYPES = [
  "ZOOM_GROUP_MEDITATION",
  "LIVESTREAM_SESSION",
  "LOVE_HOUSE_GATHERING",
  "HYBRID_EVENT",
  "IN_PERSON_RETREAT",
];

// Backward-compat mapping from legacy values
const LEGACY_MAP: Record<string, string> = {
  zoom_session: "ZOOM_GROUP_MEDITATION",
  love_house: "LOVE_HOUSE_GATHERING",
  hybrid: "HYBRID_EVENT",
  in_person: "IN_PERSON_RETREAT",
  livestream: "LIVESTREAM_SESSION",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { title, description, platform_links, livestream_links, start_at, end_at, recording_hash, event_type, source_platform, zoom_meeting_id } = body;

    if (!title || !start_at) {
      return new Response(JSON.stringify({ error: "title and start_at are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve event_type: accept both new enum and legacy values
    const mapped = event_type ? (LEGACY_MAP[event_type] || event_type) : "ZOOM_GROUP_MEDITATION";
    const resolvedEventType = VALID_EVENT_TYPES.includes(mapped) ? mapped : "ZOOM_GROUP_MEDITATION";

    // Merge platform_links and livestream_links
    const allLinks = [...(platform_links || []), ...(livestream_links || [])];

    const { data: event, error } = await supabaseAdmin
      .from("events")
      .insert({
        host_user_id: user.id,
        title: String(title).slice(0, 255),
        description: description ? String(description).slice(0, 2000) : null,
        platform_links: allLinks.length > 0 ? allLinks : [],
        start_at,
        end_at: end_at || null,
        recording_hash: recording_hash || null,
        event_type: resolvedEventType,
        source_platform: source_platform || null,
        zoom_meeting_id: zoom_meeting_id || null,
        status: "scheduled",
      })
      .select("id, title, status, start_at, event_type, source_platform, zoom_meeting_id")
      .single();

    if (error) {
      console.error("create-event error:", error);
      return new Response(JSON.stringify({ error: "Failed to create event" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ event }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-event error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
