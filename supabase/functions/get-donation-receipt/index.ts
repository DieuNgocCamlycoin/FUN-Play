import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System treasury sender ID used in donation_transactions for claim context
const SYSTEM_TREASURY_SENDER_ID = "f0f0f0f0-0000-0000-0000-000000000001";

// Correct FUN PLAY TREASURY display info
const TREASURY_OVERRIDE = {
  id: "cc9cd3a1-8541-4f6f-b10e-f5619e0de832",
  username: "user_cc9cd3a1",
  display_name: "FUN PLAY TREASURY",
  avatar_url: "https://pub-348064b6f39043d6be2bfb92d648edb8.r2.dev/cc9cd3a1-8541-4f6f-b10e-f5619e0de832/avatars/1770830879600-play_fun.jpg",
  wallet_address: "0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC",
  channel_name: "FUN PLAY TREASURY",
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
    const receiptPublicId = url.searchParams.get("receipt_public_id");

    if (!receiptPublicId) {
      return new Response(
        JSON.stringify({ error: "Missing receipt_public_id parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching receipt:", receiptPublicId);

    const { data: transaction, error: txError } = await supabase
      .from("donation_transactions")
      .select("*")
      .eq("receipt_public_id", receiptPublicId)
      .maybeSingle();

    if (txError) {
      console.error("Transaction fetch error:", txError);
      return new Response(
        JSON.stringify({ error: "Database error", details: txError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!transaction) {
      return new Response(
        JSON.stringify({ error: "Receipt not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if sender is system treasury
    const isSystemTreasurySender = 
      transaction.sender_id === SYSTEM_TREASURY_SENDER_ID || 
      transaction.context_type === "claim";

    // Fetch token, sender (if not system), receiver, and channels in parallel
    const fetchPromises: Promise<any>[] = [
      supabase.from("donate_tokens").select("symbol, name, icon_url, decimals").eq("id", transaction.token_id).maybeSingle(),
      // Sender profile - skip if system treasury
      isSystemTreasurySender
        ? Promise.resolve({ data: null })
        : supabase.from("profiles").select("id, username, display_name, avatar_url, wallet_address").eq("id", transaction.sender_id).maybeSingle(),
      // Receiver profile
      supabase.from("profiles").select("id, username, display_name, avatar_url, wallet_address").eq("id", transaction.receiver_id).maybeSingle(),
      // Sender channel - skip if system treasury
      isSystemTreasurySender
        ? Promise.resolve({ data: null })
        : supabase.from("channels").select("name").eq("user_id", transaction.sender_id).maybeSingle(),
      // Receiver channel
      supabase.from("channels").select("name").eq("user_id", transaction.receiver_id).maybeSingle(),
    ];

    const [tokenResult, senderResult, receiverResult, senderChannelResult, receiverChannelResult] = await Promise.all(fetchPromises);

    // Build sender data - override for system treasury
    let senderData;
    if (isSystemTreasurySender) {
      senderData = {
        id: TREASURY_OVERRIDE.id,
        username: TREASURY_OVERRIDE.username,
        display_name: TREASURY_OVERRIDE.display_name,
        avatar_url: TREASURY_OVERRIDE.avatar_url,
        wallet_address: TREASURY_OVERRIDE.wallet_address,
        channel_name: TREASURY_OVERRIDE.channel_name,
      };
    } else {
      const sp = senderResult.data;
      senderData = sp ? {
        ...sp,
        channel_name: senderChannelResult.data?.name || null,
      } : null;
    }

    // Build receiver data with channel name
    const rp = receiverResult.data;
    const receiverData = rp ? {
      ...rp,
      channel_name: receiverChannelResult.data?.name || null,
    } : null;

    // Get context info if applicable
    let contextInfo = null;
    if (transaction.context_type === "video" && transaction.context_id) {
      const { data: video } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url")
        .eq("id", transaction.context_id)
        .maybeSingle();
      contextInfo = video ? { type: "video", ...video } : null;
    } else if (transaction.context_type === "post" && transaction.context_id) {
      const { data: post } = await supabase
        .from("posts")
        .select("id, content, image_url")
        .eq("id", transaction.context_id)
        .maybeSingle();
      contextInfo = post ? { type: "post", ...post } : null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt: {
          ...transaction,
          token: tokenResult.data,
          sender: senderData,
          receiver: receiverData,
          context_info: contextInfo,
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
