import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://play.fun.rich";

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
    const type = url.searchParams.get("type"); // index, videos, profiles, static

    // Nếu là sitemap index hoặc không có type
    if (!type || type === "index") {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap-static.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-videos.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-profiles.xml</loc></sitemap>
</sitemapindex>`;
      return new Response(xml, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    // Video sitemap
    if (type === "videos") {
      const { data: videos } = await supabase
        .from("videos")
        .select("slug, user_id, updated_at, thumbnail_url, title, description, duration")
        .eq("is_public", true)
        .eq("is_hidden", false)
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!videos || videos.length === 0) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          }
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
      return new Response(xml, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    // Profile sitemap
    if (type === "profiles") {
      const { data: profilesWithVideos } = await supabase
        .from("profiles")
        .select("username, updated_at")
        .not("username", "like", "user_%")
        .order("updated_at", { ascending: false })
        .limit(1000);

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
      return new Response(xml, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
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
