/**
 * get-action — GET /v1/actions/{actionId}
 * Returns action detail with proofs array (OpenAPI v1)
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

    const { action_id } = await req.json();
    if (!action_id) {
      return new Response(JSON.stringify({ error: "action_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get action with type info
    const { data: action, error: actionErr } = await supabase
      .from("user_actions")
      .select("*, action_types(code, name, pillar_group)")
      .eq("id", action_id)
      .eq("user_id", user.id)
      .single();

    if (actionErr || !action) {
      return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get proofs
    const { data: proofs } = await supabase
      .from("proofs")
      .select("id, proof_type, proof_url, file_hash, external_ref, created_at")
      .eq("action_id", action_id)
      .order("created_at", { ascending: true });

    // Get validation if exists
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: validation } = await supabaseAdmin
      .from("pplp_validations")
      .select("id, serving_life, transparent_truth, healing_love, long_term_value, unity_over_separation, ai_score, community_score, trust_signal_score, final_light_score, validation_status, explanation, validated_at")
      .eq("action_id", action_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get mint record if exists
    const { data: mintRecord } = await supabaseAdmin
      .from("mint_records")
      .select("id, mint_amount_total, mint_amount_user, mint_amount_platform, status, created_at")
      .eq("action_id", action_id)
      .maybeSingle();

    return new Response(JSON.stringify({
      action_id: action.id,
      action_type: action.action_types?.code || null,
      title: action.title,
      description: action.description,
      status: action.status,
      source_platform: action.source_platform,
      source_url: action.source_url,
      submitted_at: action.submitted_at,
      created_at: action.created_at,
      proofs: proofs || [],
      validation: validation || null,
      mint: mintRecord || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
