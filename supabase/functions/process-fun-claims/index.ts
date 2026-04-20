// process-fun-claims — auto-mint FUN Money via FUNMoneyMinter on BSC Testnet
// Combo C+D+B: hot wallet auto for ≤200k FUN, daily cap per Trust tier, multisig fallback for whales
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { JsonRpcProvider, Wallet, Contract, parseUnits, keccak256, toUtf8Bytes } from 'https://esm.sh/ethers@6.13.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== CONFIG =====
const AUTO_MINT_THRESHOLD = 200_000;            // FUN — claims > này phải multisig
const MAX_ATTEMPTS = 5;                         // dừng retry sau 5 lần
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;          // 5 phút — coi là stale
const BATCH_SIZE = 5;                           // mỗi run xử lý tối đa 5 claim
const MIN_AMOUNT = 0.0001;                      // skip dust

const RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const CONTRACT_ADDRESS = '0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6';

const MINTER_ABI = [
  'function mintValidatedAction(bytes32 actionId, address user, uint256 totalMint, bytes32 validationDigest)',
  'function authorizedMinters(address) view returns (bool)',
  'function processedActionIds(bytes32) view returns (bool)',
];

function normalizeTier(tier: string | null, sybilRisk: number): string {
  const t = (tier || 'new').toLowerCase();
  if (sybilRisk >= 60) return 't0';
  if (['veteran', 't4'].includes(t)) return 'veteran';
  if (['trusted', 't3'].includes(t)) return 'trusted';
  if (['standard', 't2'].includes(t)) return 'standard';
  return 'new';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const treasuryKey = Deno.env.get('FUN_TREASURY_PRIVATE_KEY');
  if (!treasuryKey) return json({ error: 'FUN_TREASURY_PRIVATE_KEY not configured' }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { /* cron invocation — no body */ }
  const dryRun = body?.dry_run === true;
  const claimIdFilter: string | null = body?.claim_id ?? null;

  const cutoff = new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString();
  let claimsQ = supabase
    .from('claim_requests')
    .select('id, user_id, wallet_address, amount, status, processing_attempts, locked_at')
    .eq('claim_type', 'fun_money')
    .in('status', ['pending', 'approved'])
    .is('tx_hash', null)
    .lt('processing_attempts', MAX_ATTEMPTS)
    .or(`locked_at.is.null,locked_at.lt.${cutoff}`)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (claimIdFilter) {
    claimsQ = supabase
      .from('claim_requests')
      .select('id, user_id, wallet_address, amount, status, processing_attempts, locked_at')
      .eq('id', claimIdFilter)
      .limit(1);
  }

  const { data: claims, error: claimsErr } = await claimsQ;
  if (claimsErr) return json({ error: 'Failed to fetch claims', details: claimsErr.message }, 500);
  if (!claims?.length) return json({ ok: true, processed: 0, message: 'No claims to process' });

  // Setup signer
  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(treasuryKey, provider);
  const minter = new Contract(CONTRACT_ADDRESS, MINTER_ABI, wallet);

  try {
    const isAuthorized = await minter.authorizedMinters(wallet.address);
    if (!isAuthorized) {
      return json({
        error: 'Treasury wallet is not authorizedMinter on contract',
        wallet: wallet.address,
        contract: CONTRACT_ADDRESS,
        hint: 'Call setAuthorizedMinter(treasuryAddress, true) from owner',
      }, 500);
    }
  } catch (e: any) {
    return json({ error: 'Cannot reach contract', details: e.message, wallet: wallet.address }, 500);
  }

  const results: any[] = [];

  for (const claim of claims) {
    const result: any = { id: claim.id, user_id: claim.user_id, amount: Number(claim.amount) };
    const amount = Number(claim.amount);

    try {
      if (amount < MIN_AMOUNT) { result.status = 'skip_dust'; results.push(result); continue; }

      // Lock row
      const { error: lockErr } = await supabase
        .from('claim_requests')
        .update({
          locked_at: new Date().toISOString(),
          processing_attempts: claim.processing_attempts + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', claim.id)
        .or(`locked_at.is.null,locked_at.lt.${cutoff}`);
      if (lockErr) { result.status = 'lock_failed'; result.error = lockErr.message; results.push(result); continue; }

      // Threshold — > 200k FUN routed to multisig flow
      if (amount > AUTO_MINT_THRESHOLD) {
        await supabase.from('claim_requests').update({
          last_error: `Amount ${amount} > auto threshold ${AUTO_MINT_THRESHOLD} — needs multisig`,
          auto_eligible: false,
          locked_at: null,
        }).eq('id', claim.id);
        result.status = 'requires_multisig';
        results.push(result); continue;
      }

      // Trust tier → daily cap
      const { data: trust } = await supabase
        .from('trust_profile')
        .select('tier, sybil_risk')
        .eq('user_id', claim.user_id)
        .maybeSingle();
      const sybilRisk = Number(trust?.sybil_risk) || 0;
      const tier = normalizeTier(trust?.tier ?? null, sybilRisk);

      if (tier === 't0') {
        await supabase.from('claim_requests').update({
          last_error: `Sybil risk ${sybilRisk} too high`,
          auto_eligible: false, status: 'failed',
          error_message: 'Sybil risk quá cao, vui lòng liên hệ hỗ trợ.',
          locked_at: null,
        }).eq('id', claim.id);
        result.status = 'sybil_blocked';
        results.push(result); continue;
      }

      // Atomically reserve daily cap
      const { data: reserved, error: reserveErr } = await supabase.rpc('fun_auto_mint_reserve', {
        p_user_id: claim.user_id, p_amount: amount, p_tier: tier,
      });
      if (reserveErr) throw new Error(`Reserve failed: ${reserveErr.message}`);
      if (!reserved) {
        await supabase.from('claim_requests').update({
          last_error: `Daily cap reached for tier ${tier}`,
          auto_eligible: false, locked_at: null,
        }).eq('id', claim.id);
        result.status = 'daily_cap_reached';
        result.tier = tier;
        results.push(result); continue;
      }

      if (dryRun) {
        await supabase.rpc('fun_auto_mint_refund', { p_user_id: claim.user_id, p_amount: amount });
        await supabase.from('claim_requests').update({ locked_at: null }).eq('id', claim.id);
        result.status = 'dry_run_ok';
        result.tier = tier;
        results.push(result); continue;
      }

      // Build mint
      const totalWei = parseUnits(amount.toString(), 18);
      const actionId = keccak256(toUtf8Bytes(JSON.stringify({
        claim_id: claim.id, user: claim.wallet_address, amount: amount.toString(),
      })));
      const validationDigest = keccak256(toUtf8Bytes(JSON.stringify({
        source: 'auto-processor', tier, claim_id: claim.id, ts: Date.now(),
      })));

      // Idempotency — already processed on-chain?
      const alreadyDone = await minter.processedActionIds(actionId);
      if (alreadyDone) {
        await supabase.from('claim_requests').update({
          status: 'success', last_error: 'Already processed on-chain',
          auto_processed: true, locked_at: null,
        }).eq('id', claim.id);
        await supabase.rpc('fun_auto_mint_refund', { p_user_id: claim.user_id, p_amount: amount });
        result.status = 'already_onchain';
        results.push(result); continue;
      }

      const tx = await minter.mintValidatedAction(actionId, claim.wallet_address, totalWei, validationDigest);
      const receipt = await tx.wait();

      await supabase.from('claim_requests').update({
        status: 'success',
        tx_hash: receipt.hash,
        processed_at: new Date().toISOString(),
        auto_processed: true,
        auto_eligible: true,
        last_error: null,
        locked_at: null,
      }).eq('id', claim.id);

      result.status = 'minted';
      result.tx_hash = receipt.hash;
      result.tier = tier;
      results.push(result);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('Mint failed for', claim.id, msg);
      try { await supabase.rpc('fun_auto_mint_refund', { p_user_id: claim.user_id, p_amount: amount }); } catch {}

      const willRetry = (claim.processing_attempts + 1) < MAX_ATTEMPTS;
      await supabase.from('claim_requests').update({
        last_error: msg.slice(0, 500),
        status: willRetry ? claim.status : 'failed',
        error_message: willRetry ? null : msg.slice(0, 500),
        locked_at: null,
      }).eq('id', claim.id);

      result.status = 'error';
      result.error = msg;
      results.push(result);
    }
  }

  return json({ ok: true, processed: results.length, results });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
