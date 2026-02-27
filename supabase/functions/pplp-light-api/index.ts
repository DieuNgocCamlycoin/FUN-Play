import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * PPLP Light API — Unified endpoint for Light Score data
 * 
 * Actions:
 * - profile: Public light level summary (no raw score)
 * - me: Private score detail (authenticated)
 * - epoch: Current mint epoch summary
 * - transparency: System-wide stats (no individual data)
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "profile";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // === PROFILE (public) ===
    if (action === "profile") {
      const userId = url.searchParams.get("user_id");
      if (!userId) {
        return json({ error: "user_id required" }, 400);
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("light_level, light_score, consistency_days")
        .eq("id", userId)
        .single();

      if (!profile) return json({ error: "User not found" }, 404);

      // Get active sequences
      const { count: sequenceCount } = await supabaseAdmin
        .from("features_user_day")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gt("sequence_count", 0)
        .gte("date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));

      // Calculate trend from recent ledger entries
      const trend = await calculateTrend(supabaseAdmin, userId);

      return json({
        level: mapLevelLabel(profile.light_level || "seed"),
        trend,
        consistency_streak: profile.consistency_days || 0,
        sequence_active: sequenceCount || 0,
      });
    }

    // === ME (authenticated) ===
    if (action === "me") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return json({ error: "Unauthorized" }, 401);
      }

      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
      if (claimsErr || !claimsData?.claims) {
        return json({ error: "Unauthorized" }, 401);
      }
      const userId = claimsData.claims.sub;

      // Get latest ledger entry
      const { data: ledger } = await supabaseAdmin
        .from("light_score_ledger")
        .select("*")
        .eq("user_id", userId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!ledger) {
        return json({
          period: null,
          final_light_score: 0,
          reputation_weight: 1.0,
          consistency_multiplier: 1.0,
          sequence_multiplier: 1.0,
          integrity_penalty: 0,
          reason_codes: [],
          rule_version: "V1.0",
        });
      }

      // Get reason codes from latest allocation
      const { data: allocation } = await supabaseAdmin
        .from("mint_allocations")
        .select("reason_codes")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return json({
        period: ledger.period,
        final_light_score: ledger.final_light_score,
        base_score: ledger.base_score,
        reputation_weight: ledger.reputation_weight,
        consistency_multiplier: ledger.consistency_multiplier,
        sequence_multiplier: ledger.sequence_multiplier,
        integrity_penalty: ledger.integrity_penalty,
        level: mapLevelLabel(ledger.level),
        rule_version: ledger.rule_version || "V1.0",
        reason_codes: allocation?.reason_codes || [],
      });
    }

    // === EPOCH (public) ===
    if (action === "epoch") {
      const { data: epoch } = await supabaseAdmin
        .from("mint_epochs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!epoch) return json({ epoch_id: null, message: "No epochs yet" });

      // Get total light from allocations
      const { data: allocations } = await supabaseAdmin
        .from("mint_allocations")
        .select("light_score_at_epoch")
        .eq("epoch_id", epoch.epoch_id)
        .eq("eligible", true);

      const totalLight = allocations?.reduce((sum, a) => sum + (a.light_score_at_epoch || 0), 0) || 0;

      return json({
        epoch_id: epoch.epoch_id,
        period: { start: epoch.period_start, end: epoch.period_end },
        status: epoch.status,
        mint_pool: epoch.mint_pool_amount,
        total_light: totalLight,
        rule_version: epoch.rules_version,
      });
    }

    // === TRANSPARENCY (public) ===
    if (action === "transparency") {
      // Total light across system
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("light_score, light_level")
        .eq("banned", false)
        .gt("light_score", 0);

      const totalLight = profiles?.reduce((sum, p) => sum + (p.light_score || 0), 0) || 0;

      // Level distribution
      const levelCounts: Record<string, number> = { seed: 0, sprout: 0, builder: 0, guardian: 0, architect: 0 };
      profiles?.forEach((p) => {
        const level = p.light_level || "seed";
        if (levelCounts[level] !== undefined) levelCounts[level]++;
      });
      const totalUsers = profiles?.length || 1;
      const levelDistribution = Object.fromEntries(
        Object.entries(levelCounts).map(([k, v]) => [k, Math.round((v / totalUsers) * 100)])
      );

      // Total FUN minted
      const { data: epochs } = await supabaseAdmin
        .from("mint_epochs")
        .select("mint_pool_amount")
        .eq("status", "finalized");
      const totalMinted = epochs?.reduce((sum, e) => sum + (e.mint_pool_amount || 0), 0) || 0;

      // Sequence stats
      const { count: mentorChains } = await supabaseAdmin
        .from("features_user_day")
        .select("*", { count: "exact", head: true })
        .gt("sequence_count", 0);

      // Active rule version
      const { data: activeRule } = await supabaseAdmin
        .from("scoring_rules")
        .select("rule_version, name")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      return json({
        total_light: totalLight,
        total_users_with_light: totalUsers,
        total_fun_minted: totalMinted,
        level_distribution_pct: levelDistribution,
        total_sequences_completed: mentorChains || 0,
        active_rule: activeRule || { rule_version: "V1.0", name: "PPLP Light Score V1" },
      });
    }

    return json({ error: "Unknown action. Use: profile, me, epoch, transparency" }, 400);
  } catch (err) {
    console.error("[pplp-light-api] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

// ===== HELPERS =====

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mapLevelLabel(level: string): string {
  const map: Record<string, string> = {
    seed: "Light Seed",
    presence: "Light Seed", // legacy mapping
    sprout: "Light Sprout",
    contributor: "Light Sprout", // legacy mapping
    builder: "Light Builder",
    guardian: "Light Guardian",
    architect: "Light Architect",
  };
  return map[level] || "Light Seed";
}

async function calculateTrend(supabase: any, userId: string): Promise<string> {
  const { data: ledger } = await supabase
    .from("light_score_ledger")
    .select("final_light_score")
    .eq("user_id", userId)
    .order("computed_at", { ascending: false })
    .limit(3);

  if (!ledger || ledger.length < 2) return "Stable";

  const recent = ledger[0].final_light_score;
  const prev = ledger[1].final_light_score;
  const diff = recent - prev;

  if (diff > 5) return "Growing";
  if (diff < -5) return "Reflecting";
  if (diff < -2) return "Rebalancing";
  return "Stable";
}
