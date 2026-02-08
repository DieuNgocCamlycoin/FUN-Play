import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

/* ───────── helpers ───────── */

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonOk(body: Record<string, unknown>, extra?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function jsonError(
  status: number,
  message: string,
  extra?: HeadersInit,
) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

/* ───────── supabase service client ───────── */

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/* ───────── auth & rate-limit ───────── */

interface ApiKeyRow {
  id: string;
  platform_name: string;
  is_active: boolean;
  rate_limit_per_minute: number;
}

async function authenticateApiKey(
  apiKey: string,
  supabase: ReturnType<typeof createClient>,
): Promise<ApiKeyRow | null> {
  const hash = await sha256(apiKey);
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, platform_name, is_active, rate_limit_per_minute")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  // update last_used_at (fire-and-forget)
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then();

  return data as ApiKeyRow;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

async function checkRateLimit(
  apiKeyId: string,
  limitPerMinute: number,
  supabase: ReturnType<typeof createClient>,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60_000); // 1 minute ago

  // Fetch current window
  const { data: existing } = await supabase
    .from("api_rate_limits")
    .select("id, window_start, request_count")
    .eq("api_key_id", apiKeyId)
    .gte("window_start", windowStart.toISOString())
    .order("window_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (existing.request_count >= limitPerMinute) {
      const resetAt = new Date(
        new Date(existing.window_start).getTime() + 60_000,
      ).toISOString();
      return { allowed: false, remaining: 0, resetAt };
    }
    // increment
    await supabase
      .from("api_rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("id", existing.id);

    const remaining = limitPerMinute - existing.request_count - 1;
    const resetAt = new Date(
      new Date(existing.window_start).getTime() + 60_000,
    ).toISOString();
    return { allowed: true, remaining, resetAt };
  }

  // create new window
  await supabase.from("api_rate_limits").insert({
    api_key_id: apiKeyId,
    window_start: now.toISOString(),
    request_count: 1,
  });

  return {
    allowed: true,
    remaining: limitPerMinute - 1,
    resetAt: new Date(now.getTime() + 60_000).toISOString(),
  };
}

/* ───────── action handlers ───────── */

async function listVideos(
  params: URLSearchParams,
  supabase: ReturnType<typeof createClient>,
) {
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(params.get("limit") || "20")));
  const category = params.get("category");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("videos")
    .select(
      "id, title, description, thumbnail_url, video_url, duration, view_count, like_count, category, created_at, channel_id, user_id",
      { count: "exact" },
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);

  const { data: videos, count, error } = await query;
  if (error) throw error;

  const enriched = await enrichVideos(videos || [], supabase);

  return {
    videos: enriched,
    pagination: {
      page,
      limit,
      total: count || 0,
      has_more: offset + limit < (count || 0),
    },
  };
}

async function getVideo(
  params: URLSearchParams,
  supabase: ReturnType<typeof createClient>,
) {
  const videoId = params.get("video_id");
  if (!videoId) throw new Error("video_id is required");

  const { data, error } = await supabase
    .from("videos")
    .select(
      "id, title, description, thumbnail_url, video_url, duration, view_count, like_count, category, created_at, channel_id, user_id",
    )
    .eq("id", videoId)
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Video not found or not public");

  const enriched = await enrichVideos([data], supabase);
  return { video: enriched[0] };
}

async function getUserVideos(
  params: URLSearchParams,
  supabase: ReturnType<typeof createClient>,
) {
  const userId = params.get("user_id");
  if (!userId) throw new Error("user_id is required");

  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(params.get("limit") || "20")));
  const category = params.get("category");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("videos")
    .select(
      "id, title, description, thumbnail_url, video_url, duration, view_count, like_count, category, created_at, channel_id, user_id",
      { count: "exact" },
    )
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);

  const { data: videos, count, error } = await query;
  if (error) throw error;

  const enriched = await enrichVideos(videos || [], supabase);

  return {
    videos: enriched,
    pagination: {
      page,
      limit,
      total: count || 0,
      has_more: offset + limit < (count || 0),
    },
  };
}

async function getUserProfile(
  params: URLSearchParams,
  supabase: ReturnType<typeof createClient>,
) {
  const userId = params.get("user_id");
  if (!userId) throw new Error("user_id is required");

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (pErr) throw pErr;
  if (!profile) throw new Error("User not found");

  const { data: channel } = await supabase
    .from("channels")
    .select("id, name, description, subscriber_count, is_verified, banner_url")
    .eq("user_id", userId)
    .maybeSingle();

  const { count: videoCount } = await supabase
    .from("videos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_public", true);

  return {
    user: profile,
    channel: channel || null,
    stats: {
      public_video_count: videoCount || 0,
    },
  };
}

/* ───────── enrich helpers ───────── */

async function enrichVideos(
  videos: Array<Record<string, unknown>>,
  supabase: ReturnType<typeof createClient>,
) {
  if (videos.length === 0) return [];

  const userIds = [...new Set(videos.map((v) => v.user_id as string))];
  const channelIds = [...new Set(videos.map((v) => v.channel_id as string))];

  const [profilesRes, channelsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds),
    supabase
      .from("channels")
      .select("id, name")
      .in("id", channelIds),
  ]);

  const profileMap = new Map(
    (profilesRes.data || []).map((p) => [p.id, p]),
  );
  const channelMap = new Map(
    (channelsRes.data || []).map((c) => [c.id, c]),
  );

  return videos.map((v) => {
    const { user_id, channel_id, ...rest } = v;
    return {
      ...rest,
      channel: channelMap.get(channel_id as string) || null,
      user: profileMap.get(user_id as string) || null,
    };
  });
}

/* ───────── main handler ───────── */

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonError(405, "Method not allowed. Use GET.");
  }

  try {
    const supabase = getServiceClient();

    // 1. Authenticate
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return jsonError(401, "Missing X-API-Key header");
    }

    const keyRow = await authenticateApiKey(apiKey, supabase);
    if (!keyRow) {
      return jsonError(401, "Invalid or inactive API key");
    }

    // 2. Rate limit
    const rl = await checkRateLimit(keyRow.id, keyRow.rate_limit_per_minute, supabase);
    const rlHeaders: Record<string, string> = {
      "X-RateLimit-Limit": String(keyRow.rate_limit_per_minute),
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Reset": rl.resetAt,
    };

    if (!rl.allowed) {
      return jsonError(429, "Rate limit exceeded. Try again later.", rlHeaders);
    }

    // 3. Route action
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    let data: unknown;

    switch (action) {
      case "list_videos":
        data = await listVideos(url.searchParams, supabase);
        break;
      case "get_video":
        data = await getVideo(url.searchParams, supabase);
        break;
      case "get_user_videos":
        data = await getUserVideos(url.searchParams, supabase);
        break;
      case "get_user_profile":
        data = await getUserProfile(url.searchParams, supabase);
        break;
      default:
        return jsonError(
          400,
          "Invalid action. Supported: list_videos, get_video, get_user_videos, get_user_profile",
          rlHeaders,
        );
    }

    console.log(
      `[public-video-api] platform=${keyRow.platform_name} action=${action} remaining=${rl.remaining}`,
    );

    return jsonOk({ success: true, data }, rlHeaders);
  } catch (err) {
    console.error("[public-video-api] Error:", err);
    return jsonError(500, err instanceof Error ? err.message : "Internal server error");
  }
});
