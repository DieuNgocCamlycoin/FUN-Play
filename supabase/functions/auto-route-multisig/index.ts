/**
 * Auto-Route Multisig Edge Function
 * 
 * Automatically routes approved mint_requests to pplp_mint_requests
 * without requiring admin to manually click "Multisig 3/3".
 * 
 * Triggered by DB webhook when mint_requests.status changes to 'approved'.
 * Reads nonce from BSC Testnet RPC, computes hashes, inserts pplp record.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// BSC Testnet config
const BSC_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const CONTRACT_ADDRESS = "0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6";
const CONTRACT_ACTION = "FUN_REWARD";
const REQUIRED_GROUPS = ["will", "wisdom", "love"];

// Minimal ABI encoding for nonces(address) call
function encodeNoncesCall(address: string): string {
  const selector = "7ecebe00"; // keccak256("nonces(address)") first 4 bytes
  const addr = address.toLowerCase().replace("0x", "").padStart(64, "0");
  return "0x" + selector + addr;
}

async function getNonceFromRPC(address: string): Promise<bigint> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [
      { to: CONTRACT_ADDRESS, data: encodeNoncesCall(address) },
      "latest",
    ],
  });

  const res = await fetch(BSC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return BigInt(json.result);
}

// keccak256 using SubtleCrypto (not available natively, use simple approach)
// We need keccak256 - use a minimal implementation
async function keccak256(input: string): Promise<string> {
  // Use ethers-compatible keccak from a CDN
  const { keccak256: k, toUtf8Bytes } = await import(
    "https://esm.sh/ethers@6.13.4/crypto"
  );
  const { toUtf8Bytes: toBytes } = await import(
    "https://esm.sh/ethers@6.13.4"
  );
  return k(toBytes(input));
}

async function createActionHash(actionType: string): Promise<string> {
  const { keccak256: k, toUtf8Bytes } = await import(
    "https://esm.sh/ethers@6.13.4"
  );
  return k(toUtf8Bytes(actionType));
}

async function createEvidenceHash(data: object): Promise<string> {
  const { keccak256: k, toUtf8Bytes } = await import(
    "https://esm.sh/ethers@6.13.4"
  );
  return k(toUtf8Bytes(JSON.stringify(data)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Accept either a webhook payload or a manual trigger
    let mintRequestIds: string[] = [];

    const body = await req.json().catch(() => ({}));

    if (body.record?.id) {
      // DB webhook trigger - single record
      mintRequestIds = [body.record.id];
    } else if (body.ids && Array.isArray(body.ids)) {
      // Manual trigger with specific IDs
      mintRequestIds = body.ids;
    } else {
      // Auto-detect: find all approved requests not yet routed
      const { data: pending } = await supabase
        .from("mint_requests")
        .select("id")
        .eq("status", "approved")
        .is("decision_reason", null)
        .limit(50);

      mintRequestIds = (pending || []).map((r: any) => r.id);
    }

    if (mintRequestIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No requests to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load full request data
    const { data: requests, error: loadErr } = await supabase
      .from("mint_requests")
      .select("*")
      .in("id", mintRequestIds)
      .eq("status", "approved");

    if (loadErr) throw new Error(`Load error: ${loadErr.message}`);
    if (!requests || requests.length === 0) {
      return new Response(
        JSON.stringify({ message: "No approved requests found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out already-routed (decision_reason contains 'Multisig')
    const toProcess = requests.filter(
      (r: any) =>
        !r.decision_reason?.includes("Multisig") &&
        r.calculated_amount_atomic &&
        r.calculated_amount_atomic !== "0"
    );

    if (toProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: "All requests already routed or invalid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by user for consolidation
    const grouped = new Map<string, any[]>();
    for (const r of toProcess) {
      const list = grouped.get(r.user_id) || [];
      list.push(r);
      grouped.set(r.user_id, list);
    }

    const results: string[] = [];
    let success = 0;
    let fail = 0;

    for (const [userId, userRequests] of grouped) {
      try {
        const walletAddress = userRequests[0].user_wallet_address;
        const platformId = userRequests[0].platform_id;

        // Sum amounts
        let totalAmount = 0n;
        const sourceIds: string[] = [];
        const actionTypes = new Set<string>();

        for (const r of userRequests) {
          totalAmount += BigInt(r.calculated_amount_atomic || "0");
          sourceIds.push(r.id);
          actionTypes.add(r.action_type);
        }

        if (totalAmount === 0n) {
          fail++;
          results.push(`${walletAddress.slice(0, 10)}: Amount = 0, skipped`);
          continue;
        }

        // Check if there's already a pending multisig for this user
        const { data: existing } = await supabase
          .from("pplp_mint_requests")
          .select("id")
          .eq("user_id", userId)
          .in("status", ["pending_sig", "signing"])
          .limit(1);

        // Read nonce from on-chain
        const nonce = await getNonceFromRPC(walletAddress);

        const consolidatedAction =
          userRequests.length === 1
            ? userRequests[0].action_type
            : "CONSOLIDATED";

        const actionHash = await createActionHash(CONTRACT_ACTION);
        const evidenceHash = await createEvidenceHash({
          actionType: CONTRACT_ACTION,
          timestamp: Math.floor(Date.now() / 1000),
          consolidated: userRequests.length > 1,
          source_count: userRequests.length,
          source_ids: sourceIds,
          action_types: Array.from(actionTypes),
        });

        // Insert pplp_mint_requests
        const { data: multisigRecord, error: insertErr } = await supabase
          .from("pplp_mint_requests")
          .insert({
            user_id: userId,
            recipient_address: walletAddress,
            action_type: consolidatedAction,
            amount: Number(totalAmount) / 1e18,
            amount_wei: totalAmount.toString(),
            action_hash: actionHash,
            evidence_hash: evidenceHash,
            nonce: nonce.toString(),
            status: "pending_sig",
            multisig_required_groups: REQUIRED_GROUPS,
            multisig_completed_groups: [],
            multisig_signatures: {},
            platform_id: platformId,
            source_mint_request_id: sourceIds[0],
          })
          .select()
          .single();

        if (insertErr)
          throw new Error(`Insert failed: ${insertErr.message}`);

        // Mark source requests as routed
        const reason =
          userRequests.length > 1
            ? `Auto-consolidated ${userRequests.length} requests → Multisig 3/3 (pplp_mint_requests.id: ${multisigRecord.id})`
            : `Auto-routed to Multisig 3/3 (pplp_mint_requests.id: ${multisigRecord.id})`;

        for (const r of userRequests) {
          await supabase
            .from("mint_requests")
            .update({
              decision_reason: reason,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", r.id);
        }

        const totalFun = (Number(totalAmount) / 1e18).toFixed(2);
        results.push(
          `✅ ${walletAddress.slice(0, 10)}: ${userRequests.length} req → ${totalFun} FUN`
        );
        success++;
      } catch (err: any) {
        fail++;
        results.push(`❌ ${userId.slice(0, 8)}: ${err.message?.slice(0, 100)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success,
        fail,
        total: toProcess.length,
        details: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
