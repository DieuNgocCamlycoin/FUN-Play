import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constants
const CAMLY_TOKEN = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const USDT_TOKEN = "0x55d398326f99059ff775485246999027b3197955";
const MORALIS_API_URL = "https://deep-index.moralis.io/api/v2.2";
const CHAIN_ID = 56;

const SYSTEM_WALLETS = [
  "0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8",
  "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998",
  "0x7b32E82C64FF4f02dA024B47A8653e1707003339",
];

const TOKEN_CONFIGS = [
  { contract: CAMLY_TOKEN, type: "CAMLY" },
  { contract: USDT_TOKEN, type: "USDT" },
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

async function fetchRecentTransfers(
  wallet: string,
  apiKey: string,
  tokenContract: string,
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
    params.append("contract_addresses[]", tokenContract);
    if (cursor) params.append("cursor", cursor);

    const url = `${MORALIS_API_URL}/${wallet}/erc20/transfers?${params}`;
    const response = await fetch(url, {
      headers: { "X-API-Key": apiKey, "Accept": "application/json" }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moralis API error: ${response.status} - ${errorText}`);
    }

    const data: MoralisResponse = await response.json();
    if (data.result && Array.isArray(data.result)) transfers.push(...data.result);
    cursor = data.cursor || null;
    await new Promise(r => setTimeout(r, 200));
  } while (cursor);

  return transfers;
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let source = "manual";
    try { const body = await req.json(); source = body.source || "manual"; } catch { /* no body */ }

    console.log(`[sync-cron] Starting sync, source: ${source}`);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, wallet_address")
      .not("wallet_address", "is", null);

    const walletToUserId: Record<string, string> = {};
    profiles?.forEach((p: { id: string; wallet_address: string }) => {
      if (p.wallet_address) walletToUserId[p.wallet_address.toLowerCase()] = p.id;
    });

    const results: { wallet: string; token: string; fromBlock: number; newTransfers: number; errors: string[] }[] = [];
    let totalNewTransfers = 0;

    for (const wallet of SYSTEM_WALLETS) {
      for (const tokenCfg of TOKEN_CONFIGS) {
        const result = { wallet: wallet.slice(0, 10) + "...", token: tokenCfg.type, fromBlock: 0, newTransfers: 0, errors: [] as string[] };

        try {
          const { data: cursor } = await supabase
            .from("sync_cursors")
            .select("last_block_number")
            .eq("wallet_address", wallet.toLowerCase())
            .eq("chain_id", CHAIN_ID)
            .eq("token_contract", tokenCfg.contract)
            .single();

          const lastBlock = cursor?.last_block_number || 0;
          result.fromBlock = lastBlock + 1;

          const transfers = await fetchRecentTransfers(wallet, MORALIS_API_KEY, tokenCfg.contract, result.fromBlock);
          console.log(`[${wallet.slice(0, 10)}][${tokenCfg.type}] Found ${transfers.length} new transfers`);

          let maxBlockNumber = lastBlock;

          for (const tx of transfers) {
            const decimals = parseInt(tx.token_decimals) || 18;
            const amount = Number(tx.value) / Math.pow(10, decimals);
            const blockNum = parseInt(tx.block_number);
            if (blockNum > maxBlockNumber) maxBlockNumber = blockNum;

            const fromUserId = walletToUserId[tx.from_address.toLowerCase()] || null;
            const toUserId = walletToUserId[tx.to_address.toLowerCase()] || null;
            const logIndex = parseInt(tx.log_index) || 0;

            const { data: existing } = await supabase
              .from("wallet_transactions")
              .select("id")
              .eq("chain_id", CHAIN_ID)
              .eq("token_contract", tokenCfg.contract)
              .eq("tx_hash", tx.transaction_hash)
              .eq("log_index", logIndex)
              .maybeSingle();

            if (existing) continue;

            const { error: insertError } = await supabase
              .from("wallet_transactions")
              .insert({
                chain_id: CHAIN_ID,
                token_contract: tokenCfg.contract,
                from_address: tx.from_address.toLowerCase(),
                to_address: tx.to_address.toLowerCase(),
                from_user_id: fromUserId,
                to_user_id: toUserId,
                amount,
                token_type: tokenCfg.type,
                tx_hash: tx.transaction_hash,
                log_index: logIndex,
                block_number: blockNum,
                block_timestamp: tx.block_timestamp,
                status: "completed",
                created_at: tx.block_timestamp,
              });

            if (!insertError) result.newTransfers++;
          }

          totalNewTransfers += result.newTransfers;

          if (maxBlockNumber > lastBlock) {
            await supabase.from("sync_cursors").upsert({
              wallet_address: wallet.toLowerCase(),
              chain_id: CHAIN_ID,
              token_contract: tokenCfg.contract,
              last_block_number: maxBlockNumber,
              last_sync_at: new Date().toISOString(),
              total_synced: (cursor?.last_block_number || 0) + result.newTransfers,
            }, { onConflict: "wallet_address,chain_id,token_contract" });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(errorMsg);
          console.error(`[${wallet.slice(0, 10)}][${tokenCfg.type}] Error:`, errorMsg);
        }

        results.push(result);
      }
    }

    const summary = { success: true, source, totalNewTransfers, results, timestamp: new Date().toISOString() };
    console.log("[sync-cron] Completed:", JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[sync-cron] Error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
