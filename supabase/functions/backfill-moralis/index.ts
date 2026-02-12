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

// System wallet addresses
const SYSTEM_WALLETS = [
  "0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8",
  "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998",
  "0x7b32E82C64FF4f02dA024B47A8653e1707003339",
];

// Token configs for multi-token sync
const TOKEN_CONFIGS = [
  { contract: CAMLY_TOKEN, type: "CAMLY", symbol: "CAMLY" },
  { contract: USDT_TOKEN, type: "USDT", symbol: "USDT" },
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
  page: number;
  page_size: number;
}

interface BackfillResult {
  wallet: string;
  token: string;
  totalFetched: number;
  newInserted: number;
  duplicatesSkipped: number;
  errors: string[];
  lastBlockNumber: number;
}

async function fetchAllTransfers(
  wallet: string,
  apiKey: string,
  tokenContract: string,
  fromBlock?: number
): Promise<MoralisTokenTransfer[]> {
  const allTransfers: MoralisTokenTransfer[] = [];
  let cursor: string | null = null;
  let pageCount = 0;
  const maxPages = 500;

  do {
    const params = new URLSearchParams({
      chain: "bsc",
      limit: "100",
      order: "ASC",
    });
    
    params.append("contract_addresses[]", tokenContract);
    if (cursor) params.append("cursor", cursor);
    if (fromBlock) params.append("from_block", fromBlock.toString());

    const url = `${MORALIS_API_URL}/${wallet}/erc20/transfers?${params}`;
    console.log(`Fetching page ${pageCount + 1} for wallet ${wallet.slice(0, 10)}...`);

    const response = await fetch(url, {
      headers: { "X-API-Key": apiKey, "Accept": "application/json" }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moralis API error: ${response.status} - ${errorText}`);
    }

    const data: MoralisResponse = await response.json();
    if (data.result && Array.isArray(data.result)) {
      allTransfers.push(...data.result);
      console.log(`Page ${pageCount + 1}: fetched ${data.result.length} transfers, total: ${allTransfers.length}`);
    }

    cursor = data.cursor || null;
    pageCount++;
    await new Promise(r => setTimeout(r, 250));
  } while (cursor && pageCount < maxPages);

  console.log(`Finished fetching ${allTransfers.length} transfers for wallet ${wallet.slice(0, 10)}...`);
  return allTransfers;
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

    let wallets = SYSTEM_WALLETS;
    let dryRun = false;
    let fromBlock: number | undefined;
    let tokenFilter: string | undefined; // "CAMLY", "USDT", or undefined for both

    try {
      const body = await req.json();
      if (body.wallets && Array.isArray(body.wallets)) wallets = body.wallets;
      if (body.dryRun === true) dryRun = true;
      if (body.fromBlock && typeof body.fromBlock === 'number') fromBlock = body.fromBlock;
      if (body.token && typeof body.token === 'string') tokenFilter = body.token.toUpperCase();
    } catch { /* defaults */ }

    const tokensToSync = tokenFilter
      ? TOKEN_CONFIGS.filter(t => t.type === tokenFilter)
      : TOKEN_CONFIGS;

    console.log(`Starting backfill for ${wallets.length} wallets, tokens: ${tokensToSync.map(t => t.symbol).join(",")}, dryRun: ${dryRun}`);

    // Fetch wallet -> user_id mapping
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, wallet_address")
      .not("wallet_address", "is", null);

    const walletToUserId: Record<string, string> = {};
    profiles?.forEach((p: { id: string; wallet_address: string }) => {
      if (p.wallet_address) walletToUserId[p.wallet_address.toLowerCase()] = p.id;
    });

    console.log(`Mapped ${Object.keys(walletToUserId).length} wallet addresses to user IDs`);

    const results: BackfillResult[] = [];
    let totalNewTransactions = 0;
    let totalAmount = 0;

    for (const wallet of wallets) {
      for (const tokenCfg of tokensToSync) {
        const result: BackfillResult = {
          wallet: wallet.slice(0, 10) + "...",
          token: tokenCfg.symbol,
          totalFetched: 0,
          newInserted: 0,
          duplicatesSkipped: 0,
          errors: [],
          lastBlockNumber: 0,
        };

        try {
          // Get last synced block
          const { data: cursor } = await supabase
            .from("sync_cursors")
            .select("last_block_number")
            .eq("wallet_address", wallet.toLowerCase())
            .eq("chain_id", CHAIN_ID)
            .eq("token_contract", tokenCfg.contract)
            .single();

          const startBlock = fromBlock || ((cursor?.last_block_number || 0) + 1);

          const transfers = await fetchAllTransfers(wallet, MORALIS_API_KEY, tokenCfg.contract, startBlock);
          result.totalFetched = transfers.length;

          console.log(`Processing ${transfers.length} ${tokenCfg.symbol} transfers for ${wallet.slice(0, 10)}...`);

          for (const tx of transfers) {
            const decimals = parseInt(tx.token_decimals) || 18;
            const amount = Number(tx.value) / Math.pow(10, decimals);
            const fromUserId = walletToUserId[tx.from_address.toLowerCase()] || null;
            const toUserId = walletToUserId[tx.to_address.toLowerCase()] || null;
            const blockNum = parseInt(tx.block_number);
            if (blockNum > result.lastBlockNumber) result.lastBlockNumber = blockNum;

            const newTransaction = {
              chain_id: CHAIN_ID,
              token_contract: tokenCfg.contract,
              from_address: tx.from_address.toLowerCase(),
              to_address: tx.to_address.toLowerCase(),
              from_user_id: fromUserId,
              to_user_id: toUserId,
              amount,
              token_type: tokenCfg.type,
              tx_hash: tx.transaction_hash,
              log_index: parseInt(tx.log_index) || 0,
              block_number: blockNum,
              block_timestamp: tx.block_timestamp,
              status: "completed",
              created_at: tx.block_timestamp,
            };

            if (dryRun) {
              console.log("DRY RUN:", { tx_hash: tx.transaction_hash.slice(0, 16), amount, token: tokenCfg.symbol });
              result.newInserted++;
              totalAmount += amount;
            } else {
              const { data: existing } = await supabase
                .from("wallet_transactions")
                .select("id, block_timestamp")
                .eq("chain_id", CHAIN_ID)
                .eq("token_contract", tokenCfg.contract)
                .eq("tx_hash", tx.transaction_hash)
                .eq("log_index", parseInt(tx.log_index) || 0)
                .maybeSingle();

              if (existing) {
                if (!existing.block_timestamp && tx.block_timestamp) {
                  await supabase.from("wallet_transactions").update({ block_timestamp: tx.block_timestamp }).eq("id", existing.id);
                }
                result.duplicatesSkipped++;
                continue;
              }

              const { error: insertError } = await supabase.from("wallet_transactions").insert(newTransaction);
              if (insertError) {
                if (insertError.code === '23505') result.duplicatesSkipped++;
                else result.errors.push(`Insert error: ${insertError.message}`);
              } else {
                result.newInserted++;
                totalAmount += amount;
              }
            }
          }

          // Update sync cursor
          if (!dryRun && result.lastBlockNumber > 0) {
            await supabase.from("sync_cursors").upsert({
              wallet_address: wallet.toLowerCase(),
              chain_id: CHAIN_ID,
              token_contract: tokenCfg.contract,
              last_block_number: result.lastBlockNumber,
              last_sync_at: new Date().toISOString(),
              total_synced: result.newInserted + result.duplicatesSkipped,
            }, { onConflict: "wallet_address,chain_id,token_contract" });
          }

          totalNewTransactions += result.newInserted;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(errorMsg);
          console.error(`Error for ${wallet.slice(0, 10)} ${tokenCfg.symbol}:`, errorMsg);
        }

        results.push(result);
      }
    }

    const summary = {
      success: true,
      dryRun,
      totalWalletsProcessed: wallets.length,
      tokensProcessed: tokensToSync.map(t => t.symbol),
      totalNewTransactions,
      totalAmount,
      results,
      timestamp: new Date().toISOString(),
    };

    console.log("Backfill completed:", JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Backfill error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
