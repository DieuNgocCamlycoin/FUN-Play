import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateDonationRequest {
  receiver_id: string;
  token_symbol: string;
  amount: number;
  message?: string;
  context_type: "global" | "post" | "video" | "comment";
  context_id?: string;
  theme?: string;
  music?: string;
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

    const body: CreateDonationRequest = await req.json();
    const { receiver_id, token_symbol, amount, message, context_type, context_id, theme, music } = body;

    // Validate required fields
    if (!receiver_id || !token_symbol || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-donation
    if (user.id === receiver_id) {
      return new Response(
        JSON.stringify({ error: "Không thể tặng cho chính mình" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if receiver exists
    const { data: receiver, error: receiverError } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("id", receiver_id)
      .single();

    if (receiverError || !receiver) {
      return new Response(
        JSON.stringify({ error: "Người nhận không tồn tại" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get token info
    const { data: tokenData, error: tokenError } = await supabase
      .from("donate_tokens")
      .select("*")
      .eq("symbol", token_symbol)
      .eq("is_enabled", true)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Token không hợp lệ hoặc đã bị vô hiệu hóa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: max 50 donations per day
    const today = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("donation_transactions")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", `${today}T00:00:00Z`);

    if (todayCount && todayCount >= 50) {
      return new Response(
        JSON.stringify({ error: "Đã đạt giới hạn 50 giao dịch/ngày" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All tokens (BSC on-chain) start as pending — user signs tx on wallet
    let transactionStatus = "pending";

    // Create donation transaction record
    const { data: transaction, error: txError } = await supabase
      .from("donation_transactions")
      .insert({
        sender_id: user.id,
        receiver_id,
        token_id: tokenData.id,
        amount,
        message: message?.substring(0, 200) || null,
        context_type: context_type || "global",
        context_id: context_id || null,
        status: transactionStatus,
        chain: tokenData.chain,
      metadata: {
          sender_ip_hash: null,
          user_agent: req.headers.get("user-agent"),
          created_at_ms: Date.now(),
          theme: theme || "celebration",
          music: music || "rich-celebration",
        },
      })
      .select(`
        *,
        token:donate_tokens(symbol, name, icon_url, chain)
      `)
      .single();

    if (txError) {
      console.error("Transaction error:", txError);
      return new Response(
        JSON.stringify({ error: "Không thể tạo giao dịch", details: txError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch sender and receiver profiles separately (no FK constraint)
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .single();

    // Build complete transaction object
    const completeTransaction = {
      ...transaction,
      sender: senderProfile,
      receiver: {
        username: receiver.username,
        display_name: receiver.display_name,
        avatar_url: null,
      },
    };


    return new Response(
      JSON.stringify({
        success: true,
        transaction: completeTransaction,
        receipt_url: `/receipt/${completeTransaction.receipt_public_id}`,
        requires_wallet: tokenData.chain === "bsc",
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
