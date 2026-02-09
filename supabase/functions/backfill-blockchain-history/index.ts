import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System wallet addresses
const SYSTEM_WALLETS = [
  "0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8", // FUN PLAY TẶNG & THƯỞNG
  "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998", // FUN PLAY TREASURY
];

// CAMLY Token contract on BSC Mainnet
const CAMLY_TOKEN = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const BSCSCAN_API = "https://api.bscscan.com/api";

interface TokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
}

interface BackfillResult {
  wallet: string;
  totalFetched: number;
  newInserted: number;
  duplicatesSkipped: number;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BSCSCAN_API_KEY = Deno.env.get("BSCSCAN_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!BSCSCAN_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing BSCSCAN_API_KEY secret" }),
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
    
    try {
      const body = await req.json();
      if (body.wallets && Array.isArray(body.wallets)) {
        wallets = body.wallets;
      }
      if (body.dryRun === true) {
        dryRun = true;
      }
    } catch {
      // Use defaults if no body
    }

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
      };

      try {
        // Fetch token transfers from BSCScan
        const url = `${BSCSCAN_API}?module=account&action=tokentx` +
          `&contractaddress=${CAMLY_TOKEN}` +
          `&address=${wallet}` +
          `&startblock=0&endblock=99999999` +
          `&sort=asc` +
          `&apikey=${BSCSCAN_API_KEY}`;

        console.log(`Fetching transfers for wallet: ${wallet}`);
        console.log(`API URL: ${url.replace(BSCSCAN_API_KEY, "***")}`);

        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`BSCScan response status: ${data.status}, message: ${data.message}`);

        // Handle rate limiting or no transactions (result can be string when empty/error)
        if (data.status === "0") {
          // Check if it's "No transactions found" which is valid
          if (data.message === "No transactions found" || data.result === "No transactions found") {
            console.log(`No CAMLY transfers found for ${wallet}`);
            result.totalFetched = 0;
            results.push(result);
            continue;
          }
          // Real error
          result.errors.push(`BSCScan API error: ${data.message || data.result || "Unknown error"}`);
          results.push(result);
          continue;
        }
        
        if (!Array.isArray(data.result)) {
          result.errors.push(`BSCScan returned non-array result: ${JSON.stringify(data.result)}`);
          results.push(result);
          continue;
        }

        const transfers: TokenTransfer[] = data.result;
        result.totalFetched = transfers.length;

        console.log(`Found ${transfers.length} CAMLY transfers for ${wallet}`);

        for (const tx of transfers) {
          // Check if transaction already exists
          const { data: existing } = await supabase
            .from("wallet_transactions")
            .select("id")
            .eq("tx_hash", tx.hash)
            .maybeSingle();

          if (existing) {
            result.duplicatesSkipped++;
            continue;
          }

          // Also check in donation_transactions and claim_requests
          const { data: existingDonation } = await supabase
            .from("donation_transactions")
            .select("id")
            .eq("tx_hash", tx.hash)
            .maybeSingle();

          if (existingDonation) {
            result.duplicatesSkipped++;
            continue;
          }

          const { data: existingClaim } = await supabase
            .from("claim_requests")
            .select("id")
            .eq("tx_hash", tx.hash)
            .maybeSingle();

          if (existingClaim) {
            result.duplicatesSkipped++;
            continue;
          }

          // Calculate amount (CAMLY has 18 decimals)
          const decimals = parseInt(tx.tokenDecimal) || 18;
          const amount = Number(tx.value) / Math.pow(10, decimals);

          // Map addresses to user IDs
          const fromUserId = walletToUserId[tx.from.toLowerCase()] || null;
          const toUserId = walletToUserId[tx.to.toLowerCase()] || null;

          // Prepare transaction record
          const newTransaction = {
            from_address: tx.from,
            to_address: tx.to,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            amount: amount,
            token_type: "CAMLY",
            tx_hash: tx.hash,
            status: "completed",
            created_at: new Date(Number(tx.timeStamp) * 1000).toISOString(),
          };

          if (dryRun) {
            console.log("DRY RUN - Would insert:", newTransaction);
            result.newInserted++;
            totalAmount += amount;
          } else {
            // Insert new transaction
            const { error: insertError } = await supabase
              .from("wallet_transactions")
              .insert(newTransaction);

            if (insertError) {
              result.errors.push(`Insert error for tx ${tx.hash}: ${insertError.message}`);
            } else {
              result.newInserted++;
              totalAmount += amount;
            }
          }
        }

        totalNewTransactions += result.newInserted;
      } catch (err) {
        result.errors.push(`Error processing wallet ${wallet}: ${err.message}`);
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

    console.log("Backfill completed:", JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(summary),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Backfill error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
