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
    const receiptPublicId = url.searchParams.get("receipt_public_id");

    if (!receiptPublicId) {
      return new Response(
        JSON.stringify({ error: "Missing receipt_public_id parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch transaction with related data
    const { data: transaction, error } = await supabase
      .from("donation_transactions")
      .select(`
        id,
        created_at,
        amount,
        amount_usd,
        message,
        context_type,
        context_id,
        receipt_public_id,
        status,
        chain,
        tx_hash,
        explorer_url,
        token:donate_tokens(symbol, name, icon_url, decimals),
        sender:profiles!donation_transactions_sender_id_fkey(id, username, display_name, avatar_url),
        receiver:profiles!donation_transactions_receiver_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq("receipt_public_id", receiptPublicId)
      .single();

    if (error || !transaction) {
      return new Response(
        JSON.stringify({ error: "Receipt not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get context info if applicable
    let contextInfo = null;
    if (transaction.context_type === "video" && transaction.context_id) {
      const { data: video } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url")
        .eq("id", transaction.context_id)
        .single();
      contextInfo = video ? { type: "video", ...video } : null;
    } else if (transaction.context_type === "post" && transaction.context_id) {
      const { data: post } = await supabase
        .from("posts")
        .select("id, content, image_url")
        .eq("id", transaction.context_id)
        .single();
      contextInfo = post ? { type: "post", ...post } : null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt: {
          ...transaction,
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
