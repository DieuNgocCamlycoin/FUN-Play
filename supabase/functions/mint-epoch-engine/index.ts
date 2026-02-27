import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Mint Epoch Engine
 * 
 * Creates weekly epochs, calculates allocations based on light scores,
 * and distributes mint pool proportionally.
 * 
 * Flow:
 * 1. Finalize previous epoch (if any draft)
 * 2. Create new epoch for current week
 * 3. For each eligible user: calculate allocation from light_score_ledger
 * 4. Write mint_allocations
 */

const DEFAULT_WEEKLY_POOL = 100000; // FUN per week
const MAX_SHARE_PER_USER = 0.03; // 3% anti-whale cap

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let poolAmount = DEFAULT_WEEKLY_POOL;
    let action = "auto"; // "auto" | "finalize" | "create"
    try {
      const body = await req.json();
      poolAmount = body.pool_amount || DEFAULT_WEEKLY_POOL;
      action = body.action || "auto";
    } catch {
      // defaults
    }

    console.log(`[mint-epoch] Action: ${action}, Pool: ${poolAmount}`);

    // Step 1: Check for draft epochs to finalize
    const { data: draftEpochs } = await supabase
      .from("mint_epochs")
      .select("*")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1);

    if (draftEpochs?.length && (action === "auto" || action === "finalize")) {
      const epoch = draftEpochs[0];
      console.log(`[mint-epoch] Finalizing epoch ${epoch.epoch_id}`);

      // Calculate allocations for this epoch
      const allocations = await calculateAllocations(supabase, epoch);
      
      if (allocations.length > 0) {
        // Distribute pool proportionally based on light scores
        const totalScore = allocations.reduce((sum, a) => sum + a.score, 0);
        
        const maxPerUser = epoch.mint_pool_amount * MAX_SHARE_PER_USER;
        
        // First pass: calculate raw allocations
        let rawAllocations = allocations.map((a) => {
          const rawAmount = a.eligible && totalScore > 0
            ? (a.score / totalScore) * epoch.mint_pool_amount
            : 0;
          return { ...a, rawAmount };
        });

        // Anti-whale: cap and redistribute
        let excess = 0;
        let uncappedTotal = 0;
        rawAllocations = rawAllocations.map((a) => {
          if (a.rawAmount > maxPerUser) {
            excess += a.rawAmount - maxPerUser;
            return { ...a, rawAmount: maxPerUser, capped: true };
          }
          uncappedTotal += a.rawAmount;
          return { ...a, capped: false };
        });

        // Redistribute excess proportionally to uncapped users
        if (excess > 0 && uncappedTotal > 0) {
          rawAllocations = rawAllocations.map((a) => {
            if (!a.capped && a.rawAmount > 0) {
              const bonus = (a.rawAmount / uncappedTotal) * excess;
              const newAmount = a.rawAmount + bonus;
              // Re-check cap after redistribution
              return { ...a, rawAmount: Math.min(newAmount, maxPerUser) };
            }
            return a;
          });
        }

        const allocationRows = rawAllocations.map((a) => ({
          epoch_id: epoch.epoch_id,
          user_id: a.userId,
          eligible: a.eligible,
          allocation_amount: Math.round(a.rawAmount * 100) / 100,
          light_score_at_epoch: a.score,
          level_at_epoch: a.level,
          reason_codes: a.capped ? [...a.reasons, "anti_whale_capped"] : a.reasons,
          anti_whale_capped: a.capped || false,
        }));

        const { error: allocErr } = await supabase
          .from("mint_allocations")
          .upsert(allocationRows, { onConflict: "epoch_id,user_id" });

        if (allocErr) {
          console.error("[mint-epoch] Allocation insert error:", allocErr);
        } else {
          console.log(`[mint-epoch] ✅ ${allocationRows.length} allocations written`);
        }
      }

      // Mark epoch as finalized
      await supabase
        .from("mint_epochs")
        .update({ status: "finalized", finalized_at: new Date().toISOString() })
        .eq("epoch_id", epoch.epoch_id);

      if (action === "finalize") {
        return new Response(
          JSON.stringify({ success: true, action: "finalized", epoch_id: epoch.epoch_id, allocations: allocations.length }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Step 2: Create new epoch for current week
    if (action === "auto" || action === "create") {
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const weekStart = new Date(now);
      weekStart.setUTCDate(now.getUTCDate() - dayOfWeek);
      weekStart.setUTCHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

      const periodStart = weekStart.toISOString().slice(0, 10);
      const periodEnd = weekEnd.toISOString().slice(0, 10);

      // Check if epoch already exists for this period
      const { data: existingEpoch } = await supabase
        .from("mint_epochs")
        .select("epoch_id")
        .eq("period_start", periodStart)
        .eq("period_end", periodEnd)
        .limit(1)
        .maybeSingle();

      if (existingEpoch) {
        console.log(`[mint-epoch] Epoch already exists for ${periodStart} to ${periodEnd}`);
        return new Response(
          JSON.stringify({ success: true, action: "already_exists", epoch_id: existingEpoch.epoch_id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: newEpoch, error: createErr } = await supabase
        .from("mint_epochs")
        .insert({
          period_start: periodStart,
          period_end: periodEnd,
          mint_pool_amount: poolAmount,
          status: "draft",
          rules_version: "v2.0",
        })
        .select("epoch_id")
        .single();

      if (createErr) {
        console.error("[mint-epoch] Create epoch error:", createErr);
        return new Response(
          JSON.stringify({ error: createErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[mint-epoch] ✅ New epoch created: ${newEpoch.epoch_id} (${periodStart} - ${periodEnd})`);

      return new Response(
        JSON.stringify({ success: true, action: "created", epoch_id: newEpoch.epoch_id, period: { start: periodStart, end: periodEnd } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, action: "noop" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[mint-epoch] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function calculateAllocations(
  supabase: any,
  epoch: any
): Promise<Array<{ userId: string; score: number; level: string; eligible: boolean; reasons: string[] }>> {
  const allocations: Array<{ userId: string; score: number; level: string; eligible: boolean; reasons: string[] }> = [];

  // Get all profiles with light scores
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, light_score, light_level, banned, pplp_accepted_at")
    .eq("banned", false)
    .gt("light_score", 0)
    .order("light_score", { ascending: false })
    .limit(1000);

  if (!profiles) return allocations;

  for (const profile of profiles) {
    const reasons: string[] = [];
    let eligible = true;

    // Must have accepted PPLP
    if (!profile.pplp_accepted_at) {
      eligible = false;
      reasons.push("pplp_not_accepted");
    }

    // Must be at least "contributor" level
    if (profile.light_level === "presence") {
      eligible = false;
      reasons.push("level_too_low");
    }

    // Check anti-farm signals
    const { data: signals } = await supabase
      .from("signals_anti_farm")
      .select("signal_id")
      .eq("user_id", profile.id)
      .eq("status", "confirmed")
      .limit(1)
      .maybeSingle();

    if (signals) {
      eligible = false;
      reasons.push("anti_farm_flagged");
    }

    // Check activity in epoch period
    const { count: eventCount } = await supabase
      .from("pplp_events")
      .select("*", { count: "exact", head: true })
      .eq("actor_user_id", profile.id)
      .gte("occurred_at", `${epoch.period_start}T00:00:00Z`)
      .lte("occurred_at", `${epoch.period_end}T23:59:59Z`);

    if (!eventCount || eventCount === 0) {
      eligible = false;
      reasons.push("no_activity_in_epoch");
    }

    if (eligible) {
      reasons.push("qualified");
    }

    allocations.push({
      userId: profile.id,
      score: profile.light_score,
      level: profile.light_level || "presence",
      eligible,
      reasons,
    });
  }

  return allocations;
}
