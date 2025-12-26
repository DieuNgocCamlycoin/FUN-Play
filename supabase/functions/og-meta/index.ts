import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OGMetaParams {
  type: 'music' | 'video' | 'channel';
  id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") as OGMetaParams['type'];
    const id = url.searchParams.get("id");

    if (!type || !id) {
      return new Response(
        JSON.stringify({ error: "Missing type or id parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let title = "FUN Play: Web3 AI Social";
    let description = "The place where every soul turns value into digital assets forever – Rich Rich Rich";
    let image = "https://lovable.dev/opengraph-image-p98pqg.png";
    let ogType = "website";
    let audioUrl = "";
    let channelName = "";
    let shareUrl = "";

    const baseUrl = Deno.env.get("SITE_URL") || "https://funplay.lovable.app";

    if (type === "music" || type === "video") {
      const { data: video, error } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          channels (name)
        `)
        .eq("id", id)
        .single();

      if (!error && video) {
        // Handle channels - it could be an array or object depending on relationship
        const channelData = Array.isArray(video.channels) 
          ? video.channels[0] 
          : video.channels;
        const channelNameValue = channelData?.name || "";
        
        title = `${video.title} - ${channelNameValue || "FUN Play"}`;
        description = video.description || `Xem "${video.title}" trên FUN Play - Web3 Platform`;
        image = video.thumbnail_url || image;
        channelName = channelNameValue;
        
        if (type === "music") {
          ogType = "music.song";
          audioUrl = video.video_url;
          shareUrl = `${baseUrl}/music/${id}`;
          description = video.description || `Nghe bài hát "${video.title}" trên FUN Play`;
        } else {
          ogType = "video.other";
          shareUrl = `${baseUrl}/watch/${id}`;
        }
      }
    } else if (type === "channel") {
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
        description = channel.description || `Kênh ${channel.name} trên FUN Play với ${channel.subscriber_count || 0} người đăng ký`;
        image = channel.banner_url || image;
        ogType = "profile";
        shareUrl = `${baseUrl}/channel/${id}`;
      }
    }

    // Return meta tags as JSON
    const metaData = {
      title,
      description,
      image,
      type: ogType,
      url: shareUrl,
      siteName: "FUN Play",
      audio: audioUrl || undefined,
      channelName: channelName || undefined,
    };

    return new Response(
      JSON.stringify(metaData),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600" // Cache for 1 hour
        } 
      }
    );
  } catch (error) {
    console.error("Error in og-meta function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
