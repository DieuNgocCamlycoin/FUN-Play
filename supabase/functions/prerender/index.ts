import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bot user agents for social media crawlers
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'Pinterest',
  'Googlebot',
  'bingbot',
  'Baiduspider',
  'YandexBot',
];

function isBotRequest(userAgent: string): boolean {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "";
    const userAgent = req.headers.get("user-agent") || "";

    console.log(`[Prerender] Request for path: ${path}, User-Agent: ${userAgent}`);

    // Parse the path to extract type and id
    let type: "music" | "video" | "channel" | "ai-music" | null = null;
    let id: string | null = null;

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
    }

    if (!type || !id) {
      console.log("[Prerender] Invalid path, returning default meta");
      return generateHtmlResponse({
        title: "FUN Play: Web3 AI Social",
        description: "The place where every soul turns value into digital assets forever – Rich Rich Rich",
        image: "https://lovable.dev/opengraph-image-p98pqg.png",
        url: `https://funplay.lovable.app${path}`,
        type: "website",
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = Deno.env.get("SITE_URL") || "https://funplay.lovable.app";

    let title = "FUN Play: Web3 AI Social";
    let description = "The place where every soul turns value into digital assets forever – Rich Rich Rich";
    let image = "https://lovable.dev/opengraph-image-p98pqg.png";
    let ogType = "website";
    let audioUrl = "";
    let videoUrl = "";

    if (type === "ai-music") {
      console.log(`[Prerender] Fetching AI music data for id: ${id}`);
      
      const { data: aiMusic, error } = await supabase
        .from("ai_generated_music")
        .select("id, title, style, thumbnail_url, audio_url, play_count, lyrics")
        .eq("id", id)
        .single();

      if (!error && aiMusic) {
        title = `${aiMusic.title} - Fun Music AI`;
        description = `🎵 Nghe bài hát AI "${aiMusic.title}" (${aiMusic.style || 'Music'}) trên FUN Play. ${aiMusic.play_count || 0} lượt nghe.`;
        image = aiMusic.thumbnail_url || image;
        ogType = "music.song";
        audioUrl = aiMusic.audio_url || "";
        console.log(`[Prerender] Found AI music: ${aiMusic.title}`);
      } else {
        console.log(`[Prerender] Error fetching AI music: ${error?.message}`);
      }
    } else if (type === "music" || type === "video") {
      console.log(`[Prerender] Fetching ${type} data for id: ${id}`);
      
      const { data: video, error } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          view_count,
          duration,
          channels (name)
        `)
        .eq("id", id)
        .single();

      if (!error && video) {
        const channelData = Array.isArray(video.channels) 
          ? video.channels[0] 
          : video.channels;
        const channelName = channelData?.name || "FUN Play";

        title = `${video.title} - ${channelName}`;
        image = video.thumbnail_url || image;
        
        if (type === "music") {
          ogType = "music.song";
          audioUrl = video.video_url;
          description = video.description || `🎵 Nghe bài hát "${video.title}" trên FUN Play - Web3 Music Platform. ${video.view_count || 0} lượt nghe.`;
        } else {
          ogType = "video.other";
          videoUrl = video.video_url;
          description = video.description || `📺 Xem video "${video.title}" trên FUN Play. ${video.view_count || 0} lượt xem.`;
        }

        console.log(`[Prerender] Found content: ${title}`);
      } else {
        console.log(`[Prerender] Error fetching content: ${error?.message}`);
      }
    } else if (type === "channel") {
      console.log(`[Prerender] Fetching channel data for id: ${id}`);
      
      const { data: channel, error } = await supabase
        .from("channels")
        .select(`
          id,
          name,
          description,
          banner_url,
          subscriber_count
        `)
        .eq("id", id)
        .single();

      if (!error && channel) {
        title = `${channel.name} - FUN Play`;
        description = channel.description || `📺 Kênh ${channel.name} trên FUN Play với ${channel.subscriber_count || 0} người đăng ký.`;
        image = channel.banner_url || image;
        ogType = "profile";

        console.log(`[Prerender] Found channel: ${channel.name}`);
      } else {
        console.log(`[Prerender] Error fetching channel: ${error?.message}`);
      }
    }

    const shareUrl = `${baseUrl}${path}`;

    return generateHtmlResponse({
      title,
      description,
      image,
      url: shareUrl,
      type: ogType,
      audio: audioUrl,
      video: videoUrl,
    });
  } catch (error) {
    console.error("[Prerender] Error:", error);
    return generateHtmlResponse({
      title: "FUN Play: Web3 AI Social",
      description: "The place where every soul turns value into digital assets forever – Rich Rich Rich",
      image: "https://lovable.dev/opengraph-image-p98pqg.png",
      url: "https://funplay.lovable.app",
      type: "website",
    });
  }
});

interface MetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  audio?: string;
  video?: string;
}

function generateHtmlResponse(meta: MetaData): Response {
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)}</title>
  
  <!-- Standard Meta Tags -->
  <meta name="description" content="${escapeHtml(meta.description)}">
  <meta name="author" content="FUN Play">
  
  <!-- Open Graph Meta Tags -->
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
  <meta property="og:audio:type" content="audio/mpeg">` : ''}
  ${meta.video ? `<meta property="og:video" content="${meta.video}">
  <meta property="og:video:type" content="video/mp4">` : ''}
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@FunPlay">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  <meta name="twitter:image" content="${meta.image}">
  
  <!-- Favicon -->
  <link rel="icon" href="https://funplay.lovable.app/favicon.ico">
  
  <!-- Redirect for non-bot users -->
  <script>
    // Only redirect if not a bot
    var botPattern = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|Pinterest|Googlebot|bingbot/i;
    if (!botPattern.test(navigator.userAgent)) {
      window.location.replace("${meta.url}");
    }
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${meta.url}">
  </noscript>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
      color: white;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .container {
      max-width: 600px;
    }
    img {
      max-width: 100%;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 10px 40px rgba(0, 231, 255, 0.2);
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #00E7FF, #FF00E5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #a0a0a0;
      line-height: 1.6;
    }
    a {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #00E7FF, #0088cc);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    a:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="${meta.image}" alt="${escapeHtml(meta.title)}" />
    <h1>${escapeHtml(meta.title)}</h1>
    <p>${escapeHtml(meta.description)}</p>
    <a href="${meta.url}">Xem trên FUN Play</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
