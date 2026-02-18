import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CAMLY_TOKEN = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const MORALIS_API_URL = "https://deep-index.moralis.io/api/v2.2";

interface MoralisTokenTransfer {
  transaction_hash: string;
  log_index: string;
  from_address: string;
  to_address: string;
  value: string;
  block_number: string;
  block_timestamp: string;
  token_symbol: string;
  token_decimals: string;
}

interface MoralisResponse {
  result: MoralisTokenTransfer[];
  cursor: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MORALIS_API_KEY = Deno.env.get("MORALIS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MORALIS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { wallet_address } = await req.json();
    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: "wallet_address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Wallet Detective On-chain: tracing ${wallet_address}`);

    // Fetch all CAMLY transfers TO the target wallet from Moralis
    const allTransfers: MoralisTokenTransfer[] = [];
    let cursor: string | null = null;
    let pageCount = 0;

    do {
      const params = new URLSearchParams({
        chain: "bsc",
        limit: "100",
        order: "DESC",
      });
      params.append("contract_addresses[]", CAMLY_TOKEN);
      if (cursor) params.append("cursor", cursor);

      const url = `${MORALIS_API_URL}/${wallet_address}/erc20/transfers?${params}`;
      const response = await fetch(url, {
        headers: { "X-API-Key": MORALIS_API_KEY, "Accept": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Moralis API error: ${response.status} - ${errorText}`);
      }

      const data: MoralisResponse = await response.json();
      if (data.result?.length) {
        // Only keep transfers TO the target wallet
        const incoming = data.result.filter(
          (tx) => tx.to_address.toLowerCase() === wallet_address.toLowerCase()
        );
        allTransfers.push(...incoming);
      }

      cursor = data.cursor || null;
      pageCount++;
      if (pageCount < 50 && cursor) await new Promise((r) => setTimeout(r, 250));
    } while (cursor && pageCount < 50);

    console.log(`Fetched ${allTransfers.length} incoming CAMLY transfers`);

    // Aggregate by from_address
    const aggregated = new Map<string, { total_amount: number; tx_count: number }>();
    for (const tx of allTransfers) {
      const from = tx.from_address.toLowerCase();
      const decimals = parseInt(tx.token_decimals) || 3;
      const amount = Number(tx.value) / Math.pow(10, decimals);
      const existing = aggregated.get(from) || { total_amount: 0, tx_count: 0 };
      existing.total_amount += amount;
      existing.tx_count += 1;
      aggregated.set(from, existing);
    }

    const fromAddresses = Array.from(aggregated.keys());
    console.log(`Found ${fromAddresses.length} unique sender addresses`);

    // Match against profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, avatar_verified, wallet_address, created_at, banned")
      .not("wallet_address", "is", null);

    const walletToProfile = new Map<string, typeof profiles extends (infer T)[] ? T : never>();
    profiles?.forEach((p) => {
      if (p.wallet_address) {
        walletToProfile.set(p.wallet_address.toLowerCase(), p);
      }
    });

    const matchedUsers: Array<{
      user_id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      avatar_verified: boolean;
      wallet_address: string;
      total_amount: number;
      tx_count: number;
      created_at: string;
      banned: boolean;
    }> = [];

    const unmatchedWallets: Array<{
      wallet_address: string;
      total_amount: number;
      tx_count: number;
    }> = [];

    for (const [addr, stats] of aggregated) {
      const profile = walletToProfile.get(addr);
      if (profile) {
        matchedUsers.push({
          user_id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          avatar_verified: profile.avatar_verified ?? false,
          wallet_address: addr,
          total_amount: stats.total_amount,
          tx_count: stats.tx_count,
          created_at: profile.created_at,
          banned: profile.banned ?? false,
        });
      } else {
        unmatchedWallets.push({
          wallet_address: addr,
          total_amount: stats.total_amount,
          tx_count: stats.tx_count,
        });
      }
    }

    // Sort by total_amount desc
    matchedUsers.sort((a, b) => b.total_amount - a.total_amount);
    unmatchedWallets.sort((a, b) => b.total_amount - a.total_amount);

    console.log(`Matched: ${matchedUsers.length} users, Unmatched: ${unmatchedWallets.length} wallets`);

    return new Response(
      JSON.stringify({
        success: true,
        source: "onchain",
        matched_users: matchedUsers,
        unmatched_wallets: unmatchedWallets,
        total_transfers: allTransfers.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Wallet Detective On-chain error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
