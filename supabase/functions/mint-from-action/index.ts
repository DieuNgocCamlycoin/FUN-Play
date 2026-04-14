/**
 * mint-from-action — Convert validated Light Score → FUN Money
 * 
 * CTO Diagram v13Apr2026:
 * MintAmount = BaseMintRate × FinalLightScore × ImpactWeight × TrustMultiplier
 * Split: 99% User / 1% Platform
 * 
 * IMMUTABLE RULES:
 * - No Score → No Mint
 * - Mint split = 99/1
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_MINT_RATE = 10; // 10 FUN per 1.0 Light Score

const IMPACT_WEIGHTS: Record<string, number> = {
  inner_work: 0.80,
  channeling: 1.00,
  giving: 1.10,
  social_impact: 1.10,
  service: 1.30,
  learning: 0.90,
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action_id } = await req.json();
    if (!action_id) {
      return new Response(JSON.stringify({ error: "action_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get action + validation
    const { data: action } = await supabaseAdmin
      .from("user_actions")
      .select("*, action_types(pillar_group)")
      .eq("id", action_id)
      .single();

    if (!action || action.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action.status !== "validated") {
      return new Response(JSON.stringify({ error: "Action not validated yet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get validation
    const { data: validation } = await supabaseAdmin
      .from("pplp_validations")
      .select("*")
      .eq("action_id", action_id)
      .eq("validation_status", "validated")
      .single();

    if (!validation) {
      return new Response(JSON.stringify({ error: "🚫 No Score → No Mint" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lightScore = validation.final_light_score;
    if (lightScore <= 0) {
      return new Response(JSON.stringify({ error: "🚫 Light Score = 0 → No Mint (zero-kill rule)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if already minted
    const { count: existingMint } = await supabaseAdmin
      .from("mint_records")
      .select("id", { count: "exact", head: true })
      .eq("action_id", action_id);

    if ((existingMint ?? 0) > 0) {
      return new Response(JSON.stringify({ error: "Already minted for this action" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Calculate mint amount
    const pillarGroup = action.action_types?.pillar_group || "channeling";
    const impactWeight = IMPACT_WEIGHTS[pillarGroup] ?? 1.0;

    // Get user trust level
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("created_at, consistency_days")
      .eq("id", user.id)
      .single();

    const ageDays = profile ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) : 0;
    const trustMultiplier = Math.max(1.0, Math.min(1.25, 1 + ageDays / 365 * 0.25));

    // Consistency multiplier
    const consistencyDays = profile?.consistency_days || 0;
    const consistencyMult = 1 + 0.6 * (1 - Math.exp(-consistencyDays / 30));

    const mintTotal = Math.round(BASE_MINT_RATE * lightScore * impactWeight * trustMultiplier * consistencyMult * 100) / 100;
    const mintUser = Math.round(mintTotal * 0.99 * 100) / 100;
    const mintPlatform = Math.round(mintTotal * 0.01 * 100) / 100;

    // Create mint record
    const { data: mintRecord, error: mintErr } = await supabaseAdmin
      .from("mint_records")
      .insert({
        action_id,
        user_id: user.id,
        light_score: lightScore,
        mint_amount_total: mintTotal,
        mint_amount_user: mintUser,
        mint_amount_platform: mintPlatform,
        release_mode: "instant",
        claimable_now: mintUser,
        locked_amount: 0,
        status: "minted",
      })
      .select("id")
      .single();

    if (mintErr) {
      console.error("Mint record error:", mintErr);
      return new Response(JSON.stringify({ error: "Failed to create mint record" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create ledger entries (audit trail)
    await supabaseAdmin.from("balance_ledger").insert([
      {
        user_id: user.id,
        entry_type: "mint_user",
        amount: mintUser,
        reference_table: "mint_records",
        reference_id: mintRecord.id,
        note: `PPLP mint: ${lightScore} LS × ${impactWeight} impact → ${mintUser} FUN (99%)`,
      },
      {
        user_id: user.id,
        entry_type: "mint_platform",
        amount: mintPlatform,
        reference_table: "mint_records",
        reference_id: mintRecord.id,
        note: `Platform share: ${mintPlatform} FUN (1%)`,
      },
    ]);

    // Update action status
    await supabaseAdmin
      .from("user_actions")
      .update({ status: "minted" })
      .eq("id", action_id);

    return new Response(JSON.stringify({
      action_id,
      mint_record_id: mintRecord.id,
      light_score: lightScore,
      mint_amount_total: mintTotal,
      mint_amount_user: mintUser,
      mint_amount_platform: mintPlatform,
      status: "minted",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mint-from-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
