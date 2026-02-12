import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constants
const CAMLY_TOKEN = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const MORALIS_API_URL = "https://deep-index.moralis.io/api/v2.2";
const CHAIN_ID = 56;

// System wallet addresses
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
  page: number;
  page_size: number;
}

interface BackfillResult {
  wallet: string;
  totalFetched: number;
  newInserted: number;
  duplicatesSkipped: number;
  errors: string[];
  lastBlockNumber: number;
}

/**
 * Fetch ALL token transfers for a wallet using Moralis cursor pagination
 */
async function fetchAllTransfers(
  wallet: string,
  apiKey: string,
  fromBlock?: number
): Promise<MoralisTokenTransfer[]> {
  const allTransfers: MoralisTokenTransfer[] = [];
  let cursor: string | null = null;
  let pageCount = 0;
  const maxPages = 500; // Safety limit

  do {
    const params = new URLSearchParams({
      chain: "bsc",
      limit: "100",
      order: "ASC",
    });
    
    // Filter by CAMLY token
    params.append("contract_addresses[]", CAMLY_TOKEN);
    
    if (cursor) params.append("cursor", cursor);
    if (fromBlock) params.append("from_block", fromBlock.toString());

    const url = `${MORALIS_API_URL}/${wallet}/erc20/transfers?${params}`;

    console.log(`Fetching page ${pageCount + 1} for wallet ${wallet.slice(0, 10)}...`);

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
      allTransfers.push(...data.result);
      console.log(`Page ${pageCount + 1}: fetched ${data.result.length} transfers, total: ${allTransfers.length}`);
    }

    cursor = data.cursor || null;
    pageCount++;

    // Rate limit protection: 250ms delay
    await new Promise(r => setTimeout(r, 250));

  } while (cursor && pageCount < maxPages);

  console.log(`Finished fetching ${allTransfers.length} transfers for wallet ${wallet.slice(0, 10)}...`);
  return allTransfers;
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

    if (!MORALIS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing MORALIS_API_KEY secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for optional parameters
    let wallets = SYSTEM_WALLETS;
    let dryRun = false;
    let fromBlock: number | undefined;

    try {
      const body = await req.json();
      if (body.wallets && Array.isArray(body.wallets)) {
        wallets = body.wallets;
      }
      if (body.dryRun === true) {
        dryRun = true;
      }
      if (body.fromBlock && typeof body.fromBlock === 'number') {
        fromBlock = body.fromBlock;
      }
    } catch {
      // Use defaults if no body
    }

    console.log(`Starting Moralis backfill for ${wallets.length} wallets, dryRun: ${dryRun}`);

    // Fetch all wallet addresses -> user_id mapping
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, wallet_address")
      .not("wallet_address", "is", null);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
    }

    const walletToUserId: Record<string, string> = {};
    profiles?.forEach((p: { id: string; wallet_address: string }) => {
      if (p.wallet_address) {
        walletToUserId[p.wallet_address.toLowerCase()] = p.id;
      }
    });

    console.log(`Mapped ${Object.keys(walletToUserId).length} wallet addresses to user IDs`);

    const results: BackfillResult[] = [];
    let totalNewTransactions = 0;
    let totalAmount = 0;

    for (const wallet of wallets) {
      const result: BackfillResult = {
        wallet,
        totalFetched: 0,
        newInserted: 0,
        duplicatesSkipped: 0,
        errors: [],
        lastBlockNumber: 0,
      };

      try {
        // Fetch token transfers from Moralis
        const transfers = await fetchAllTransfers(wallet, MORALIS_API_KEY, fromBlock);
        result.totalFetched = transfers.length;

        console.log(`Processing ${transfers.length} transfers for wallet: ${wallet.slice(0, 10)}...`);

        for (const tx of transfers) {
          // Calculate amount (CAMLY has 18 decimals)
          const decimals = parseInt(tx.token_decimals) || 18;
          const amount = Number(tx.value) / Math.pow(10, decimals);

          // Map addresses to user IDs
          const fromUserId = walletToUserId[tx.from_address.toLowerCase()] || null;
          const toUserId = walletToUserId[tx.to_address.toLowerCase()] || null;

          // Track last block
          const blockNum = parseInt(tx.block_number);
          if (blockNum > result.lastBlockNumber) {
            result.lastBlockNumber = blockNum;
          }

          // Prepare transaction record
          const newTransaction = {
            chain_id: CHAIN_ID,
            token_contract: CAMLY_TOKEN,
            from_address: tx.from_address.toLowerCase(),
            to_address: tx.to_address.toLowerCase(),
            from_user_id: fromUserId,
            to_user_id: toUserId,
            amount: amount,
            token_type: "CAMLY",
            tx_hash: tx.transaction_hash,
            log_index: parseInt(tx.log_index) || 0,
            block_number: blockNum,
            block_timestamp: tx.block_timestamp,
            status: "completed",
            created_at: tx.block_timestamp,
          };

          if (dryRun) {
            console.log("DRY RUN - Would insert:", {
              tx_hash: newTransaction.tx_hash.slice(0, 16) + "...",
              amount: newTransaction.amount,
              log_index: newTransaction.log_index
            });
            result.newInserted++;
            totalAmount += amount;
          } else {
            // Check if already exists (COALESCE index workaround)
            const { data: existing } = await supabase
              .from("wallet_transactions")
              .select("id, block_timestamp")
              .eq("chain_id", CHAIN_ID)
              .eq("token_contract", CAMLY_TOKEN)
              .eq("tx_hash", tx.transaction_hash)
              .eq("log_index", parseInt(tx.log_index) || 0)
              .maybeSingle();

            if (existing) {
              // Update block_timestamp if missing
              if (!existing.block_timestamp && tx.block_timestamp) {
                await supabase
                  .from("wallet_transactions")
                  .update({ block_timestamp: tx.block_timestamp })
                  .eq("id", existing.id);
                console.log(`Updated timestamp for tx ${tx.transaction_hash.slice(0, 16)}...`);
              }
              result.duplicatesSkipped++;
              continue;
            }

            // Insert new transaction
            const { error: insertError } = await supabase
              .from("wallet_transactions")
              .insert(newTransaction);

            if (insertError) {
              // Check if it's a duplicate error (race condition)
              if (insertError.code === '23505') {
                result.duplicatesSkipped++;
              } else {
                result.errors.push(`Insert error for tx ${tx.transaction_hash}: ${insertError.message}`);
              }
            } else {
              result.newInserted++;
              totalAmount += amount;
            }
          }
        }

        // Update sync_cursors
        if (!dryRun && result.lastBlockNumber > 0) {
          await supabase
            .from("sync_cursors")
            .upsert({
              wallet_address: wallet.toLowerCase(),
              chain_id: CHAIN_ID,
              token_contract: CAMLY_TOKEN,
              last_block_number: result.lastBlockNumber,
              last_sync_at: new Date().toISOString(),
              total_synced: result.newInserted + result.duplicatesSkipped,
            }, {
              onConflict: "wallet_address,chain_id,token_contract"
            });
        }

        totalNewTransactions += result.newInserted;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Error processing wallet ${wallet}: ${errorMsg}`);
        console.error(`Error for wallet ${wallet}:`, errorMsg);
      }

      results.push(result);
    }

    // Summary
    const summary = {
      success: true,
      dryRun,
      totalWalletsProcessed: wallets.length,
      totalNewTransactions,
      totalAmountCAMLY: totalAmount,
      results,
      timestamp: new Date().toISOString(),
    };

    console.log("Backfill completed:", JSON.stringify({
      ...summary,
      results: results.map(r => ({
        wallet: r.wallet.slice(0, 10) + "...",
        totalFetched: r.totalFetched,
        newInserted: r.newInserted,
        duplicatesSkipped: r.duplicatesSkipped,
        errors: r.errors.length
      }))
    }, null, 2));

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Backfill error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
