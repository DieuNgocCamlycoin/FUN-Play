import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, signup_ip_hash, avatar_url, avatar_verified, display_name")
      .eq("banned", false);

    if (profilesError) throw profilesError;

    // Count signups per IP hash from ip_tracking
    const { data: ipCounts, error: ipError } = await supabase
      .from("ip_tracking")
      .select("ip_hash")
      .eq("action_type", "signup");

    if (ipError) throw ipError;

    // Build IP frequency map
    const ipFrequency: Record<string, number> = {};
    for (const row of ipCounts || []) {
      ipFrequency[row.ip_hash] = (ipFrequency[row.ip_hash] || 0) + 1;
    }

    // Also count signups per signup_ip_hash from profiles table
    const signupIpFrequency: Record<string, number> = {};
    for (const p of profiles || []) {
      if (p.signup_ip_hash) {
        signupIpFrequency[p.signup_ip_hash] =
          (signupIpFrequency[p.signup_ip_hash] || 0) + 1;
      }
    }

    // Compute scores
    const updates: { id: string; score: number }[] = [];
    const distribution: Record<number, number> = {};

    for (const profile of profiles || []) {
      let score = 0;

      // IP farming check
      const ipHash = profile.signup_ip_hash;
      if (ipHash) {
        const trackingCount = ipFrequency[ipHash] || 0;
        const profileCount = signupIpFrequency[ipHash] || 0;
        const maxCount = Math.max(trackingCount, profileCount);

        if (maxCount >= 5) {
          score += 5;
        } else if (maxCount > 2) {
          score += 1;
        }
      }

      // Avatar check
      if (!profile.avatar_url) {
        score += 1;
      }

      // Avatar verified check
      if (!profile.avatar_verified) {
        score += 1;
      }

      // Display name check
      if (!profile.display_name || profile.display_name.length < 3) {
        score += 1;
      }

      updates.push({ id: profile.id, score });
      distribution[score] = (distribution[score] || 0) + 1;
    }

    // Batch update in chunks of 50
    let updated = 0;
    for (let i = 0; i < updates.length; i += 50) {
      const chunk = updates.slice(i, i + 50);
      const promises = chunk.map((u) =>
        supabase
          .from("profiles")
          .update({ suspicious_score: u.score })
          .eq("id", u.id)
      );
      await Promise.all(promises);
      updated += chunk.length;
    }

    const result = {
      total_profiles: profiles?.length || 0,
      updated,
      distribution,
      high_risk: updates.filter((u) => u.score >= 3).length,
      medium_risk: updates.filter((u) => u.score >= 1 && u.score < 3).length,
      clean: updates.filter((u) => u.score === 0).length,
    };

    console.log("Backfill complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
