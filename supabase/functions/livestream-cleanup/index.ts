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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Tìm các livestream "zombie": status = 'live' nhưng không có heartbeat > 45 giây
    const cutoff = new Date(Date.now() - 45_000).toISOString();

    const { data: zombies, error: fetchError } = await supabase
      .from("livestreams")
      .select("id, user_id, title")
      .eq("status", "live")
      .or(`last_heartbeat_at.is.null,last_heartbeat_at.lt.${cutoff}`);

    if (fetchError) {
      throw fetchError;
    }

    if (!zombies || zombies.length === 0) {
      return new Response(
        JSON.stringify({ cleaned: 0, message: "Không có stream zombie" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const zombieIds = zombies.map((z) => z.id);

    // Kết thúc các stream zombie
    const { error: updateError } = await supabase
      .from("livestreams")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        viewer_count: 0,
      })
      .in("id", zombieIds);

    if (updateError) {
      throw updateError;
    }

    console.log(`Cleaned ${zombieIds.length} zombie livestreams:`, zombieIds);

    return new Response(
      JSON.stringify({
        cleaned: zombieIds.length,
        ids: zombieIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
