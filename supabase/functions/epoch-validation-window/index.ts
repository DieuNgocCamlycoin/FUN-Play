/**
 * Epoch Validation Window — Daily job
 * 
 * Computes 14-day rolling validated scores with fraud/trust updates.
 * Anti-farming timing model: consistency, burst penalty, trust ramp, late-window suppression.
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
    const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lateWindowStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // last 48h
    const epochId = `validation_${windowStart.toISOString().slice(0, 10)}_${now.toISOString().slice(0, 10)}`;

    console.log(`[validation] Computing 14-day window: ${epochId}`);

    // Get users with activity in window
    const { data: activeEvents } = await supabase
      .from("pplp_events")
      .select("actor_user_id")
      .gte("occurred_at", windowStart.toISOString())
      .limit(1000);

    const uniqueUserIds = [...new Set((activeEvents || []).map(e => e.actor_user_id))];
    console.log(`[validation] ${uniqueUserIds.length} users to validate`);

    let processed = 0;

    for (const userId of uniqueUserIds) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, light_score, light_level, consistency_days, created_at, banned, suspicious_score")
        .eq("id", userId)
        .single();

      if (!profile || profile.banned) continue;

      // All events in window
      const { data: events } = await supabase
        .from("pplp_events")
        .select("event_type, occurred_at")
        .eq("actor_user_id", userId)
        .gte("occurred_at", windowStart.toISOString())
        .order("occurred_at", { ascending: true });

      if (!events?.length) continue;

      // --- Timing model calculations ---

      // Distinct active days
      const activeDays = new Set(events.map(e => e.occurred_at?.slice(0, 10))).size;
      const consistencyFactor = activeDays / 14;

      // Burst detection: most common event type count vs average
      const typeCounts: Record<string, number> = {};
      for (const e of events) {
        typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
      }
      const counts = Object.values(typeCounts);
      const maxCount = Math.max(...counts);
      const avgCount = counts.reduce((s, c) => s + c, 0) / counts.length;
      const burstRatio = maxCount / Math.max(1, avgCount);
      let burstPenalty = 1.0;
      if (burstRatio > 5) burstPenalty = 0.4;
      else if (burstRatio > 3) burstPenalty = 0.65;
      else if (burstRatio > 1.5) burstPenalty = 0.85;

      // Trust ramp
      const ageDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
      let trustRamp = 1.0;
      if (ageDays < 14) trustRamp = 0.3;
      else if (ageDays < 28) trustRamp = 0.5;
      else if (ageDays < 56) trustRamp = 0.75;

      // Late-window suppression
      const lateEvents = events.filter(e => new Date(e.occurred_at) >= lateWindowStart).length;
      const lateWindowPct = events.length > 0 ? lateEvents / events.length : 0;
      let lateSuppression = 1.0;
      if (lateWindowPct > 0.7) lateSuppression = 0.7;
      else if (lateWindowPct > 0.5) lateSuppression = 0.85;
      else if (lateWindowPct > 0.3) lateSuppression = 0.95;

      // Cross-window continuity (check previous epochs)
      const { count: prevEpochCount } = await supabase
        .from("user_epoch_scores")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const windowsCompleted = prevEpochCount || 0;
      const crossWindowBonus = Math.min(0.2, windowsCompleted * 0.04 * consistencyFactor);

      // Fraud factor
      const fraudFactor = Math.min(1, (profile.suspicious_score || 0) / 100);

      // Trust factor (inverse of fraud)
      const trustFactor = Math.max(0.1, 1 - fraudFactor * 0.8) * trustRamp;

      // Combined validated score
      const rawScore = profile.light_score || 0;
      const validatedScore = rawScore
        * consistencyFactor
        * burstPenalty
        * trustFactor
        * lateSuppression
        * (1 + crossWindowBonus);

      // Upsert
      await supabase
        .from("user_epoch_scores")
        .upsert({
          user_id: userId,
          epoch_id: epochId,
          validated_score: Math.round(validatedScore * 100) / 100,
          trust_factor: round4(trustFactor),
          fraud_factor: round4(fraudFactor),
          consistency_factor: round4(consistencyFactor),
          burst_penalty: round4(burstPenalty),
          trust_ramp: round4(trustRamp),
          cross_window_bonus: round4(crossWindowBonus),
          trust_band: classifyBand(ageDays, profile.consistency_days || 0, rawScore, fraudFactor),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,epoch_id" });

      processed++;
    }

    return jsonResp({
      success: true,
      epoch_id: epochId,
      processed,
      window: { start: windowStart.toISOString(), end: now.toISOString() },
    });
  } catch (err: any) {
    console.error("[validation] Error:", err);
    return jsonResp({ error: err.message }, 500);
  }
});

function classifyBand(ageDays: number, consistency: number, score: number, fraud: number): string {
  if (fraud > 0.3) return "new";
  if (ageDays >= 180 && consistency >= 60 && score >= 500) return "veteran";
  if (ageDays >= 90 && consistency >= 30 && score >= 200) return "trusted";
  if (ageDays >= 30 && consistency >= 7) return "standard";
  return "new";
}

function round4(n: number): number { return Math.round(n * 10000) / 10000; }

function jsonResp(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
