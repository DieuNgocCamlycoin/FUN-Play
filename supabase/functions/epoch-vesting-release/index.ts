/**
 * Epoch Vesting Release — Daily job
 * 
 * Checks unlock conditions for all MINTED_LOCKED and VESTING_UNLOCKABLE schedules.
 * Updates claimable amounts based on time + value conditions.
 * Auto-activates without user action.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_VESTING_INTERVAL = 7; // days
const TOTAL_VESTING_PERIOD = 28; // days
const DORMANT_THRESHOLD_DAYS = 60;
const DORMANT_VAULT_DAYS = 180;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    console.log(`[vesting-release] Running daily vesting check at ${now.toISOString()}`);

    // Get all active vesting schedules
    const { data: schedules } = await supabase
      .from("reward_vesting_schedules")
      .select("*")
      .in("token_state", ["minted_locked", "vesting_unlockable"])
      .or(`next_unlock_at.is.null,next_unlock_at.lte.${now.toISOString()}`)
      .limit(500);

    if (!schedules?.length) {
      return jsonResp({ message: "No schedules due for unlock", processed: 0 });
    }

    console.log(`[vesting-release] ${schedules.length} schedules to process`);

    let processed = 0;
    let totalUnlocked = 0;

    for (const schedule of schedules) {
      const mintDate = new Date(schedule.created_at);
      const daysSinceMint = Math.floor((now.getTime() - mintDate.getTime()) / 86400000);

      // Check user activity
      const { count: recentEvents } = await supabase
        .from("pplp_events")
        .select("*", { count: "exact", head: true })
        .eq("actor_user_id", schedule.user_id)
        .gte("occurred_at", new Date(now.getTime() - 7 * 86400000).toISOString());

      const userActive = (recentEvents || 0) > 0;

      // Get last activity date
      const { data: lastEvent } = await supabase
        .from("pplp_events")
        .select("occurred_at")
        .eq("actor_user_id", schedule.user_id)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastActivityDaysAgo = lastEvent
        ? Math.floor((now.getTime() - new Date(lastEvent.occurred_at).getTime()) / 86400000)
        : 999;

      // Check if user has continued PPLP activity
      const continuedPplpActivity = userActive && (recentEvents || 0) >= 3;

      // Check FUN usage in ecosystem
      const { data: recentDonations } = await supabase
        .from("donation_transactions")
        .select("amount")
        .eq("sender_id", schedule.user_id)
        .eq("status", "success")
        .gte("created_at", mintDate.toISOString());

      const funUsedInEcosystem = (recentDonations || []).reduce((s: number, d: any) => s + d.amount, 0);

      // Check scores maintained
      const { data: profile } = await supabase
        .from("profiles")
        .select("light_score")
        .eq("id", schedule.user_id)
        .single();

      const scoresMaintained = (profile?.light_score || 0) >= (schedule.locked_amount > 0 ? 10 : 0);

      // ─── Calculate unlocks ───

      // Dormancy check
      if (lastActivityDaysAgo >= DORMANT_VAULT_DAYS) {
        await supabase.from("reward_vesting_schedules").update({
          token_state: "minted_locked",
          dormant_at: now.toISOString(),
          updated_at: now.toISOString(),
        }).eq("id", schedule.id);
        continue;
      }

      const inSlowMode = lastActivityDaysAgo >= DORMANT_THRESHOLD_DAYS;

      // Base vesting
      const intervals = Math.floor(daysSinceMint / BASE_VESTING_INTERVAL);
      const maxIntervals = Math.floor(TOTAL_VESTING_PERIOD / BASE_VESTING_INTERVAL);
      const effectiveIntervals = Math.min(intervals, maxIntervals);
      const totalShouldBeUnlocked = (effectiveIntervals / maxIntervals) * schedule.locked_amount;
      let baseUnlock = Math.max(0, totalShouldBeUnlocked - schedule.unlocked_amount);
      if (inSlowMode) baseUnlock *= 0.5;

      // Contribution unlock (up to 10%)
      const maxContribBonus = schedule.locked_amount * 0.10;
      let contribUnlock = 0;
      if (continuedPplpActivity) {
        const bonusPerCheck = maxContribBonus / 4;
        contribUnlock = Math.min(bonusPerCheck, maxContribBonus - (schedule.contribution_unlock || 0));
        contribUnlock = Math.max(0, contribUnlock);
      }

      // Usage unlock (up to 8%)
      const maxUsageBonus = schedule.locked_amount * 0.08;
      let usageUnlock = 0;
      if (funUsedInEcosystem > 0) {
        const usageRatio = Math.min(1, Math.sqrt(funUsedInEcosystem / Math.max(1, schedule.locked_amount)));
        const totalUsage = maxUsageBonus * usageRatio;
        usageUnlock = Math.max(0, totalUsage - (schedule.usage_unlock || 0));
      }

      // Consistency unlock (up to 7%)
      const maxConsistBonus = schedule.locked_amount * 0.07;
      let consistUnlock = 0;
      if (scoresMaintained && userActive) {
        const bonusPerCheck = maxConsistBonus / 4;
        consistUnlock = Math.min(bonusPerCheck, maxConsistBonus - (schedule.consistency_unlock || 0));
        consistUnlock = Math.max(0, consistUnlock);
      }

      const totalNewUnlock = round2(baseUnlock + contribUnlock + usageUnlock + consistUnlock);

      if (totalNewUnlock <= 0 && !inSlowMode) {
        // Set next check
        await supabase.from("reward_vesting_schedules").update({
          next_unlock_at: new Date(now.getTime() + 7 * 86400000).toISOString(),
          updated_at: now.toISOString(),
        }).eq("id", schedule.id);
        continue;
      }

      const newUnlockedTotal = round2(schedule.unlocked_amount + totalNewUnlock);
      const remainingLocked = schedule.locked_amount - newUnlockedTotal;

      let newState: string = schedule.token_state;
      if (totalNewUnlock > 0 && schedule.token_state === "minted_locked") {
        newState = "vesting_unlockable";
      }
      if (remainingLocked <= 0.01) {
        newState = "claimable";
      }

      // Build unlock event
      const unlockEvents = schedule.unlock_history || [];
      if (totalNewUnlock > 0) {
        unlockEvents.push({
          date: now.toISOString(),
          amount: totalNewUnlock,
          base: round2(baseUnlock),
          contribution: round2(contribUnlock),
          usage: round2(usageUnlock),
          consistency: round2(consistUnlock),
        });
      }

      await supabase.from("reward_vesting_schedules").update({
        unlocked_amount: newUnlockedTotal,
        token_state: newState,
        contribution_unlock: round2((schedule.contribution_unlock || 0) + contribUnlock),
        usage_unlock: round2((schedule.usage_unlock || 0) + usageUnlock),
        consistency_unlock: round2((schedule.consistency_unlock || 0) + consistUnlock),
        unlock_history: unlockEvents,
        next_unlock_at: remainingLocked > 0.01 ? new Date(now.getTime() + 7 * 86400000).toISOString() : null,
        updated_at: now.toISOString(),
      }).eq("id", schedule.id);

      // Notify user
      if (totalNewUnlock > 0) {
        await supabase.from("notifications").insert({
          user_id: schedule.user_id,
          type: "system",
          title: "🌟 Phần thưởng Ánh Sáng đang mở dần",
          message: `Bạn đã mở thêm ${totalNewUnlock.toLocaleString()} FUN. ${remainingLocked > 0.01 ? `Còn ${round2(remainingLocked).toLocaleString()} FUN đang mở dần.` : "Tất cả phần thưởng đã sẵn sàng sử dụng!"}`,
        });
      }

      totalUnlocked += totalNewUnlock;
      processed++;
    }

    console.log(`[vesting-release] ✅ Processed ${processed} schedules, unlocked ${totalUnlocked} FUN total`);

    return jsonResp({
      success: true,
      processed,
      total_unlocked: totalUnlocked,
    });
  } catch (err: any) {
    console.error("[vesting-release] Error:", err);
    return jsonResp({ error: err.message }, 500);
  }
});

function round2(n: number): number { return Math.round(n * 100) / 100; }

function jsonResp(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
