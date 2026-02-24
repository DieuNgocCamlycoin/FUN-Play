import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface MetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  audio?: string;
  video?: string;
}

function buildHtml(meta: MetaData): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:image" content="${meta.image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${meta.url}">
  <meta property="og:type" content="${meta.type}">
  <meta property="og:site_name" content="FUN Play">
  <meta property="og:locale" content="vi_VN">
  ${meta.audio ? `<meta property="og:audio" content="${meta.audio}">
  <meta property="og:audio:type" content="audio/mpeg">` : ""}
  ${meta.video ? `<meta property="og:video" content="${meta.video}">
  <meta property="og:video:type" content="video/mp4">` : ""}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@FunPlay">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  <meta name="twitter:image" content="${meta.image}">
  <link rel="icon" href="https://official-funplay.lovable.app/favicon.ico">
  <script>
    var botPattern = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|Pinterest|Googlebot|bingbot/i;
    if (!botPattern.test(navigator.userAgent)) {
      window.location.replace("${meta.url}");
    }
  </script>
  <noscript><meta http-equiv="refresh" content="0;url=${meta.url}"></noscript>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#0a0a1a,#1a1a2e);color:#fff;margin:0;padding:20px;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center}
    .c{max-width:600px}
    img{max-width:100%;border-radius:12px;margin-bottom:20px;box-shadow:0 10px 40px rgba(0,231,255,.2)}
    h1{font-size:1.5rem;margin-bottom:10px;background:linear-gradient(135deg,#00E7FF,#FF00E5);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    p{color:#a0a0a0;line-height:1.6}
    a{display:inline-block;margin-top:20px;padding:12px 24px;background:linear-gradient(135deg,#00E7FF,#0088cc);color:#fff;text-decoration:none;border-radius:8px;font-weight:600}
  </style>
</head>
<body>
  <div class="c">
    <img src="${meta.image}" alt="${escapeHtml(meta.title)}" />
    <h1>${escapeHtml(meta.title)}</h1>
    <p>${escapeHtml(meta.description)}</p>
    <a href="${meta.url}">Xem trên FUN Play</a>
  </div>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "";
    console.log("[prerender] path:", path);

    const baseUrl = "https://official-funplay.lovable.app";
    const siteUrl = "https://play.fun.rich";
    const defaultMeta: MetaData = {
      title: "FUN Play: Web3 AI Social",
      description: "The place where every soul turns value into digital assets forever – Rich Rich Rich",
      image: `${baseUrl}/images/funplay-og-image.jpg`,
      url: `${siteUrl}${path}`,
      type: "website",
    };

    // Parse path to determine content type
    let type: string | null = null;
    let id: string | null = null;
    let slugLookup: { username: string; slug: string } | null = null;

    if (path.startsWith("/ai-music/")) {
      type = "ai-music";
      id = path.replace("/ai-music/", "").split("?")[0];
    } else if (path.startsWith("/music/")) {
      type = "music";
      id = path.replace("/music/", "").split("?")[0];
    } else if (path.startsWith("/watch/")) {
      type = "video";
      id = path.replace("/watch/", "").split("?")[0];
    } else if (path.startsWith("/channel/")) {
      type = "channel";
      id = path.replace("/channel/", "").split("?")[0];
    } else {
      // Check for /{username}/{slug} format (video share URLs)
      const segments = path.replace(/^\//, "").split("/").filter(Boolean);
      if (segments.length === 2) {
        slugLookup = { username: segments[0], slug: segments[1] };
        type = "video-by-slug";
      }
    }

    if (!type || (!id && !slugLookup)) {
      console.log("[prerender] no type/id, returning default");
      const html = buildHtml(defaultMeta);
      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const meta = { ...defaultMeta };

    if (type === "ai-music") {
      console.log("[prerender] fetching ai-music:", id);
      const { data, error } = await supabase
        .from("ai_generated_music")
        .select("id, title, style, thumbnail_url, audio_url, play_count, lyrics")
        .eq("id", id)
        .single();

      if (!error && data) {
        meta.title = `${data.title} - Fun Music AI`;
        meta.description = `🎵 Nghe bài hát AI "${data.title}" (${data.style || "Music"}) trên FUN Play. ${data.play_count || 0} lượt nghe.`;
        meta.image = data.thumbnail_url || meta.image;
        meta.type = "music.song";
        meta.audio = data.audio_url || "";
        console.log("[prerender] found ai-music:", data.title);
      } else {
        console.log("[prerender] ai-music error:", error?.message);
      }
    } else if (type === "music" || type === "video") {
      console.log("[prerender] fetching", type, ":", id);
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, description, video_url, thumbnail_url, view_count, duration, channels(name)")
        .eq("id", id)
        .single();

      if (!error && data) {
        const ch = Array.isArray(data.channels) ? data.channels[0] : data.channels;
        const channelName = ch?.name || "FUN Play";
        meta.title = `${data.title} - ${channelName}`;
        meta.image = data.thumbnail_url || meta.image;

        if (type === "music") {
          meta.type = "music.song";
          meta.audio = data.video_url;
          meta.description = data.description || `🎵 Nghe "${data.title}" trên FUN Play. ${data.view_count || 0} lượt nghe.`;
        } else {
          meta.type = "video.other";
          meta.video = data.video_url;
          meta.description = data.description || `📺 Xem "${data.title}" trên FUN Play. ${data.view_count || 0} lượt xem.`;
        }
        console.log("[prerender] found:", data.title);
      } else {
        console.log("[prerender] error:", error?.message);
      }
    } else if (type === "channel") {
      console.log("[prerender] fetching channel:", id);
      const { data, error } = await supabase
        .from("channels")
        .select("id, name, description, banner_url, subscriber_count")
        .eq("id", id)
        .single();

      if (!error && data) {
        meta.title = `${data.name} - FUN Play`;
        meta.description = data.description || `📺 Kênh ${data.name} trên FUN Play với ${data.subscriber_count || 0} người đăng ký.`;
        meta.image = data.banner_url || meta.image;
        meta.type = "profile";
        console.log("[prerender] found channel:", data.name);
      } else {
        console.log("[prerender] channel error:", error?.message);
      }
    } else if (type === "video-by-slug" && slugLookup) {
      console.log("[prerender] fetching video by slug:", slugLookup.username, slugLookup.slug);
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, description, video_url, thumbnail_url, view_count, duration, channels(name)")
        .eq("slug", slugLookup.slug)
        .single();

      if (!error && data) {
        const ch = Array.isArray(data.channels) ? data.channels[0] : data.channels;
        const channelName = ch?.name || "FUN Play";
        meta.title = `${data.title} - ${channelName}`;
        meta.image = data.thumbnail_url || meta.image;
        meta.type = "video.other";
        meta.video = data.video_url;
        meta.description = data.description || `📺 Xem "${data.title}" trên FUN Play. ${data.view_count || 0} lượt xem.`;
        console.log("[prerender] found video by slug:", data.title);
      } else {
        console.log("[prerender] slug lookup error:", error?.message);
      }
    }

    meta.url = `${siteUrl}${path}`;
    const html = buildHtml(meta);

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    console.error("[prerender] error:", err);
    const fallbackHtml = buildHtml({
      title: "FUN Play: Web3 AI Social",
      description: "The place where every soul turns value into digital assets forever – Rich Rich Rich",
      image: "https://official-funplay.lovable.app/images/funplay-og-image.jpg",
      url: "https://official-funplay.lovable.app",
      type: "website",
    });
    return new Response(fallbackHtml, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
