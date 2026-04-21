// pplp-mint-create-request — Phase B1
// Creates a v2 mint request: reads on-chain nonce, computes EIP-712 digest,
// and returns { request_id, message, nonce, action_hash } for attesters to sign.
//
// Flow:
//   1. Validate caller (auth) + body
//   2. Read nonces[user] from contract 0x39A1b047...
//   3. Build PureLoveProof message (user, actionHash, amount, evidenceHash, nonce)
//   4. Compute EIP-712 digest (for client-side display only — actual sig uses signTypedData)
//   5. Insert pplp_mint_requests_v2 row, status='pending_sig'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  JsonRpcProvider,
  Contract,
  TypedDataEncoder,
  keccak256,
  toUtf8Bytes,
  parseUnits,
} from 'https://esm.sh/ethers@6.13.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== Constants (must match contract deploy) =====
const FUN_CONTRACT = '0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6';
const RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const CHAIN_ID = 97;
const DOMAIN = {
  name: 'FUN Money',
  version: '1.2.1',
  chainId: CHAIN_ID,
  verifyingContract: FUN_CONTRACT,
};
const TYPES = {
  PureLoveProof: [
    { name: 'user', type: 'address' },
    { name: 'actionHash', type: 'bytes32' },
    { name: 'amount', type: 'uint256' },
    { name: 'evidenceHash', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' },
  ],
};

const NONCE_ABI = ['function nonces(address) view returns (uint256)'];

// Default deadline: 7 days for attester signing window
const DEFAULT_DEADLINE_HOURS = 7 * 24;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jerr(401, 'Missing authorization');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(SUPABASE_URL, ANON);
    const { data: { user }, error: authError } = await userClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) return jerr(401, 'Unauthorized');

    const body = await req.json();
    const {
      recipient_address,
      action_name = 'FUN_REWARD',
      amount,            // human FUN (e.g. 100)
      amount_wei,        // optional pre-computed wei string
      evidence,          // arbitrary JSON
      source = 'auto-mint',
      metadata = {},
    } = body;

    if (!recipient_address || !/^0x[a-fA-F0-9]{40}$/.test(recipient_address)) {
      return jerr(400, 'Invalid recipient_address');
    }
    if (amount == null || Number(amount) <= 0) {
      return jerr(400, 'amount must be > 0');
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Banned check
    const { data: profile } = await admin
      .from('profiles')
      .select('banned')
      .eq('id', user.id)
      .single();
    if (profile?.banned) return jerr(403, 'User banned');

    // === Read on-chain nonce ===
    const provider = new JsonRpcProvider(RPC_URL);
    const fun = new Contract(FUN_CONTRACT, NONCE_ABI, provider);
    let onchainNonce: bigint;
    try {
      onchainNonce = await fun.nonces(recipient_address);
    } catch (e: any) {
      console.error('[create-request] nonce read failed', e.message);
      return jerr(502, 'Cannot read on-chain nonce', { details: e.message });
    }

    // Account for any locally-pending requests for this recipient
    // (each successful mint increments on-chain nonce by 1)
    const { count: pendingForRecipient } = await admin
      .from('pplp_mint_requests_v2')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_address', recipient_address)
      .in('status', ['pending_sig', 'signed', 'broadcasting']);

    const nextNonce = onchainNonce + BigInt(pendingForRecipient ?? 0);

    // === Compute hashes ===
    const actionHash = keccak256(toUtf8Bytes(action_name));
    const evidencePayload = evidence ?? { actionType: action_name, ts: Date.now(), ...metadata };
    const evidenceHash = keccak256(toUtf8Bytes(JSON.stringify(evidencePayload)));

    const amountWei = amount_wei
      ? BigInt(amount_wei)
      : parseUnits(String(amount), 18);

    const message = {
      user: recipient_address,
      actionHash,
      amount: amountWei.toString(),
      evidenceHash,
      nonce: nextNonce.toString(),
    };

    // EIP-712 digest (for audit / display)
    const digest = TypedDataEncoder.hash(DOMAIN, TYPES, message);

    // Deadline = now + 7d (DB-side only)
    const deadline = Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_HOURS * 3600;

    const { data: row, error: insErr } = await admin
      .from('pplp_mint_requests_v2')
      .insert({
        user_id: user.id,
        recipient_address,
        action_name,
        action_hash: actionHash,
        amount_wei: amountWei.toString(),
        amount_display: Number(amount),
        evidence_hash: evidenceHash,
        evidence_payload: evidencePayload,
        policy_version: 1,
        nonce: nextNonce.toString(),
        deadline,
        digest,
        signatures: [],
        signatures_count: 0,
        status: 'pending_sig',
        source,
        metadata,
      })
      .select()
      .single();

    if (insErr) {
      console.error('[create-request] insert error', insErr);
      return jerr(500, 'Insert failed', { details: insErr.message });
    }

    return jok({
      request_id: row.id,
      domain: DOMAIN,
      types: TYPES,
      message,
      digest,
      deadline,
    });
  } catch (err: any) {
    console.error('[create-request] error', err);
    return jerr(500, 'Internal error', { details: err?.message });
  }
});

function jok(data: unknown) {
  return new Response(JSON.stringify({ ok: true, ...data as object }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
function jerr(status: number, error: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ ok: false, error, ...extra }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
