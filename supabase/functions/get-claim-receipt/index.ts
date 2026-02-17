import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const claimId = url.searchParams.get("claim_id");

    if (!claimId) {
      return new Response(
        JSON.stringify({ error: "Missing claim_id parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching claim receipt:", claimId);

    const { data: claim, error: claimError } = await supabase
      .from("claim_requests")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();

    if (claimError) {
      console.error("Claim fetch error:", claimError);
      return new Response(
        JSON.stringify({ error: "Database error", details: claimError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!claim) {
      return new Response(
        JSON.stringify({ error: "Claim receipt not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch profile with wallet_address
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, wallet_address")
      .eq("id", claim.user_id)
      .maybeSingle();

    // Fetch channel name
    const { data: channel } = await supabase
      .from("channels")
      .select("name")
      .eq("user_id", claim.user_id)
      .maybeSingle();

    // Include TREASURY sender info for complete receipt display
    const treasurySender = {
      display_name: "FUN PLAY TREASURY",
      username: "@user_cc9cd3a1",
      avatar_url: "https://pub-348064b6f39043d6be2bfb92d648edb8.r2.dev/cc9cd3a1-8541-4f6f-b10e-f5619e0de832/avatars/1770830879600-play_fun.jpg",
      wallet_address: "0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC",
      channel_name: "FUN PLAY TREASURY",
    };

    return new Response(
      JSON.stringify({
        success: true,
        claim: {
          ...claim,
          profiles: profile,
          channel: channel,
          sender: treasurySender,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
