import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_EVENT_TYPES = [
  "LOGIN", "LIGHT_CHECKIN", "PROFILE_COMPLETED", "PPLP_ACCEPTED", "MANTRA_ACK",
  "POST_CREATED", "COMMENT_CREATED", "VIDEO_UPLOADED", "COURSE_PUBLISHED",
  "LIKE_GIVEN", "SHARE_GIVEN", "BOOKMARK_GIVEN",
  "HELP_NEWBIE", "ANSWER_QUESTION", "MENTOR_SESSION",
  "REPORT_SUBMITTED", "MEDIATION_JOINED", "RESOLUTION_ACCEPTED",
  "DONATION_MADE", "REWARD_SENT", "GOV_VOTE_CAST",
  "BUG_REPORTED", "PR_MERGED", "PROPOSAL_SUBMITTED",
  "ONCHAIN_TX_VERIFIED", "PPLP_RATING_SUBMITTED",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Parse body
    const body = await req.json();
    const events: Array<{
      event_type: string;
      target_type?: string;
      target_id?: string;
      context_id?: string;
      payload_json?: Record<string, unknown>;
      source?: string;
      scoring_tags?: string[];
    }> = Array.isArray(body) ? body : [body];

    if (events.length === 0 || events.length > 50) {
      return new Response(
        JSON.stringify({ error: "Must send 1-50 events" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate & build rows
    const rows = [];
    for (const evt of events) {
      if (!evt.event_type || !VALID_EVENT_TYPES.includes(evt.event_type)) {
        return new Response(
          JSON.stringify({ error: `Invalid event_type: ${evt.event_type}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Simple dedup hash: user + type + target + minute-bucket
      const minuteBucket = Math.floor(Date.now() / 60000);
      const hashInput = `${userId}:${evt.event_type}:${evt.target_id || ""}:${minuteBucket}`;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(hashInput));
      const ingestHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 32);

      rows.push({
        actor_user_id: userId,
        event_type: evt.event_type,
        target_type: evt.target_type || null,
        target_id: evt.target_id || null,
        context_id: evt.context_id || null,
        payload_json: evt.payload_json || null,
        source: evt.source || "web",
        scoring_tags: evt.scoring_tags || null,
        ingest_hash: ingestHash,
        occurred_at: new Date().toISOString(),
      });
    }

    // Insert using service role for writing
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabaseAdmin
      .from("pplp_events")
      .upsert(rows, { onConflict: "ingest_hash", ignoreDuplicates: true })
      .select("event_id");

    if (error) {
      console.error("[ingest-pplp-event] DB error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to ingest events", detail: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, ingested: data?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[ingest-pplp-event] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
