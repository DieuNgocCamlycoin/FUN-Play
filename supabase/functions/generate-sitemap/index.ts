import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://play.fun.rich";
const VIDEOS_PER_PAGE = 1000;
const PROFILES_PER_PAGE = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const page = parseInt(url.searchParams.get("page") || "1", 10);

    const xmlHeaders = {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    };

    // Sitemap index
    if (!type || type === "index") {
      // Đếm tổng số video để tạo phân trang
      const { count: videoCount } = await supabase
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("is_public", true)
        .eq("is_hidden", false)
        .not("slug", "is", null);

      const totalVideoPages = Math.max(1, Math.ceil((videoCount || 0) / VIDEOS_PER_PAGE));

      // Đếm tổng số profiles
      const { count: profileCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .not("username", "like", "user_%");

      const totalProfilePages = Math.max(1, Math.ceil((profileCount || 0) / PROFILES_PER_PAGE));

      const functionUrl = url.origin + url.pathname;

      let sitemaps = `  <sitemap><loc>${functionUrl}?type=static</loc></sitemap>\n`;
      for (let i = 1; i <= totalVideoPages; i++) {
        sitemaps += `  <sitemap><loc>${functionUrl}?type=videos&page=${i}</loc></sitemap>\n`;
      }
      for (let i = 1; i <= totalProfilePages; i++) {
        sitemaps += `  <sitemap><loc>${functionUrl}?type=profiles&page=${i}</loc></sitemap>\n`;
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}</sitemapindex>`;
      return new Response(xml, { headers: xmlHeaders });
    }

    // Trang tĩnh
    if (type === "static") {
      const staticPages = [
        { loc: "/", priority: "1.0", changefreq: "daily" },
        { loc: "/explore", priority: "0.8", changefreq: "daily" },
        { loc: "/ranking", priority: "0.7", changefreq: "daily" },
        { loc: "/music", priority: "0.7", changefreq: "daily" },
        { loc: "/community", priority: "0.6", changefreq: "daily" },
        { loc: "/about", priority: "0.5", changefreq: "monthly" },
        { loc: "/bounty", priority: "0.6", changefreq: "weekly" },
      ];

      const entries = staticPages
        .map(
          (p) =>
            `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
        )
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
      return new Response(xml, {
        headers: { ...xmlHeaders, "Cache-Control": "public, max-age=86400, s-maxage=86400" },
      });
    }

    // Video sitemap (phân trang)
    if (type === "videos") {
      const offset = (page - 1) * VIDEOS_PER_PAGE;

      const { data: videos } = await supabase
        .from("videos")
        .select("slug, user_id, updated_at, thumbnail_url, title, description, duration")
        .eq("is_public", true)
        .eq("is_hidden", false)
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + VIDEOS_PER_PAGE - 1);

      if (!videos || videos.length === 0) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
          { headers: xmlHeaders }
        );
      }

      // Lấy username cho từng user_id
      const userIds = [...new Set(videos.map((v) => v.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const usernameMap = new Map(
        (profiles || []).map((p) => [p.id, p.username])
      );

      const entries = videos
        .map((v) => {
          const username = usernameMap.get(v.user_id);
          if (!username || !v.slug) return "";
          const lastmod = v.updated_at
            ? new Date(v.updated_at).toISOString().split("T")[0]
            : "";
          return `  <url>
    <loc>${SITE_URL}/${username}/video/${v.slug}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        })
        .filter(Boolean)
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
      return new Response(xml, { headers: xmlHeaders });
    }

    // Profile sitemap (phân trang)
    if (type === "profiles") {
      const offset = (page - 1) * PROFILES_PER_PAGE;

      const { data: profilesWithVideos } = await supabase
        .from("profiles")
        .select("username, updated_at")
        .not("username", "like", "user_%")
        .order("updated_at", { ascending: false })
        .range(offset, offset + PROFILES_PER_PAGE - 1);

      const entries = (profilesWithVideos || [])
        .map((p) => {
          const lastmod = p.updated_at
            ? new Date(p.updated_at).toISOString().split("T")[0]
            : "";
          return `  <url>
    <loc>${SITE_URL}/${p.username}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        })
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
      return new Response(xml, { headers: xmlHeaders });
    }

    return new Response("Invalid type parameter", { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
