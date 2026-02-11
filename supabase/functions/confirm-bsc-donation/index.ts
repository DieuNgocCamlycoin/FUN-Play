import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmDonationRequest {
  transaction_id: string;
  tx_hash: string;
  block_number?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ConfirmDonationRequest = await req.json();
    const { transaction_id, tx_hash, block_number } = body;

    if (!transaction_id || !tx_hash) {
      return new Response(
        JSON.stringify({ error: "Missing transaction_id or tx_hash" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the transaction belongs to the user
    const { data: existingTx, error: fetchError } = await supabase
      .from("donation_transactions")
      .select("*")
      .eq("id", transaction_id)
      .eq("sender_id", user.id)
      .eq("status", "pending")
      .single();

    if (fetchError || !existingTx) {
      return new Response(
        JSON.stringify({ error: "Transaction not found or already confirmed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine correct explorer URL based on token chain
    const { data: tokenData } = await supabase
      .from("donate_tokens")
      .select("contract_address, chain")
      .eq("id", existingTx.token_id)
      .single();

    const isFunTestnet = tokenData?.contract_address?.toLowerCase() === "0x1aa8de8b1e4465c6d729e8564893f8ef823a5ff2";
    const explorerUrl = isFunTestnet
      ? `https://testnet.bscscan.com/tx/${tx_hash}`
      : `https://bscscan.com/tx/${tx_hash}`;
    
    const { data: updatedTx, error: updateError } = await supabase
      .from("donation_transactions")
      .update({
        tx_hash,
        block_number: block_number || null,
        explorer_url: explorerUrl,
        status: "success",
        metadata: {
          ...existingTx.metadata,
          confirmed_at_ms: Date.now(),
        },
      })
      .eq("id", transaction_id)
      .select(`
        *,
        token:donate_tokens(symbol, name, icon_url, chain)
      `)
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to confirm transaction" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch sender and receiver profiles separately (no FK constraint)
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", existingTx.sender_id)
      .single();

    const { data: receiverProfile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", existingTx.receiver_id)
      .single();

    // Build complete transaction object
    const completeTransaction = {
      ...updatedTx,
      sender: senderProfile,
      receiver: receiverProfile,
    };

    return new Response(
      JSON.stringify({
        success: true,
        transaction: completeTransaction,
        explorer_url: explorerUrl,
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
