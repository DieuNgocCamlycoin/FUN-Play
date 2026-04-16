/**
 * Inflation Health — Daily job
 * 
 * Computes 5 health ratios + system health assessment.
 * Triggers safe mode warnings when critical thresholds breached.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const last30 = new Date(now.getTime() - 30 * 86400000);

    console.log(`[inflation-health] Computing health metrics for ${today}`);

    // ─── 1. Supply metrics ───
    // Total minted (from epoch_metrics)
    const { data: epochMetrics } = await supabase
      .from("epoch_metrics")
      .select("final_mint, computed_at")
      .order("computed_at", { ascending: false });

    const totalSupply = (epochMetrics || []).reduce((s: number, e: any) => s + (e.final_mint || 0), 0);
    const recentMint = (epochMetrics || [])
      .filter((e: any) => new Date(e.computed_at) >= last30)
      .reduce((s: number, e: any) => s + (e.final_mint || 0), 0);

    // Locked supply
    const { data: vestingData } = await supabase
      .from("reward_vesting_schedules")
      .select("locked_amount, unlocked_amount, claimed_amount");

    const lockedSupply = (vestingData || []).reduce((s: number, v: any) => s + (v.locked_amount || 0) - (v.unlocked_amount || 0), 0);
    const claimedSupply = (vestingData || []).reduce((s: number, v: any) => s + (v.claimed_amount || 0), 0);
    const circulatingSupply = totalSupply - lockedSupply;

    // ─── 2. Value Expansion Ratio ───
    // verified_value_growth / supply_growth
    const { data: recentScores } = await supabase
      .from("light_score_ledger")
      .select("final_light_score")
      .gte("computed_at", last30.toISOString());

    const verifiedValueGrowth = (recentScores || []).reduce((s: number, r: any) => s + r.final_light_score, 0);
    const supplyGrowthRate = totalSupply > 0 ? recentMint / totalSupply : 0;
    const valueExpansionRatio = recentMint > 0 ? verifiedValueGrowth / recentMint : 1;

    // ─── 3. Utility Absorption Ratio ───
    // ecosystem_FUN_used / newly_unlocked
    const { data: recentDonations } = await supabase
      .from("donation_transactions")
      .select("amount")
      .eq("status", "success")
      .gte("created_at", last30.toISOString());

    const funUsed = (recentDonations || []).reduce((s: number, d: any) => s + d.amount, 0);
    const recentUnlocked = (vestingData || []).reduce((s: number, v: any) => s + (v.unlocked_amount || 0), 0);
    const utilityAbsorptionRatio = recentUnlocked > 0 ? Math.min(1, funUsed / recentUnlocked) : 0.5;

    // ─── 4. Retention Quality Ratio ───
    // quality_active_users / total_claiming_users
    const { data: activeUsers } = await supabase
      .from("pplp_events")
      .select("actor_user_id")
      .gte("occurred_at", last30.toISOString());

    const qualityActiveUsers = new Set((activeUsers || []).map((e: any) => e.actor_user_id)).size;

    const { data: claimingUsers } = await supabase
      .from("claim_requests")
      .select("user_id")
      .gte("created_at", last30.toISOString());

    const totalClaimingUsers = new Set((claimingUsers || []).map((c: any) => c.user_id)).size;
    const retentionQualityRatio = totalClaimingUsers > 0 ? Math.min(1, qualityActiveUsers / totalClaimingUsers) : 1;

    // ─── 5. Fraud Pressure Ratio ───
    const { count: totalActivity } = await supabase
      .from("pplp_events")
      .select("*", { count: "exact", head: true })
      .gte("occurred_at", last30.toISOString());

    const { count: flaggedActivity } = await supabase
      .from("signals_anti_farm")
      .select("*", { count: "exact", head: true })
      .gte("created_at", last30.toISOString());

    const fraudPressureRatio = (totalActivity || 0) > 0 ? (flaggedActivity || 0) / (totalActivity || 1) : 0;

    // ─── 6. Locked Stability Ratio ───
    const lockedStabilityRatio = circulatingSupply > 0 ? lockedSupply / (lockedSupply + circulatingSupply) : 0.85;

    // ─── Assess health ───
    const warnings: string[] = [];
    let safeModeTriggered = false;

    if (valueExpansionRatio < 0.5) warnings.push("supply_growing_faster_than_value");
    if (utilityAbsorptionRatio < 0.3) warnings.push("low_utility_absorption");
    if (retentionQualityRatio < 0.4) warnings.push("low_retention_quality");
    if (fraudPressureRatio > 0.2) warnings.push("high_fraud_pressure");
    if (lockedStabilityRatio < 0.4) warnings.push("low_locked_ratio");

    const criticalCount = [
      valueExpansionRatio < 0.3,
      fraudPressureRatio > 0.3,
      utilityAbsorptionRatio < 0.15,
    ].filter(Boolean).length;

    if (criticalCount >= 2) {
      safeModeTriggered = true;
      warnings.push("SAFE_MODE_RECOMMENDED");

      // Log governance action
      await supabase.from("governance_actions").insert({
        action_type: "safe_mode_alert",
        parameters: { warnings, criticalCount, date: today },
        status: "pending",
        notes: `Auto-triggered: ${criticalCount} critical thresholds breached`,
      });
    }

    // ─── Write metrics ───
    await supabase.from("inflation_health_metrics").upsert({
      metric_date: today,
      value_expansion_ratio: round4(valueExpansionRatio),
      utility_absorption_ratio: round4(utilityAbsorptionRatio),
      retention_quality_ratio: round4(retentionQualityRatio),
      fraud_pressure_ratio: round4(fraudPressureRatio),
      locked_stability_ratio: round4(lockedStabilityRatio),
      supply_growth_rate: round4(supplyGrowthRate),
      total_supply: Math.round(totalSupply),
      circulating_supply: Math.round(circulatingSupply),
      locked_supply: Math.round(lockedSupply),
      active_quality_users: qualityActiveUsers,
      safe_mode_triggered: safeModeTriggered,
      details: {
        verified_value_growth: verifiedValueGrowth,
        recent_mint: recentMint,
        fun_used: funUsed,
        quality_active: qualityActiveUsers,
        total_claiming: totalClaimingUsers,
        flagged: flaggedActivity,
        total_activity: totalActivity,
        warnings,
      },
    }, { onConflict: "metric_date" });

    console.log(`[inflation-health] ✅ Health: ${warnings.length === 0 ? "HEALTHY" : warnings.join(", ")}`);

    return jsonResp({
      success: true,
      date: today,
      health: {
        valueExpansionRatio: round4(valueExpansionRatio),
        utilityAbsorptionRatio: round4(utilityAbsorptionRatio),
        retentionQualityRatio: round4(retentionQualityRatio),
        fraudPressureRatio: round4(fraudPressureRatio),
        lockedStabilityRatio: round4(lockedStabilityRatio),
      },
      supply: { total: Math.round(totalSupply), circulating: Math.round(circulatingSupply), locked: Math.round(lockedSupply) },
      warnings,
      safe_mode_triggered: safeModeTriggered,
    });
  } catch (err: any) {
    console.error("[inflation-health] Error:", err);
    return jsonResp({ error: err.message }, 500);
  }
});

function round4(n: number): number { return Math.round(n * 10000) / 10000; }

function jsonResp(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
