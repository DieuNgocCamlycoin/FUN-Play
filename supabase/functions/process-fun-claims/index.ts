// process-fun-claims — Auto-transfer FUN from treasury after GOV 3/3 signed
// Quy trình 6 bước (Bước 5): Cron 30 phút, dùng transfer() từ treasury 0x02D5
// Picks claims where (gov_required=false OR gov_signatures_count>=3) AND tx_hash IS NULL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits } from 'https://esm.sh/ethers@6.13.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== CONFIG =====
const MAX_ATTEMPTS = 5;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const BATCH_SIZE = 5;
const MIN_AMOUNT = 0.0001;

// BSC Testnet RPC + FUN ERC20 contract (FUN token deployed on testnet, chain 97)
const RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const FUN_TOKEN_ADDRESS = '0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6';

// FUN token has mint() — treasury wallet 0x02D5 holds MINTER_ROLE
// We MINT new tokens (per PPLP: mint từ action), NOT transfer from pre-funded balance
const FUN_ABI = [
  'function mint(address to, uint256 amount)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const treasuryKey = Deno.env.get('FUN_TREASURY_PRIVATE_KEY');
  if (!treasuryKey) return json({ error: 'FUN_TREASURY_PRIVATE_KEY not configured' }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { /* cron — no body */ }
  const dryRun = body?.dry_run === true;
  const claimIdFilter: string | null = body?.claim_id ?? null;

  // ─── Pick claims ready for chain ───
  const cutoff = new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString();
  let baseQ = supabase
    .from('claim_requests')
    .select('id, user_id, wallet_address, amount, status, processing_attempts, locked_at, gov_required, gov_signatures_count, epoch_id')
    .eq('claim_type', 'fun_money')
    .in('status', ['pending', 'approved', 'approved_for_chain'])
    .is('tx_hash', null)
    .lt('processing_attempts', MAX_ATTEMPTS)
    .or(`locked_at.is.null,locked_at.lt.${cutoff}`)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (claimIdFilter) {
    baseQ = supabase
      .from('claim_requests')
      .select('id, user_id, wallet_address, amount, status, processing_attempts, locked_at, gov_required, gov_signatures_count, epoch_id')
      .eq('id', claimIdFilter)
      .limit(1);
  }

  const { data: rawClaims, error: claimsErr } = await baseQ;
  if (claimsErr) return json({ error: 'Failed to fetch claims', details: claimsErr.message }, 500);

  // Filter: GOV ready (legacy bypass OR 3/3 signed)
  const claims = (rawClaims || []).filter(c =>
    c.gov_required === false || (Number(c.gov_signatures_count) >= 3)
  );

  if (!claims.length) {
    return json({
      ok: true,
      processed: 0,
      total_pending: rawClaims?.length ?? 0,
      message: 'No claims chain-ready (waiting GOV signatures or none pending)',
    });
  }

  // ─── Setup signer + ERC20 contract ───
  const provider = new JsonRpcProvider(RPC_URL);
  const treasury = new Wallet(treasuryKey, provider);
  const fun = new Contract(FUN_TOKEN_ADDRESS, FUN_ABI, treasury);

  // Pre-flight: only check BNB for gas (no balance cap on mint — đúc mới from contract)
  let bnbBalance: bigint;
  try {
    bnbBalance = await provider.getBalance(treasury.address);
  } catch (e: any) {
    return json({ error: 'Cannot reach BSC RPC', details: e.message }, 500);
  }

  if (bnbBalance < parseUnits('0.001', 18)) {
    return json({
      error: 'Treasury BNB too low for gas',
      treasury: treasury.address,
      bnb_balance: formatUnits(bnbBalance, 18),
    }, 500);
  }

  const results: any[] = [];

  for (const claim of claims) {
    const result: any = {
      id: claim.id,
      user_id: claim.user_id,
      amount: Number(claim.amount),
      gov_required: claim.gov_required,
      epoch_id: claim.epoch_id,
    };
    const amount = Number(claim.amount);

    try {
      if (amount < MIN_AMOUNT) {
        result.status = 'skip_dust';
        results.push(result);
        continue;
      }

      // Check epoch_pools.auto_process_enabled (skip for legacy)
      if (claim.epoch_id && !claim.epoch_id.startsWith('legacy-')) {
        const { data: poolCfg } = await supabase
          .from('epoch_pools')
          .select('auto_process_enabled')
          .eq('epoch_id', claim.epoch_id)
          .maybeSingle();
        if (poolCfg && poolCfg.auto_process_enabled === false) {
          result.status = 'epoch_paused';
          results.push(result);
          continue;
        }
      }

      // Lock row
      const { error: lockErr } = await supabase
        .from('claim_requests')
        .update({
          locked_at: new Date().toISOString(),
          processing_attempts: (claim.processing_attempts ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', claim.id)
        .or(`locked_at.is.null,locked_at.lt.${cutoff}`);
      if (lockErr) {
        result.status = 'lock_failed';
        result.error = lockErr.message;
        results.push(result);
        continue;
      }

      const totalWei = parseUnits(amount.toString(), 18);

      if (dryRun) {
        await supabase.from('claim_requests').update({ locked_at: null }).eq('id', claim.id);
        result.status = 'dry_run_ok';
        results.push(result);
        continue;
      }

      // === MINT new FUN to user wallet (đúc mới từ contract, không phải transfer) ===
      const tx = await fun.mint(claim.wallet_address, totalWei);
      const receipt = await tx.wait();

      // Update claim — status=success, token_state stays 'locked' (user must Activate)
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
      results.push(result);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('Transfer failed for', claim.id, msg);

      const willRetry = ((claim.processing_attempts ?? 0) + 1) < MAX_ATTEMPTS;
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

  return json({
    ok: true,
    processed: results.length,
    treasury: treasury.address,
    treasury_fun_left: formatUnits(funBalance, 18),
    results,
  });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
