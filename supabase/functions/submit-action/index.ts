import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action_type_code, title, description, source_platform, source_url, metadata } = body;

    if (!action_type_code || !title) {
      return new Response(JSON.stringify({ error: "action_type_code and title required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Look up action type
    const { data: actionType, error: atErr } = await supabase
      .from("action_types")
      .select("id")
      .eq("code", action_type_code)
      .eq("is_active", true)
      .single();

    if (atErr || !actionType) {
      return new Response(JSON.stringify({ error: `Unknown action type: ${action_type_code}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Velocity check: max 10 actions per day
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("user_actions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("submitted_at", `${today}T00:00:00Z`);

    if ((count ?? 0) >= 10) {
      return new Response(JSON.stringify({ error: "Daily action limit (10) reached" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create action
    const { data: action, error: insertErr } = await supabase
      .from("user_actions")
      .insert({
        user_id: user.id,
        action_type_id: actionType.id,
        title,
        description: description || null,
        source_platform: source_platform || null,
        source_url: source_url || null,
        raw_metadata: metadata || {},
        status: "proof_pending",
      })
      .select("id, status, submitted_at")
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to create action" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ action_id: action.id, status: action.status }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
