import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse optional date, default to today
    let targetDate: string;
    try {
      const body = await req.json();
      targetDate = body.date || new Date().toISOString().slice(0, 10);
    } catch {
      targetDate = new Date().toISOString().slice(0, 10);
    }

    console.log(`[build-features] Building features for date: ${targetDate}`);

    // Get all users who had events on this date
    const { data: activeUsers, error: usersErr } = await supabase
      .from("pplp_events")
      .select("actor_user_id")
      .gte("occurred_at", `${targetDate}T00:00:00Z`)
      .lt("occurred_at", `${targetDate}T23:59:59Z`)
      .limit(1000);

    if (usersErr) {
      console.error("[build-features] Error fetching users:", usersErr);
      return new Response(JSON.stringify({ error: usersErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uniqueUserIds = [...new Set((activeUsers || []).map((e) => e.actor_user_id))];
    console.log(`[build-features] Found ${uniqueUserIds.length} active users`);

    let processed = 0;

    for (const userId of uniqueUserIds) {
      // Count events by type for this user on this date
      const { data: events } = await supabase
        .from("pplp_events")
        .select("event_type")
        .eq("actor_user_id", userId)
        .gte("occurred_at", `${targetDate}T00:00:00Z`)
        .lt("occurred_at", `${targetDate}T23:59:59Z`);

      if (!events || events.length === 0) continue;

      const counts: Record<string, number> = {};
      for (const e of events) {
        counts[e.event_type] = (counts[e.event_type] || 0) + 1;
      }

      // Get pplp ratings for this user's content on this date
      const { data: ratings } = await supabase
        .from("pplp_ratings")
        .select("pillar_truth, pillar_sustain, pillar_heal_love, pillar_life_service, pillar_unity_source, weight_applied")
        .eq("author_user_id", userId)
        .gte("created_at", `${targetDate}T00:00:00Z`)
        .lt("created_at", `${targetDate}T23:59:59Z`);

      let avgRatingWeighted = 0;
      let contentPillarScore = 0;
      const EPSILON = 1e-6;
      const GAMMA = 1.3;

      if (ratings && ratings.length > 0) {
        // Section 4: Content Pillar Score — weighted average per pillar
        const pillarKeys = ['pillar_truth', 'pillar_sustain', 'pillar_heal_love', 'pillar_life_service', 'pillar_unity_source'] as const;
        let pillarTotal = 0;

        for (const key of pillarKeys) {
          let num = 0, den = 0;
          for (const r of ratings) {
            const w = r.weight_applied || 1;
            num += w * (r[key] || 0);
            den += w;
          }
          pillarTotal += num / (den + EPSILON);
        }

        // Section 6: h(P_c) = (P_c/10)^γ with content type weights
        const contentCount = (counts["POST_CREATED"] || 0) * 1.0
          + (counts["VIDEO_UPLOADED"] || 0) * 1.5
          + (counts["COMMENT_CREATED"] || 0) * 0.4;
        contentPillarScore = Math.pow(Math.min(pillarTotal / 10, 1), GAMMA) * contentCount;
        contentPillarScore = Math.round(contentPillarScore * 10000) / 10000;

        // Legacy avg for backward compat
        let totalWeightedScore = 0, totalWeight = 0;
        for (const r of ratings) {
          const pillarSum = (r.pillar_truth || 0) + (r.pillar_sustain || 0) +
            (r.pillar_heal_love || 0) + (r.pillar_life_service || 0) +
            (r.pillar_unity_source || 0);
          const w = r.weight_applied || 1;
          totalWeightedScore += pillarSum * w;
          totalWeight += w;
        }
        avgRatingWeighted = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
      }

      // Check anti-farm signals
      const { data: signals } = await supabase
        .from("signals_anti_farm")
        .select("severity")
        .eq("user_id", userId)
        .eq("status", "confirmed");

      const antiFarmRisk = signals
        ? signals.reduce((sum, s) => sum + (s.severity || 0), 0) / Math.max(signals.length, 1)
        : 0;

      // Check daily checkin
      const { data: checkin } = await supabase
        .from("daily_checkins")
        .select("id")
        .eq("user_id", userId)
        .eq("checkin_date", targetDate)
        .maybeSingle();

      // Calculate consistency streak from previous features
      const { data: prevFeature } = await supabase
        .from("features_user_day")
        .select("consistency_streak")
        .eq("user_id", userId)
        .lt("date", targetDate)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const prevStreak = prevFeature?.consistency_streak || 0;
      const consistencyStreak = prevStreak + 1; // Increments since user was active today

      // Count sequences
      const { count: seqCount } = await supabase
        .from("sequences")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("state", "complete");

      // Upsert features_user_day
      const { error: upsertErr } = await supabase
        .from("features_user_day")
        .upsert({
          user_id: userId,
          date: targetDate,
          count_posts: counts["POST_CREATED"] || 0,
          count_comments: counts["COMMENT_CREATED"] || 0,
          count_videos: counts["VIDEO_UPLOADED"] || 0,
          count_likes_given: counts["LIKE_GIVEN"] || 0,
          count_shares: counts["SHARE_GIVEN"] || 0,
          count_help: (counts["HELP_NEWBIE"] || 0) + (counts["ANSWER_QUESTION"] || 0) + (counts["MENTOR_SESSION"] || 0),
          count_donations: counts["DONATION_MADE"] || 0,
          count_reports_valid: counts["REPORT_SUBMITTED"] || 0,
          avg_rating_weighted: Math.round(avgRatingWeighted * 100) / 100,
          content_pillar_score: contentPillarScore,
          consistency_streak: consistencyStreak,
          sequence_count: seqCount || 0,
          anti_farm_risk: Math.round(antiFarmRisk * 100) / 100,
          checkin_done: !!checkin,
          onchain_value_score: counts["ONCHAIN_TX_VERIFIED"] ? Math.min((counts["ONCHAIN_TX_VERIFIED"] || 0) * 10, 100) : 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,date" });

      if (upsertErr) {
        console.error(`[build-features] Error for user ${userId}:`, upsertErr);
      } else {
        processed++;
      }
    }

    console.log(`[build-features] Done. Processed ${processed}/${uniqueUserIds.length} users`);

    return new Response(
      JSON.stringify({ success: true, date: targetDate, users_processed: processed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[build-features] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
