import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Username → user_id cache (in-memory, TTL 10 min) ──
const usernameCache = new Map<string, { userId: string; expiresAt: number }>();
const CACHE_TTL = 10 * 60 * 1000;

async function resolveUsername(
  supabase: ReturnType<typeof createClient>,
  username: string
): Promise<{ userId: string; currentUsername: string } | null> {
  const now = Date.now();
  const cached = usernameCache.get(username);
  if (cached && cached.expiresAt > now) {
    return { userId: cached.userId, currentUsername: username };
  }

  // Direct lookup
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (data) {
    usernameCache.set(username, { userId: data.id, expiresAt: now + CACHE_TTL });
    return { userId: data.id, currentUsername: username };
  }

  // Fallback: previous_username
  const { data: prev } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("previous_username", username)
    .single();

  if (prev) {
    usernameCache.set(prev.username, { userId: prev.id, expiresAt: now + CACHE_TTL });
    return { userId: prev.id, currentUsername: prev.username };
  }

  return null;
}

// ── Helpers ──

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

async function fetchAvatarUrl(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();
  return data?.avatar_url || null;
}

function buildRedirectHtml(newUrl: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta http-equiv="refresh" content="0;url=${newUrl}">
<link rel="canonical" href="${newUrl}">
<title>Redirecting...</title>
</head><body><p>Redirecting to <a href="${newUrl}">${newUrl}</a></p></body></html>`;
}

// ── Reserved paths that should NOT be treated as username ──
const RESERVED_PATHS = new Set([
  "watch", "channel", "music", "ai-music", "upload", "login", "register",
  "auth", "admin", "settings", "search", "explore", "trending", "feed",
  "notifications", "messages", "wallet", "rewards", "bounty", "meditation",
  "playlists", "shorts", "about", "terms", "privacy", "help", "api",
  "community", "angel", "leaderboard", "ranking",
]);

// ── Main handler ──

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "";
    console.log("[prerender] path:", path);

    const baseUrl = "https://official-funplay.lovable.app";
    const defaultMeta: MetaData = {
      title: "FUN Play: Web3 AI Social",
      description: "The place where every soul turns value into digital assets forever – Rich Rich Rich",
      image: `${baseUrl}/images/funplay-og-image.jpg`,
      url: `${baseUrl}${path}`,
      type: "website",
    };

    // ── Parse path: legacy patterns first, then clean URLs ──
    let type: string | null = null;
    let id: string | null = null;
    let username: string | null = null;
    let slug: string | null = null;

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
      // Clean URL patterns: /:username/video/:slug, /:username/post/:slug, /:username/:slug, /:username
      const segments = path.split("/").filter(Boolean);
      if (segments.length >= 1 && !RESERVED_PATHS.has(segments[0])) {
        username = segments[0];
        if (segments.length >= 3 && segments[1] === "video") {
          type = "video-by-slug";
          slug = segments[2];
        } else if (segments.length >= 3 && segments[1] === "post") {
          type = "post-by-slug";
          slug = segments[2];
        } else if (segments.length === 2) {
          // /:username/:slug → default to video
          type = "video-by-slug";
          slug = segments[1];
        } else if (segments.length === 1) {
          type = "channel-by-username";
        }
      }
    }

    if (!type) {
      console.log("[prerender] no type matched, returning default");
      return new Response(buildHtml(defaultMeta), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const meta = { ...defaultMeta };

    // ── Legacy: ai-music by ID ──
    if (type === "ai-music" && id) {
      console.log("[prerender] fetching ai-music:", id);
      const { data, error } = await supabase
        .from("ai_generated_music")
        .select("id, title, style, thumbnail_url, audio_url, play_count, lyrics, user_id")
        .eq("id", id)
        .single();

      if (!error && data) {
        const avatarUrl = await fetchAvatarUrl(supabase, data.user_id);
        meta.title = `${data.title} - Fun Music AI`;
        meta.description = `🎵 Nghe bài hát AI "${data.title}" (${data.style || "Music"}) trên FUN Play. ${data.play_count || 0} lượt nghe.`;
        meta.image = data.thumbnail_url || avatarUrl || meta.image;
        meta.type = "music.song";
        meta.audio = data.audio_url || "";
        console.log("[prerender] found ai-music:", data.title);
      }
    }
    // ── Legacy: video/music by ID ──
    else if ((type === "music" || type === "video") && id) {
      console.log("[prerender] fetching", type, ":", id);
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, description, video_url, thumbnail_url, view_count, duration, user_id, channels(name)")
        .eq("id", id)
        .single();

      if (!error && data) {
        const avatarUrl = await fetchAvatarUrl(supabase, data.user_id);
        const ch = Array.isArray(data.channels) ? data.channels[0] : data.channels;
        const channelName = ch?.name || "FUN Play";
        meta.title = `${data.title} - ${channelName}`;
        meta.image = data.thumbnail_url || avatarUrl || meta.image;

        if (type === "music") {
          meta.type = "music.song";
          meta.audio = data.video_url;
          meta.description = data.description || `🎵 Nghe "${data.title}" trên FUN Play. ${data.view_count || 0} lượt nghe.`;
        } else {
          meta.type = "video.other";
          meta.video = data.video_url;
          meta.description = data.description || `📺 Xem "${data.title}" trên FUN Play. ${data.view_count || 0} lượt xem.`;
        }
      }
    }
    // ── Legacy: channel by ID ──
    else if (type === "channel" && id) {
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
      }
    }
    // ── NEW: video by slug ──
    else if (type === "video-by-slug" && username && slug) {
      console.log("[prerender] resolving video-by-slug:", username, slug);
      const resolved = await resolveUsername(supabase, username);

      if (resolved) {
        // If username changed, redirect to canonical URL
        if (resolved.currentUsername !== username) {
          const newUrl = `${baseUrl}/${resolved.currentUsername}/${slug}`;
          console.log("[prerender] username redirect →", newUrl);
          return new Response(buildRedirectHtml(newUrl), {
            status: 301,
            headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Location": newUrl },
          });
        }

        // Query video by user_id + slug
        const { data: video } = await supabase
          .from("videos")
          .select("id, title, description, video_url, thumbnail_url, view_count, slug, channels(name)")
          .eq("user_id", resolved.userId)
          .eq("slug", slug)
          .single();

        if (video) {
          const avatarUrl = await fetchAvatarUrl(supabase, resolved.userId);
          const ch = Array.isArray(video.channels) ? video.channels[0] : video.channels;
          const channelName = ch?.name || "FUN Play";
          meta.title = `${video.title} - ${channelName}`;
          meta.description = video.description || `📺 Xem "${video.title}" trên FUN Play. ${video.view_count || 0} lượt xem.`;
          meta.image = video.thumbnail_url || avatarUrl || meta.image;
          meta.type = "video.other";
          meta.video = video.video_url;
          meta.url = `${baseUrl}/${username}/${video.slug || slug}`;
          console.log("[prerender] found video by slug:", video.title);
        } else {
          // Fallback: check video_slug_history
          const { data: history } = await supabase
            .from("video_slug_history")
            .select("video_id, videos(slug, user_id)")
            .eq("old_slug", slug)
            .eq("user_id", resolved.userId)
            .limit(1)
            .single();

          if (history) {
            const vid = Array.isArray(history.videos) ? history.videos[0] : history.videos;
            if (vid?.slug) {
              const newUrl = `${baseUrl}/${username}/${vid.slug}`;
              console.log("[prerender] slug redirect →", newUrl);
              return new Response(buildRedirectHtml(newUrl), {
                status: 301,
                headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Location": newUrl },
              });
            }
          }
          console.log("[prerender] video not found for slug:", slug);
        }
      } else {
        console.log("[prerender] username not found:", username);
      }
    }
    // ── NEW: post by slug ──
    else if (type === "post-by-slug" && username && slug) {
      console.log("[prerender] resolving post-by-slug:", username, slug);
      const resolved = await resolveUsername(supabase, username);

      if (resolved) {
        if (resolved.currentUsername !== username) {
          const newUrl = `${baseUrl}/${resolved.currentUsername}/post/${slug}`;
          console.log("[prerender] username redirect →", newUrl);
          return new Response(buildRedirectHtml(newUrl), {
            status: 301,
            headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Location": newUrl },
          });
        }

        const { data: post } = await supabase
          .from("posts")
          .select("id, content, image_url, images, slug, like_count, comment_count")
          .eq("user_id", resolved.userId)
          .eq("slug", slug)
          .single();

        if (post) {
          const avatarUrl = await fetchAvatarUrl(supabase, resolved.userId);
          const headline = (post.content || "").split("\n")[0].slice(0, 70);
          meta.title = `${headline || "Bài đăng"} | FUN Play`;
          meta.description = (post.content || "").slice(0, 160);
          const firstImage = post.images?.[0] || post.image_url;
          meta.image = firstImage || avatarUrl || meta.image;
          meta.url = `${baseUrl}/${username}/post/${post.slug || slug}`;
          meta.type = "article";
          console.log("[prerender] found post by slug:", headline);
        } else {
          // Fallback: check post_slug_history
          const { data: history } = await supabase
            .from("post_slug_history")
            .select("post_id, posts(slug, user_id)")
            .eq("old_slug", slug)
            .eq("user_id", resolved.userId)
            .limit(1)
            .single();

          if (history) {
            const p = Array.isArray(history.posts) ? history.posts[0] : history.posts;
            if (p?.slug) {
              const newUrl = `${baseUrl}/${username}/post/${p.slug}`;
              console.log("[prerender] post slug redirect →", newUrl);
              return new Response(buildRedirectHtml(newUrl), {
                status: 301,
                headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Location": newUrl },
              });
            }
          }
          console.log("[prerender] post not found for slug:", slug);
        }
      }
    }
    // ── NEW: channel by username ──
    else if (type === "channel-by-username" && username) {
      console.log("[prerender] resolving channel-by-username:", username);
      const resolved = await resolveUsername(supabase, username);

      if (resolved) {
        if (resolved.currentUsername !== username) {
          const newUrl = `${baseUrl}/${resolved.currentUsername}`;
          console.log("[prerender] username redirect →", newUrl);
          return new Response(buildRedirectHtml(newUrl), {
            status: 301,
            headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Location": newUrl },
          });
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, username, avatar_url, bio")
          .eq("id", resolved.userId)
          .single();

        const { data: channel } = await supabase
          .from("channels")
          .select("name, description, banner_url, subscriber_count")
          .eq("user_id", resolved.userId)
          .single();

        const displayName = profile?.display_name || channel?.name || username;
        meta.title = `${displayName} - FUN Play`;
        meta.description = channel?.description || profile?.bio || `📺 Kênh ${displayName} trên FUN Play với ${channel?.subscriber_count || 0} người đăng ký.`;
        meta.image = channel?.banner_url || profile?.avatar_url || meta.image;
        meta.type = "profile";
        meta.url = `${baseUrl}/${username}`;
        console.log("[prerender] found channel-by-username:", displayName);
      }
    }

    meta.url = meta.url || `${baseUrl}${path}`;
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
