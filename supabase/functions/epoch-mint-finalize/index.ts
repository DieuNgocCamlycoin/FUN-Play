/**
 * Epoch Mint Finalize — Weekly job
 * 
 * 28-day rolling mint epoch finalization.
 * Implements the full Monetary Expansion formula:
 * TotalMint = Base + Contribution + Ecosystem
 * AdjustedMint = TotalMint × DisciplineModulator
 * FinalMint = clamp(min, adjusted, max)
 * 
 * Then allocates to 5 pools and per-user with vesting split.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default config values
const DEFAULTS = {
  baseRate: 500000,
  systemStage: "bootstrap",
  alpha: 1000, beta: 800, gamma: 600,
  delta: 500, epsilon: 100, zeta: 300,
  minEpochMint: 100000,
  maxEpochMintPolicy: 20000000,
  disciplineModMin: 0.65,
  disciplineModMax: 1.25,
  userRewardPct: 0.70,
  ecosystemPct: 0.12,
  treasuryPct: 0.10,
  growthPct: 0.05,
  reservePct: 0.03,
  instantPortion: 0.15,
  maxSharePerUser: 0.03,
};

const STAGE_FACTORS: Record<string, number> = { bootstrap: 1.5, growth: 1.0, mature: 0.6 };
const TRUST_BAND_INSTANT_ADJ: Record<string, number> = { new: -0.05, standard: 0, trusted: 0.05, veteran: 0.10 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const windowStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const epochId = `mint_${windowStart.toISOString().slice(0, 10)}_${now.toISOString().slice(0, 10)}`;

    console.log(`[mint-finalize] Finalizing 28-day epoch: ${epochId}`);

    // Load config from epoch_config table (fallback to defaults)
    const config = await loadConfig(supabase);

    // ─── Step 1: Gather epoch-level metrics ───
    const metrics = await gatherMetrics(supabase, windowStart, now);
    console.log(`[mint-finalize] Metrics:`, JSON.stringify(metrics));

    // ─── Step 2: Calculate expansions ───
    const epochLengthFactor = 28 / 28; // standard
    const stageFactor = STAGE_FACTORS[config.systemStage] ?? 1.0;
    const baseExpansion = config.baseRate * epochLengthFactor * stageFactor;

    const normalizedLight = Math.log(1 + metrics.totalVerifiedLightScore);
    const normalizedContrib = Math.sqrt(1 + metrics.totalContributionValue);
    const serviceImpact = Math.min(metrics.serviceImpactScore, 100);
    const contributionExpansion = config.alpha * normalizedLight + config.beta * normalizedContrib + config.gamma * serviceImpact;

    let ecosystemExpansion = config.delta * metrics.ecosystemUsageIndex + config.epsilon * metrics.activeQualityUserCount + config.zeta * metrics.utilityDiversityIndex;

    const guardrailFlags: string[] = [];

    // Guardrail 4: Utility coupling
    if (metrics.ecosystemUsageIndex < 0.1) {
      ecosystemExpansion *= 0.3;
      guardrailFlags.push("ecosystem_suppressed_low_usage");
    }

    const totalMint = baseExpansion + contributionExpansion + ecosystemExpansion;

    // ─── Step 3: Discipline modulator ───
    const discipline = await gatherDisciplineInputs(supabase);
    const rawMod = 0.30 * discipline.liquidityDiscipline + 0.25 * (1 - discipline.fraudPressure) + 0.25 * discipline.claimEfficiency + 0.20 * discipline.utilityRetention;
    const modRange = config.disciplineModMax - config.disciplineModMin;
    const disciplineModulator = Math.max(config.disciplineModMin, Math.min(config.disciplineModMax, config.disciplineModMin + rawMod * modRange));

    if (discipline.fraudPressure > 0.3) guardrailFlags.push("high_fraud_pressure");
    if (discipline.liquidityDiscipline < 0.3) guardrailFlags.push("low_liquidity_discipline");

    const adjustedMint = totalMint * disciplineModulator;
    let finalMint = Math.max(config.minEpochMint, Math.min(config.maxEpochMintPolicy, adjustedMint));
    finalMint = Math.round(finalMint * 100) / 100;

    if (adjustedMint > config.maxEpochMintPolicy) guardrailFlags.push("capped_by_max_policy");
    if (adjustedMint < config.minEpochMint) guardrailFlags.push("floored_by_min_mint");

    console.log(`[mint-finalize] Final mint: ${finalMint} (base=${Math.round(baseExpansion)}, contrib=${Math.round(contributionExpansion)}, eco=${Math.round(ecosystemExpansion)}, mod=${disciplineModulator.toFixed(4)})`);

    // ─── Step 4: Allocate to pools ───
    const userRewardPool = finalMint * config.userRewardPct;
    const ecosystemPool = finalMint * config.ecosystemPct;
    const treasuryPool = finalMint * config.treasuryPct;
    const growthPool = finalMint * config.growthPct;
    const reservePool = finalMint * config.reservePct;

    // ─── Step 5: Per-user allocation ───
    const { data: validatedScores } = await supabase
      .from("user_epoch_scores")
      .select("user_id, validated_score, trust_factor, consistency_factor, utility_factor, trust_band")
      .like("epoch_id", "validation_%")
      .gt("validated_score", 0)
      .order("validated_score", { ascending: false })
      .limit(1000);

    const eligible = (validatedScores || []).filter(u => u.validated_score > 0);
    const userAllocations: any[] = [];

    if (eligible.length > 0) {
      // Calculate weighted scores
      const weighted = eligible.map(u => ({
        ...u,
        weightedScore: (u.validated_score || 0) * (u.trust_factor || 1) * (u.consistency_factor || 0.5) * Math.max(0.1, u.utility_factor || 0.5),
      }));

      const totalWeighted = weighted.reduce((s, u) => s + u.weightedScore, 0);
      const maxPerUser = userRewardPool * config.maxSharePerUser;

      for (const user of weighted) {
        const rawUserMint = totalWeighted > 0 ? userRewardPool * (user.weightedScore / totalWeighted) : 0;
        const userMint = Math.min(rawUserMint, maxPerUser);
        const capped = rawUserMint > maxPerUser;

        // Vesting split
        const trustBand = user.trust_band || "new";
        const instantAdj = TRUST_BAND_INSTANT_ADJ[trustBand] ?? 0;
        const instantPct = Math.max(0.10, Math.min(0.25, config.instantPortion + instantAdj));
        const instantAmount = Math.round(userMint * instantPct * 100) / 100;
        const lockedAmount = Math.round((userMint - instantAmount) * 100) / 100;

        userAllocations.push({
          user_id: user.user_id,
          epoch_id: epochId,
          allocation_amount: Math.round(userMint * 100) / 100,
          instant_amount: instantAmount,
          locked_amount: lockedAmount,
          trust_band: trustBand,
          finalized_score: user.validated_score,
          anti_whale_capped: capped,
          eligible: true,
          reason_codes: capped ? ["qualified", "anti_whale_capped"] : ["qualified"],
          light_score_at_epoch: user.validated_score,
        });
      }
    }

    // ─── Step 6: Write results ───

    // Create mint epoch record
    await supabase.from("mint_epochs").insert({
      period_start: windowStart.toISOString().slice(0, 10),
      period_end: now.toISOString().slice(0, 10),
      mint_pool_amount: finalMint,
      status: "finalized",
      rules_version: "monetary_v1.0",
      epoch_type: "mint",
      window_start: windowStart.toISOString(),
      window_end: now.toISOString(),
      base_expansion: Math.round(baseExpansion * 100) / 100,
      contribution_expansion: Math.round(contributionExpansion * 100) / 100,
      ecosystem_expansion: Math.round(ecosystemExpansion * 100) / 100,
      discipline_modulator: Math.round(disciplineModulator * 10000) / 10000,
      adjusted_mint: Math.round(adjustedMint * 100) / 100,
      final_mint: finalMint,
      finalized_at: now.toISOString(),
    });

    // Write epoch metrics
    await supabase.from("epoch_metrics").insert({
      epoch_id: epochId,
      base_expansion: Math.round(baseExpansion * 100) / 100,
      contribution_expansion: Math.round(contributionExpansion * 100) / 100,
      ecosystem_expansion: Math.round(ecosystemExpansion * 100) / 100,
      total_mint: Math.round(totalMint * 100) / 100,
      discipline_modulator: Math.round(disciplineModulator * 10000) / 10000,
      adjusted_mint: Math.round(adjustedMint * 100) / 100,
      final_mint: finalMint,
      guardrail_flags: guardrailFlags,
      health_snapshot: { ...metrics, ...discipline },
    });

    // Write mint batch
    await supabase.from("mint_batches").insert({
      epoch_id: epochId,
      batch_number: 1,
      total_mint: finalMint,
      user_count: userAllocations.length,
      guardrail_flags: guardrailFlags,
      governance_required: guardrailFlags.length > 2,
      status: guardrailFlags.length > 2 ? "pending_review" : "approved",
    });

    // Write allocations
    if (userAllocations.length > 0) {
      const { error: allocErr } = await supabase
        .from("mint_allocations")
        .upsert(userAllocations, { onConflict: "epoch_id,user_id" });
      if (allocErr) console.error("[mint-finalize] Allocation error:", allocErr);
    }

    // Write vesting schedules
    for (const alloc of userAllocations) {
      await supabase.from("reward_vesting_schedules").upsert({
        user_id: alloc.user_id,
        epoch_id: epochId,
        total_amount: alloc.allocation_amount,
        instant_amount: alloc.instant_amount,
        locked_amount: alloc.locked_amount,
        unlocked_amount: 0,
        claimed_amount: 0,
        token_state: "minted_locked",
        next_unlock_at: new Date(now.getTime() + 7 * 86400000).toISOString(),
      }, { onConflict: "user_id,epoch_id" });
    }

    // Write treasury flows
    const treasuryFlows = [
      { to_vault: "RewardReserve", amount: Math.round(ecosystemPool * 100) / 100, reason: "epoch_allocation", epoch_id: epochId },
      { to_vault: "Infrastructure", amount: Math.round(treasuryPool * 0.4 * 100) / 100, reason: "epoch_allocation", epoch_id: epochId },
      { to_vault: "CommunityGrowth", amount: Math.round(treasuryPool * 0.3 * 100) / 100, reason: "epoch_allocation", epoch_id: epochId },
      { to_vault: "Stability", amount: Math.round(reservePool * 100) / 100, reason: "epoch_allocation", epoch_id: epochId },
      { to_vault: "StrategicExpansion", amount: Math.round(growthPool * 100) / 100, reason: "epoch_allocation", epoch_id: epochId },
    ];
    await supabase.from("treasury_flows").insert(treasuryFlows);

    // Update treasury vault balances
    for (const flow of treasuryFlows) {
      const { data: existing } = await supabase
        .from("treasury_vault_balances")
        .select("id, balance")
        .eq("vault_name", flow.to_vault)
        .maybeSingle();

      if (existing) {
        await supabase.from("treasury_vault_balances")
          .update({ balance: existing.balance + flow.amount, last_inflow_at: now.toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("treasury_vault_balances").insert({
          vault_name: flow.to_vault,
          balance: flow.amount,
          last_inflow_at: now.toISOString(),
        });
      }
    }

    return jsonResp({
      success: true,
      epoch_id: epochId,
      final_mint: finalMint,
      users_allocated: userAllocations.length,
      guardrail_flags: guardrailFlags,
      allocation: { userRewardPool: Math.round(userRewardPool), ecosystemPool: Math.round(ecosystemPool), treasuryPool: Math.round(treasuryPool), growthPool: Math.round(growthPool), reservePool: Math.round(reservePool) },
    });
  } catch (err: any) {
    console.error("[mint-finalize] Error:", err);
    return jsonResp({ error: err.message }, 500);
  }
});

// ─── Helpers ─────────────────────────────────────────────────

async function loadConfig(supabase: any) {
  const { data: configs } = await supabase.from("epoch_config").select("config_key, config_value");
  const map: Record<string, number> = {};
  for (const c of configs || []) map[c.config_key] = c.config_value;

  return {
    baseRate: map["base_rate"] ?? DEFAULTS.baseRate,
    systemStage: (map["system_stage"] === 2 ? "growth" : map["system_stage"] === 3 ? "mature" : "bootstrap") as string,
    alpha: map["alpha"] ?? DEFAULTS.alpha,
    beta: map["beta"] ?? DEFAULTS.beta,
    gamma: map["gamma"] ?? DEFAULTS.gamma,
    delta: map["delta"] ?? DEFAULTS.delta,
    epsilon: map["epsilon"] ?? DEFAULTS.epsilon,
    zeta: map["zeta"] ?? DEFAULTS.zeta,
    minEpochMint: map["min_epoch_mint"] ?? DEFAULTS.minEpochMint,
    maxEpochMintPolicy: map["max_epoch_mint_policy"] ?? DEFAULTS.maxEpochMintPolicy,
    disciplineModMin: map["discipline_mod_min"] ?? DEFAULTS.disciplineModMin,
    disciplineModMax: map["discipline_mod_max"] ?? DEFAULTS.disciplineModMax,
    userRewardPct: map["user_reward_pct"] ?? DEFAULTS.userRewardPct,
    ecosystemPct: map["ecosystem_pct"] ?? DEFAULTS.ecosystemPct,
    treasuryPct: map["treasury_pct"] ?? DEFAULTS.treasuryPct,
    growthPct: map["growth_pct"] ?? DEFAULTS.growthPct,
    reservePct: map["reserve_pct"] ?? DEFAULTS.reservePct,
    instantPortion: map["instant_portion"] ?? DEFAULTS.instantPortion,
    maxSharePerUser: map["max_share_per_user"] ?? DEFAULTS.maxSharePerUser,
  };
}

async function gatherMetrics(supabase: any, windowStart: Date, now: Date) {
  // Total verified light scores
  const { data: scores } = await supabase
    .from("light_score_ledger")
    .select("final_light_score")
    .gte("computed_at", windowStart.toISOString());

  const totalVerifiedLightScore = (scores || []).reduce((s: number, r: any) => s + (r.final_light_score || 0), 0);

  // Contribution value (from validated user_actions)
  const { data: actions } = await supabase
    .from("user_actions")
    .select("final_score")
    .eq("validation_status", "validated")
    .gte("created_at", windowStart.toISOString());

  const totalContributionValue = (actions || []).reduce((s: number, a: any) => s + (a.final_score || 0), 0);

  // Service impact (phụng sự, giúp đỡ, trao tặng)
  const { count: serviceCount } = await supabase
    .from("pplp_events")
    .select("*", { count: "exact", head: true })
    .in("event_type", ["volunteer", "coaching", "donation", "content_share"])
    .gte("occurred_at", windowStart.toISOString());

  const serviceImpactScore = Math.min(100, (serviceCount || 0) * 0.5);

  // Active quality users
  const { data: activeUsers } = await supabase
    .from("pplp_events")
    .select("actor_user_id")
    .gte("occurred_at", windowStart.toISOString());

  const uniqueActive = new Set((activeUsers || []).map((e: any) => e.actor_user_id)).size;

  // Ecosystem usage index (simplified: FUN used in donations + services)
  const { data: donationData } = await supabase
    .from("donation_transactions")
    .select("amount")
    .eq("status", "success")
    .gte("created_at", windowStart.toISOString());

  const totalDonated = (donationData || []).reduce((s: number, d: any) => s + (d.amount || 0), 0);
  const ecosystemUsageIndex = Math.min(1, totalDonated / 100000); // normalize

  // Utility diversity (count distinct use cases)
  const diversityScore = Math.min(1, Math.sqrt(uniqueActive) / 20); // simplified

  return {
    totalVerifiedLightScore,
    totalContributionValue,
    serviceImpactScore,
    activeQualityUserCount: uniqueActive,
    ecosystemUsageIndex,
    utilityDiversityIndex: diversityScore,
  };
}

async function gatherDisciplineInputs(supabase: any) {
  // Simplified: gather from latest health metrics or compute
  const { data: latest } = await supabase
    .from("inflation_health_metrics")
    .select("*")
    .order("metric_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest) {
    return {
      liquidityDiscipline: latest.locked_stability_ratio || 0.7,
      fraudPressure: latest.fraud_pressure_ratio || 0.05,
      claimEfficiency: latest.utility_absorption_ratio || 0.5,
      utilityRetention: latest.retention_quality_ratio || 0.5,
    };
  }

  // Default conservative values for first epoch
  return { liquidityDiscipline: 0.7, fraudPressure: 0.05, claimEfficiency: 0.5, utilityRetention: 0.5 };
}

function jsonResp(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
