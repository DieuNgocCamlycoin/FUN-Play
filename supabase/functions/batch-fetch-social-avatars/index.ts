import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const socialFields = [
  { key: "facebook", field: "facebook_url" },
  { key: "youtube", field: "youtube_url" },
  { key: "twitter", field: "twitter_url" },
  { key: "telegram", field: "telegram_url" },
  { key: "tiktok", field: "tiktok_url" },
  { key: "linkedin", field: "linkedin_url" },
  { key: "zalo", field: "zalo_url" },
  { key: "funplay", field: "funplay_url" },
  { key: "angelai", field: "angelai_url" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse forceRefresh from request body
    const body = await req.json().catch(() => ({}));
    const forceRefresh = body?.forceRefresh === true;
    const offset = typeof body?.offset === "number" ? body.offset : 0;
    const batchSize = typeof body?.batchSize === "number" ? body.batchSize : 50;

    console.log(`[batch] forceRefresh=${forceRefresh}, offset=${offset}, batchSize=${batchSize}`);

    // Fetch profiles that have at least one social URL
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, facebook_url, youtube_url, twitter_url, telegram_url, tiktok_url, linkedin_url, zalo_url, funplay_url, angelai_url, social_avatars")
      .order("created_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) throw error;

    let processed = 0;
    let skipped = 0;

    for (const profile of (profiles || [])) {
      const existingAvatars = (profile.social_avatars as Record<string, string | null>) || {};
      
      const platformsToFetch: Record<string, string> = {};

      for (const { key, field } of socialFields) {
        const url = (profile as any)[field];
        if (!url) continue;

        const existingAvatar = existingAvatars[key];

        // Detect manual uploads (R2 storage URLs) - always protect these
        const isManual = existingAvatar && (
          existingAvatar.includes("social-avatars/") ||
          existingAvatar.includes("r2.dev")
        );

        if (isManual) continue;

        if (forceRefresh || !existingAvatar) {
          platformsToFetch[key] = url;
        }
      }

      if (Object.keys(platformsToFetch).length === 0) {
        skipped++;
        continue;
      }

      // Call fetch-social-avatar for this user
      try {
        const fetchUrl = `${supabaseUrl}/functions/v1/fetch-social-avatar`;
        await fetch(fetchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            userId: profile.id,
            platforms: platformsToFetch,
          }),
        });
        processed++;
        console.log(`[batch] Processed ${profile.id}: ${Object.keys(platformsToFetch).join(", ")}`);
      } catch (e) {
        console.error(`[batch] Failed for ${profile.id}:`, e.message);
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    return new Response(
      JSON.stringify({ 
        success: true, processed, skipped, 
        total: profiles?.length || 0,
        offset,
        nextOffset: (profiles?.length || 0) === batchSize ? offset + batchSize : null,
        hasMore: (profiles?.length || 0) === batchSize,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Batch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
