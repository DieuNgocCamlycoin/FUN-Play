/**
 * Epoch Micro Preview — Daily job
 * 
 * Computes 7-day rolling preview scores for all active users.
 * No mint, just preview for user dashboard + early anomaly detection.
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
    const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const epochId = `micro_${windowStart.toISOString().slice(0, 10)}_${now.toISOString().slice(0, 10)}`;

    console.log(`[micro-preview] Computing 7-day preview: ${epochId}`);

    // Get active users with PPLP events in last 7 days
    const { data: activeUsers } = await supabase
      .from("pplp_events")
      .select("actor_user_id")
      .gte("occurred_at", windowStart.toISOString())
      .limit(1000);

    if (!activeUsers?.length) {
      return jsonResp({ message: "No active users in 7-day window", processed: 0 });
    }

    const uniqueUserIds = [...new Set(activeUsers.map(e => e.actor_user_id))];
    console.log(`[micro-preview] ${uniqueUserIds.length} active users found`);

    let processed = 0;
    const anomalies: string[] = [];

    for (const userId of uniqueUserIds) {
      // Count events by type in window
      const { count: eventCount } = await supabase
        .from("pplp_events")
        .select("*", { count: "exact", head: true })
        .eq("actor_user_id", userId)
        .gte("occurred_at", windowStart.toISOString());

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("light_score, light_level, consistency_days, created_at, banned")
        .eq("id", userId)
        .single();

      if (!profile || profile.banned) continue;

      // Get distinct active days
      const { data: activeDays } = await supabase
        .from("pplp_events")
        .select("occurred_at")
        .eq("actor_user_id", userId)
        .gte("occurred_at", windowStart.toISOString());

      const distinctDays = new Set(
        (activeDays || []).map(e => e.occurred_at?.slice(0, 10))
      ).size;

      const consistencyFactor = distinctDays / 7;

      // Preview score = light_score * consistency
      const previewScore = (profile.light_score || 0) * consistencyFactor;

      // Anomaly detection: sudden spike
      if (eventCount && eventCount > 50) {
        anomalies.push(`${userId}: ${eventCount} events in 7d (spike)`);
      }

      // Upsert preview score
      await supabase
        .from("user_epoch_scores")
        .upsert({
          user_id: userId,
          epoch_id: epochId,
          preview_score: Math.round(previewScore * 100) / 100,
          consistency_factor: Math.round(consistencyFactor * 10000) / 10000,
          trust_band: classifyBand(profile),
          updated_at: now.toISOString(),
        }, { onConflict: "user_id,epoch_id" });

      processed++;
    }

    // Log anomalies
    if (anomalies.length > 0) {
      console.warn(`[micro-preview] ⚠️ Anomalies:`, anomalies);
    }

    return jsonResp({
      success: true,
      epoch_id: epochId,
      processed,
      anomalies: anomalies.length,
      window: { start: windowStart.toISOString(), end: now.toISOString() },
    });
  } catch (err: any) {
    console.error("[micro-preview] Error:", err);
    return jsonResp({ error: err.message }, 500);
  }
});

function classifyBand(profile: any): string {
  const ageDays = profile.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
    : 0;
  const consistency = profile.consistency_days || 0;
  const score = profile.light_score || 0;
  if (ageDays >= 180 && consistency >= 60 && score >= 500) return "veteran";
  if (ageDays >= 90 && consistency >= 30 && score >= 200) return "trusted";
  if (ageDays >= 30 && consistency >= 7) return "standard";
  return "new";
}

function jsonResp(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
