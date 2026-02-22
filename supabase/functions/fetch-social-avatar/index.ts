import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractOgImage(html: string): string | null {
  const ogMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
  );
  if (ogMatch?.[1]) return ogMatch[1];

  const twitterMatch = html.match(
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i
  );
  if (twitterMatch?.[1]) return twitterMatch[1];

  return null;
}

function extractAvatarFromHtml(html: string): string | null {
  // Look for img tags with avatar/profile related classes or IDs
  const patterns = [
    /<img[^>]*class=["'][^"']*(?:avatar|profile[-_]?(?:img|image|pic|photo))[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*(?:avatar|profile[-_]?(?:img|image|pic|photo))[^"']*["']/i,
    /<img[^>]*id=["'][^"']*(?:avatar|profile)[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*alt=["'][^"']*(?:avatar|profile|user)[^"']*["'][^>]*src=["']([^"']+)["']/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1] && !isJunkImage(match[1])) {
      return match[1];
    }
  }
  return null;
}

function isJunkImage(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("favicon") ||
         lower.endsWith(".ico") ||
         lower.includes("/img/t_logo") ||
         lower.includes("static/images/logo") ||
         lower.includes("default_profile") ||
         lower.includes("placeholder") ||
         lower.includes("default-user") ||
         lower.includes("no-photo");
}

// Improved username extraction with YouTube-specific handling
function extractUsername(url: string, platform: string): string | null {
  try {
    const u = new URL(url);
    const pathname = u.pathname.replace(/\/+$/, "");

    if (platform === "youtube") {
      // Handle /@handle format
      const handleMatch = pathname.match(/^\/@([^/]+)/);
      if (handleMatch) return handleMatch[1];
      // Handle /channel/UCxxxx
      const channelMatch = pathname.match(/^\/channel\/([^/]+)/);
      if (channelMatch) return channelMatch[1];
      // Handle /c/customname
      const customMatch = pathname.match(/^\/c\/([^/]+)/);
      if (customMatch) return customMatch[1];
      // Handle /user/username
      const userMatch = pathname.match(/^\/user\/([^/]+)/);
      if (userMatch) return userMatch[1];
    }

    if (platform === "facebook") {
      // Handle /profile.php?id=123456
      const idParam = u.searchParams.get("id");
      if (idParam) return idParam;
    }

    const path = pathname.split("/").filter(Boolean).pop();
    return path && path.length > 0 ? path : null;
  } catch {
    return null;
  }
}

const unavatarMap: Record<string, string> = {
  facebook: "facebook",
  twitter: "twitter",
  youtube: "youtube",
  telegram: "telegram",
  tiktok: "tiktok",
  linkedin: "linkedin",
};

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
];

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function scrapeOgAndAvatar(url: string, userAgent: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!response.ok) return null;
    const html = await response.text();
    const ogImage = extractOgImage(html);
    if (ogImage && !isJunkImage(ogImage)) return ogImage;
    // Fallback: look for avatar img tags in HTML
    return extractAvatarFromHtml(html);
  } catch (e) {
    console.log(`Scrape failed for ${url}:`, e.message);
    return null;
  }
}

// ========== Platform-specific strategies ==========

async function fetchFacebookAvatar(url: string): Promise<string | null> {
  const username = extractUsername(url, "facebook");
  if (!username) return null;

  // Strategy 1: Facebook Graph API (public, no token needed for profile pics)
  try {
    const graphUrl = `https://graph.facebook.com/${username}/picture?type=large&redirect=false`;
    const res = await fetchWithTimeout(graphUrl, {}, 5000);
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.url && !data?.data?.is_silhouette) {
        console.log(`[facebook] Graph API success for ${username}`);
        return data.data.url;
      }
    }
  } catch (e) {
    console.log(`[facebook] Graph API failed for ${username}:`, e.message);
  }

  // Strategy 2: unavatar.io
  try {
    const unavatarUrl = `https://unavatar.io/facebook/${username}`;
    const res = await fetchWithTimeout(unavatarUrl, { method: "HEAD", redirect: "follow" }, 5000);
    if (res.ok && (res.headers.get("content-type") || "").startsWith("image/")) {
      console.log(`[facebook] unavatar.io success for ${username}`);
      return unavatarUrl;
    }
  } catch (e) {
    console.log(`[facebook] unavatar.io failed:`, e.message);
  }

  // Strategy 3: Scrape Facebook profile page for og:image
  for (const ua of USER_AGENTS) {
    const result = await scrapeOgAndAvatar(url, ua);
    if (result) {
      console.log(`[facebook] og:image scrape success`);
      return result;
    }
  }

  return null;
}

async function fetchYoutubeAvatar(url: string): Promise<string | null> {
  const username = extractUsername(url, "youtube");
  if (!username) return null;

  // Strategy 1: unavatar.io with cleaned handle (no @)
  const cleanHandle = username.replace(/^@/, "");
  try {
    const unavatarUrl = `https://unavatar.io/youtube/${cleanHandle}`;
    const res = await fetchWithTimeout(unavatarUrl, { method: "HEAD", redirect: "follow" }, 5000);
    if (res.ok && (res.headers.get("content-type") || "").startsWith("image/")) {
      console.log(`[youtube] unavatar.io success for ${cleanHandle}`);
      return unavatarUrl;
    }
  } catch (e) {
    console.log(`[youtube] unavatar.io failed for ${cleanHandle}:`, e.message);
  }

  // Strategy 2: Scrape YouTube page for og:image
  const result = await scrapeOgAndAvatar(url, USER_AGENTS[0]);
  if (result) {
    console.log(`[youtube] og:image scrape success`);
    return result;
  }

  return null;
}

async function fetchFunProfileAvatar(url: string): Promise<string | null> {
  // Strategy 1: og:image scrape
  let result = await scrapeOgAndAvatar(url, USER_AGENTS[0]);
  if (result) {
    console.log(`[funprofile] og:image success`);
    return result;
  }

  // Strategy 2: Retry with different User-Agent
  result = await scrapeOgAndAvatar(url, USER_AGENTS[1]);
  if (result) {
    console.log(`[funprofile] og:image success (retry)`);
    return result;
  }

  return null;
}

async function fetchAngelAiAvatar(url: string): Promise<string | null> {
  // Strategy 1: og:image scrape
  let result = await scrapeOgAndAvatar(url, USER_AGENTS[0]);
  if (result) {
    console.log(`[angelai] og:image success`);
    return result;
  }

  // Strategy 2: Retry with different User-Agent
  result = await scrapeOgAndAvatar(url, USER_AGENTS[1]);
  if (result) {
    console.log(`[angelai] og:image success (retry)`);
    return result;
  }

  return null;
}

async function fetchGenericAvatar(platform: string, url: string): Promise<string | null> {
  const username = extractUsername(url, platform);

  // 1. Try unavatar.io proxy
  if (username && unavatarMap[platform]) {
    try {
      const unavatarUrl = `https://unavatar.io/${unavatarMap[platform]}/${username}`;
      const res = await fetchWithTimeout(unavatarUrl, { method: "HEAD", redirect: "follow" }, 5000);
      if (res.ok && (res.headers.get("content-type") || "").startsWith("image/")) {
        return unavatarUrl;
      }
    } catch (e) {
      console.log(`[${platform}] unavatar.io failed:`, e.message);
    }
  }

  // 2. Fallback: scrape og:image
  return await scrapeOgAndAvatar(url, USER_AGENTS[0]);
}

// ========== Main dispatcher ==========

async function fetchAvatarForPlatform(platform: string, url: string): Promise<string | null> {
  console.log(`[fetch-avatar] Processing ${platform}: ${url}`);
  
  try {
    switch (platform) {
      case "facebook":
        return await fetchFacebookAvatar(url);
      case "youtube":
        return await fetchYoutubeAvatar(url);
      case "funprofile":
      case "funplay":
        return await fetchFunProfileAvatar(url);
      case "angelai":
        return await fetchAngelAiAvatar(url);
      default:
        return await fetchGenericAvatar(platform, url);
    }
  } catch (e) {
    console.error(`[fetch-avatar] Unexpected error for ${platform}:`, e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, platforms, manualAvatars = [] } = await req.json();

    if (!userId || !platforms || typeof platforms !== "object") {
      return new Response(
        JSON.stringify({ error: "userId and platforms object required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read existing social_avatars to preserve manual ones
    const { data: profile } = await supabase
      .from("profiles")
      .select("social_avatars")
      .eq("id", userId)
      .maybeSingle();

    const existingAvatars: Record<string, string | null> = (profile?.social_avatars as Record<string, string | null>) || {};
    const manualSet = new Set(Array.isArray(manualAvatars) ? manualAvatars : []);

    const avatars: Record<string, string | null> = { ...existingAvatars };

    // Only auto-fetch for platforms NOT manually set
    const promises = Object.entries(platforms).map(async ([platform, url]) => {
      if (manualSet.has(platform)) {
        console.log(`[fetch-avatar] Skipping ${platform} (manual avatar set)`);
        return;
      }
      if (!url || typeof url !== "string") {
        avatars[platform] = existingAvatars[platform] || null;
        return;
      }
      const fetched = await fetchAvatarForPlatform(platform, url as string);
      if (fetched) {
        avatars[platform] = fetched;
      }
      // If fetch failed, keep existing avatar
    });

    await Promise.all(promises);

    console.log(`[fetch-avatar] Results for ${userId}:`, JSON.stringify(avatars));

    // Save merged avatars
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ social_avatars: avatars })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update social_avatars:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, avatars }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
