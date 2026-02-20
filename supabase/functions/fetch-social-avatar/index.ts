import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Platform-specific OG image extractors
function extractOgImage(html: string): string | null {
  // Try og:image first
  const ogMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
  );
  if (ogMatch?.[1]) return ogMatch[1];

  // Try twitter:image
  const twitterMatch = html.match(
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i
  );
  if (twitterMatch?.[1]) return twitterMatch[1];

  return null;
}

// Filter out junk images (favicons, generic logos, placeholders)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, platforms } = await req.json();

    if (!userId || !platforms || typeof platforms !== "object") {
      return new Response(
        JSON.stringify({ error: "userId and platforms object required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const avatars: Record<string, string | null> = {};

    // Process each platform URL
    for (const [platform, url] of Object.entries(platforms)) {
      if (!url || typeof url !== "string") {
        avatars[platform] = null;
        continue;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
          },
          signal: controller.signal,
          redirect: "follow",
        });

        clearTimeout(timeout);

        if (!response.ok) {
          avatars[platform] = null;
          continue;
        }

        const html = await response.text();
        const ogImage = extractOgImage(html);

        // Only save real profile images, not favicons or generic logos
        avatars[platform] = ogImage && !isJunkImage(ogImage) ? ogImage : null;
      } catch (e) {
        console.log(`Failed to fetch ${platform} (${url}):`, e.message);
        avatars[platform] = null;
      }
    }

    // Save to profiles.social_avatars
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
