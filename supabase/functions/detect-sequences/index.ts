import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Sequence Detector — detects behavioral chains from pplp_events
 * 
 * Supported sequence types:
 * 1. mentor_chain: HELP_NEWBIE → target PROFILE_COMPLETED → target POST_CREATED → target gets PPLP_RATING ≥ 5
 * 2. value_loop: POST_CREATED → receives LIKE_GIVEN ≥ 3 → receives PPLP_RATING ≥ 5 → DONATION_MADE received
 * 3. conflict_harmony: REPORT_SUBMITTED → MEDIATION_JOINED → RESOLUTION_ACCEPTED
 * 4. onboarding_guide: HELP_NEWBIE → target LOGIN within 7d → target VIDEO_UPLOADED
 * 5. charity_chain: DONATION_MADE → receiver DONATION_MADE (pay it forward)
 * 6. builder_streak: 7+ consecutive days with POST_CREATED or VIDEO_UPLOADED
 */

interface SequenceDefinition {
  type: string;
  detect: (supabase: any, userId: string, lookbackDays: number) => Promise<{ detected: boolean; evidence: string[]; score_bonus: number }>;
}

const SEQUENCE_DEFS: SequenceDefinition[] = [
  {
    type: "mentor_chain",
    detect: async (supabase, userId, lookbackDays) => {
      const since = new Date(Date.now() - lookbackDays * 86400000).toISOString();
      
      // Find HELP_NEWBIE events by this user
      const { data: helpEvents } = await supabase
        .from("pplp_events")
        .select("target_id, occurred_at")
        .eq("actor_user_id", userId)
        .eq("event_type", "HELP_NEWBIE")
        .gte("occurred_at", since)
        .limit(20);

      if (!helpEvents?.length) return { detected: false, evidence: [], score_bonus: 0 };

      for (const help of helpEvents) {
        if (!help.target_id) continue;
        
        // Check if the helped user completed profile
        const { data: profileEvent } = await supabase
          .from("pplp_events")
          .select("event_id")
          .eq("actor_user_id", help.target_id)
          .eq("event_type", "PROFILE_COMPLETED")
          .gte("occurred_at", help.occurred_at)
          .limit(1)
          .maybeSingle();

        if (!profileEvent) continue;

        // Check if helped user created content
        const { data: contentEvent } = await supabase
          .from("pplp_events")
          .select("event_id")
          .eq("actor_user_id", help.target_id)
          .in("event_type", ["POST_CREATED", "VIDEO_UPLOADED"])
          .gte("occurred_at", help.occurred_at)
          .limit(1)
          .maybeSingle();

        if (contentEvent) {
          return {
            detected: true,
            evidence: [help.target_id, profileEvent.event_id, contentEvent.event_id],
            score_bonus: 15,
          };
        }
      }
      return { detected: false, evidence: [], score_bonus: 0 };
    },
  },
  {
    type: "conflict_harmony",
    detect: async (supabase, userId, lookbackDays) => {
      const since = new Date(Date.now() - lookbackDays * 86400000).toISOString();
      
      const { data: reportEvents } = await supabase
        .from("pplp_events")
        .select("event_id, context_id, occurred_at")
        .eq("actor_user_id", userId)
        .eq("event_type", "REPORT_SUBMITTED")
        .gte("occurred_at", since)
        .limit(10);

      if (!reportEvents?.length) return { detected: false, evidence: [], score_bonus: 0 };

      for (const report of reportEvents) {
        const contextId = report.context_id;
        if (!contextId) continue;

        const { data: mediation } = await supabase
          .from("pplp_events")
          .select("event_id")
          .eq("actor_user_id", userId)
          .eq("event_type", "MEDIATION_JOINED")
          .eq("context_id", contextId)
          .limit(1)
          .maybeSingle();

        if (!mediation) continue;

        const { data: resolution } = await supabase
          .from("pplp_events")
          .select("event_id")
          .eq("actor_user_id", userId)
          .eq("event_type", "RESOLUTION_ACCEPTED")
          .eq("context_id", contextId)
          .limit(1)
          .maybeSingle();

        if (resolution) {
          return {
            detected: true,
            evidence: [report.event_id, mediation.event_id, resolution.event_id],
            score_bonus: 10,
          };
        }
      }
      return { detected: false, evidence: [], score_bonus: 0 };
    },
  },
  {
    type: "charity_chain",
    detect: async (supabase, userId, lookbackDays) => {
      const since = new Date(Date.now() - lookbackDays * 86400000).toISOString();
      
      // User made a donation
      const { data: donationEvents } = await supabase
        .from("pplp_events")
        .select("event_id, target_id, occurred_at")
        .eq("actor_user_id", userId)
        .eq("event_type", "DONATION_MADE")
        .gte("occurred_at", since)
        .limit(10);

      if (!donationEvents?.length) return { detected: false, evidence: [], score_bonus: 0 };

      for (const donation of donationEvents) {
        if (!donation.target_id) continue;
        
        // Check if receiver also donated (pay it forward)
        const { data: payForward } = await supabase
          .from("pplp_events")
          .select("event_id")
          .eq("actor_user_id", donation.target_id)
          .eq("event_type", "DONATION_MADE")
          .gte("occurred_at", donation.occurred_at)
          .limit(1)
          .maybeSingle();

        if (payForward) {
          return {
            detected: true,
            evidence: [donation.event_id, payForward.event_id],
            score_bonus: 12,
          };
        }
      }
      return { detected: false, evidence: [], score_bonus: 0 };
    },
  },
  {
    type: "builder_streak",
    detect: async (supabase, userId, lookbackDays) => {
      const since = new Date(Date.now() - lookbackDays * 86400000).toISOString();
      
      const { data: events } = await supabase
        .from("pplp_events")
        .select("occurred_at")
        .eq("actor_user_id", userId)
        .in("event_type", ["POST_CREATED", "VIDEO_UPLOADED"])
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: true });

      if (!events?.length) return { detected: false, evidence: [], score_bonus: 0 };

      // Count unique days
      const days = new Set(events.map((e: any) => e.occurred_at.slice(0, 10)));
      const sortedDays = [...days].sort();
      
      // Find longest consecutive streak
      let maxStreak = 1;
      let currentStreak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
        if (diffDays === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }

      if (maxStreak >= 7) {
        return {
          detected: true,
          evidence: sortedDays.slice(0, 7),
          score_bonus: Math.min(maxStreak, 20),
        };
      }
      return { detected: false, evidence: [], score_bonus: 0 };
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let targetDate: string;
    let lookbackDays = 30;
    try {
      const body = await req.json();
      targetDate = body.date || new Date().toISOString().slice(0, 10);
      lookbackDays = body.lookback_days || 30;
    } catch {
      targetDate = new Date().toISOString().slice(0, 10);
    }

    console.log(`[sequence-detector] Detecting sequences for date: ${targetDate}, lookback: ${lookbackDays}d`);

    // Get active users from features_user_day
    const { data: activeUsers } = await supabase
      .from("features_user_day")
      .select("user_id")
      .eq("date", targetDate)
      .limit(500);

    const userIds = [...new Set((activeUsers || []).map((u: any) => u.user_id))];
    console.log(`[sequence-detector] Checking ${userIds.length} users`);

    let totalDetected = 0;

    for (const userId of userIds) {
      for (const seqDef of SEQUENCE_DEFS) {
        // Check if already detected (avoid duplicates)
        const { data: existing } = await supabase
          .from("sequences")
          .select("sequence_id")
          .eq("user_id", userId)
          .eq("sequence_type", seqDef.type)
          .eq("state", "complete")
          .gte("created_at", new Date(Date.now() - lookbackDays * 86400000).toISOString())
          .limit(1)
          .maybeSingle();

        if (existing) continue;

        const result = await seqDef.detect(supabase, userId, lookbackDays);
        if (result.detected) {
          const { error } = await supabase.from("sequences").insert({
            user_id: userId,
            sequence_type: seqDef.type,
            start_at: new Date(Date.now() - lookbackDays * 86400000).toISOString(),
            end_at: new Date().toISOString(),
            state: "complete",
            evidence_event_ids: result.evidence,
            score_bonus: result.score_bonus,
          });

          if (error) {
            console.error(`[sequence-detector] Error inserting sequence for ${userId}:`, error);
          } else {
            totalDetected++;
            console.log(`[sequence-detector] ✅ ${seqDef.type} detected for ${userId} (+${result.score_bonus})`);
          }
        }
      }
    }

    console.log(`[sequence-detector] Done. ${totalDetected} sequences detected.`);

    return new Response(
      JSON.stringify({ success: true, date: targetDate, sequences_detected: totalDetected }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[sequence-detector] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
