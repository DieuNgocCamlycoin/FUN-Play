/**
 * create-group — POST /v1/events/{eventId}/groups
 * OpenAPI v1 aligned: group_name, estimated_participants
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    // Accept both OpenAPI fields and legacy fields
    const event_id = body.event_id;
    const love_house_id = body.love_house_id || null;
    const location = body.location || body.group_name || null;
    const expected_count = body.expected_count ?? body.estimated_participants ?? 0;

    if (!event_id) {
      return new Response(JSON.stringify({ error: "event_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify event exists
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, status")
      .eq("id", event_id)
      .single();

    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: group, error } = await supabaseAdmin
      .from("love_house_groups")
      .insert({
        event_id,
        leader_user_id: user.id,
        love_house_id,
        location: location ? String(location).slice(0, 500) : null,
        expected_count: Math.max(0, Math.min(1000, Number(expected_count) || 0)),
        status: "registered",
      })
      .select("id, event_id, love_house_id, status, location, expected_count")
      .single();

    if (error) {
      console.error("create-group error:", error);
      return new Response(JSON.stringify({ error: "Failed to create group" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      group: {
        ...group,
        group_name: group.location,
        estimated_participants: group.expected_count,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-group error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
