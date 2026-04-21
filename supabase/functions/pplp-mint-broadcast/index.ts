// pplp-mint-broadcast — Phase B3 (cron 1m)
// Picks rows where status='signed' AND tx_hash IS NULL, calls
// FUNMoneyProductionV1_2_1.lockWithPPLP(user, action, amount, evidenceHash, sigs[]).
// Treasury wallet (FUN_TREASURY_PRIVATE_KEY) pays gas.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits } from 'https://esm.sh/ethers@6.13.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FUN_CONTRACT = '0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6';
const RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';

const LOCK_ABI = [
  'function lockWithPPLP(address user, string action, uint256 amount, bytes32 evidenceHash, bytes[] sigs) external',
  'function nonces(address) view returns (uint256)',
];

const MAX_ATTEMPTS = 5;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const BATCH_SIZE = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const treasuryKey = Deno.env.get('FUN_TREASURY_PRIVATE_KEY');
  if (!treasuryKey) return j({ error: 'FUN_TREASURY_PRIVATE_KEY not set' }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { /* cron */ }
  const dryRun = body?.dry_run === true;
  const requestIdFilter: string | null = body?.request_id ?? null;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const cutoff = new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString();

  let q = admin
    .from('pplp_mint_requests_v2')
    .select('*')
    .eq('status', 'signed')
    .is('tx_hash', null)
    .lt('processing_attempts', MAX_ATTEMPTS)
    .or(`locked_at.is.null,locked_at.lt.${cutoff}`)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (requestIdFilter) {
    q = admin.from('pplp_mint_requests_v2').select('*').eq('id', requestIdFilter).limit(1);
  }

  const { data: rows, error: fetchErr } = await q;
  if (fetchErr) return j({ error: 'Fetch failed', details: fetchErr.message }, 500);

  if (!rows || rows.length === 0) {
    return j({ ok: true, processed: 0, message: 'No signed requests pending broadcast' });
  }

  const provider = new JsonRpcProvider(RPC_URL);
  const treasury = new Wallet(treasuryKey, provider);
  const fun = new Contract(FUN_CONTRACT, LOCK_ABI, treasury);

  // Pre-flight gas
  const bnb = await provider.getBalance(treasury.address);
  if (bnb < parseUnits('0.005', 18)) {
    return j({
      error: 'Treasury BNB too low for gas',
      treasury: treasury.address,
      bnb_balance: formatUnits(bnb, 18),
    }, 500);
  }

  const results: any[] = [];

  for (const row of rows) {
    const result: any = { id: row.id, recipient: row.recipient_address, amount_wei: row.amount_wei };

    try {
      // Lock row to prevent concurrent broadcast
      const { error: lockErr } = await admin
        .from('pplp_mint_requests_v2')
        .update({
          status: 'broadcasting',
          locked_at: new Date().toISOString(),
          processing_attempts: (row.processing_attempts ?? 0) + 1,
        })
        .eq('id', row.id)
        .or(`locked_at.is.null,locked_at.lt.${cutoff}`);

      if (lockErr) {
        result.status = 'lock_failed';
        result.error = lockErr.message;
        results.push(result);
        continue;
      }

      // Re-check on-chain nonce sanity
      const onchainNonce: bigint = await fun.nonces(row.recipient_address);
      if (BigInt(row.nonce) !== onchainNonce) {
        // Nonce drift — mark for re-creation
        await admin.from('pplp_mint_requests_v2').update({
          status: 'failed',
          error_message: `Nonce drift: db=${row.nonce} chain=${onchainNonce.toString()}. Re-create request.`,
          locked_at: null,
        }).eq('id', row.id);
        result.status = 'nonce_drift';
        result.db_nonce = row.nonce.toString();
        result.chain_nonce = onchainNonce.toString();
        results.push(result);
        continue;
      }

      const sigs: Array<{ attester: string; signature: string }> =
        Array.isArray(row.signatures) ? row.signatures : [];
      const sigBytesArr = sigs.map((s) => s.signature);

      if (dryRun) {
        await admin.from('pplp_mint_requests_v2').update({
          status: 'signed',
          locked_at: null,
        }).eq('id', row.id);
        result.status = 'dry_run_ok';
        result.sig_count = sigBytesArr.length;
        results.push(result);
        continue;
      }

      // === BROADCAST lockWithPPLP ===
      const tx = await fun.lockWithPPLP(
        row.recipient_address,
        row.action_name,
        BigInt(row.amount_wei),
        row.evidence_hash,
        sigBytesArr,
      );
      const receipt = await tx.wait();

      await admin.from('pplp_mint_requests_v2').update({
        status: 'minted',
        tx_hash: receipt.hash,
        block_number: receipt.blockNumber,
        minted_at: new Date().toISOString(),
        locked_at: null,
        error_message: null,
      }).eq('id', row.id);

      result.status = 'minted';
      result.tx_hash = receipt.hash;
      result.block_number = receipt.blockNumber;
      results.push(result);
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || String(err);
      console.error('[broadcast] tx failed', row.id, msg);

      const willRetry = ((row.processing_attempts ?? 0) + 1) < MAX_ATTEMPTS;
      await admin.from('pplp_mint_requests_v2').update({
        status: willRetry ? 'signed' : 'failed',
        error_message: msg.slice(0, 500),
        locked_at: null,
      }).eq('id', row.id);

      result.status = willRetry ? 'retry' : 'failed';
      result.error = msg;
      results.push(result);
    }
  }

  return j({
    ok: true,
    processed: results.length,
    treasury: treasury.address,
    results,
  });
});

function j(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
