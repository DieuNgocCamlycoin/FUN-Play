import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constants
const CAMLY_TOKEN = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const MORALIS_API_URL = "https://deep-index.moralis.io/api/v2.2";
const CHAIN_ID = 56;

// System wallet addresses to always sync
const SYSTEM_WALLETS = [
  "0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8", // FUN PLAY TẶNG & THƯỞNG
  "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998", // Ví tặng thưởng 1
  "0x7b32E82C64FF4f02dA024B47A8653e1707003339", // Ví tặng thưởng 2
];

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

interface SyncResult {
  wallet: string;
  fromBlock: number;
  toBlock: number;
  newTransfers: number;
  errors: string[];
}

/**
 * Fetch recent transfers since a specific block
 */
async function fetchRecentTransfers(
  wallet: string,
  apiKey: string,
  fromBlock: number
): Promise<MoralisTokenTransfer[]> {
  const transfers: MoralisTokenTransfer[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({
      chain: "bsc",
      limit: "100",
      order: "ASC",
      from_block: fromBlock.toString(),
    });
    
    params.append("contract_addresses[]", CAMLY_TOKEN);
    
    if (cursor) params.append("cursor", cursor);

    const url = `${MORALIS_API_URL}/${wallet}/erc20/transfers?${params}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moralis API error: ${response.status} - ${errorText}`);
    }

    const data: MoralisResponse = await response.json();

    if (data.result && Array.isArray(data.result)) {
      transfers.push(...data.result);
    }

    cursor = data.cursor || null;

    // Rate limit protection
    await new Promise(r => setTimeout(r, 200));

  } while (cursor);

  return transfers;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check source (cron or manual)
    let source = "manual";
    try {
      const body = await req.json();
      source = body.source || "manual";
    } catch {
      // No body
    }

    console.log(`[sync-transactions-cron] Starting sync, source: ${source}`);

    // Fetch wallet -> user_id mapping
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, wallet_address")
      .not("wallet_address", "is", null);

    const walletToUserId: Record<string, string> = {};
    profiles?.forEach((p: { id: string; wallet_address: string }) => {
      if (p.wallet_address) {
        walletToUserId[p.wallet_address.toLowerCase()] = p.id;
      }
    });

    const results: SyncResult[] = [];
    let totalNewTransfers = 0;

    for (const wallet of SYSTEM_WALLETS) {
      const result: SyncResult = {
        wallet: wallet.slice(0, 10) + "...",
        fromBlock: 0,
        toBlock: 0,
        newTransfers: 0,
        errors: [],
      };

      try {
        // Get last synced block from sync_cursors
        const { data: cursor } = await supabase
          .from("sync_cursors")
          .select("last_block_number")
          .eq("wallet_address", wallet.toLowerCase())
          .eq("chain_id", CHAIN_ID)
          .eq("token_contract", CAMLY_TOKEN)
          .single();

        const lastBlock = cursor?.last_block_number || 0;
        result.fromBlock = lastBlock + 1;

        console.log(`[${wallet.slice(0, 10)}] Syncing from block ${result.fromBlock}`);

        // Fetch new transfers
        const transfers = await fetchRecentTransfers(wallet, MORALIS_API_KEY, result.fromBlock);
        
        console.log(`[${wallet.slice(0, 10)}] Found ${transfers.length} new transfers`);

        let maxBlockNumber = lastBlock;

        for (const tx of transfers) {
          const decimals = parseInt(tx.token_decimals) || 18;
          const amount = Number(tx.value) / Math.pow(10, decimals);
          const blockNum = parseInt(tx.block_number);

          if (blockNum > maxBlockNumber) {
            maxBlockNumber = blockNum;
          }

          const fromUserId = walletToUserId[tx.from_address.toLowerCase()] || null;
          const toUserId = walletToUserId[tx.to_address.toLowerCase()] || null;
          const logIndex = parseInt(tx.log_index) || 0;

          // Check if already exists (COALESCE index workaround)
          const { data: existing } = await supabase
            .from("wallet_transactions")
            .select("id")
            .eq("chain_id", CHAIN_ID)
            .eq("token_contract", CAMLY_TOKEN)
            .eq("tx_hash", tx.transaction_hash)
            .eq("log_index", logIndex)
            .maybeSingle();

          if (existing) {
            continue; // Skip duplicate
          }

          const { error: insertError } = await supabase
            .from("wallet_transactions")
            .insert({
              chain_id: CHAIN_ID,
              token_contract: CAMLY_TOKEN,
              from_address: tx.from_address.toLowerCase(),
              to_address: tx.to_address.toLowerCase(),
              from_user_id: fromUserId,
              to_user_id: toUserId,
              amount: amount,
              token_type: "CAMLY",
              tx_hash: tx.transaction_hash,
              log_index: logIndex,
              block_number: blockNum,
              block_timestamp: tx.block_timestamp,
              status: "completed",
              created_at: tx.block_timestamp,
            });

          if (!insertError) {
            result.newTransfers++;
          }
        }

        result.toBlock = maxBlockNumber;
        totalNewTransfers += result.newTransfers;

        // Update sync cursor
        if (maxBlockNumber > lastBlock) {
          await supabase
            .from("sync_cursors")
            .upsert({
              wallet_address: wallet.toLowerCase(),
              chain_id: CHAIN_ID,
              token_contract: CAMLY_TOKEN,
              last_block_number: maxBlockNumber,
              last_sync_at: new Date().toISOString(),
              total_synced: (cursor?.last_block_number || 0) + result.newTransfers,
            }, {
              onConflict: "wallet_address,chain_id,token_contract"
            });
        }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        result.errors.push(errorMsg);
        console.error(`[${wallet.slice(0, 10)}] Error:`, errorMsg);
      }

      results.push(result);
    }

    const summary = {
      success: true,
      source,
      totalNewTransfers,
      results,
      timestamp: new Date().toISOString(),
    };

    console.log("[sync-transactions-cron] Completed:", JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[sync-transactions-cron] Error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
