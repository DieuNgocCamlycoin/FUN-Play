// pplp-mint-add-signature — Phase B2
// Receives a signature from an attester wallet, verifies via ecrecover + isAttester,
// appends to signatures[]; when count >= threshold (3) → status='signed' (broadcaster will pick).
//
// Body: { request_id: uuid, attester_address: 0x..., signature: 0x... }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  JsonRpcProvider,
  Contract,
  TypedDataEncoder,
  recoverAddress,
} from 'https://esm.sh/ethers@6.13.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
const ATTESTER_ABI = [
  'function isAttester(address) view returns (bool)',
  'function attesterThreshold() view returns (uint256)',
];

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

    const { request_id, attester_address, signature } = await req.json();
    if (!request_id || !attester_address || !signature) {
      return jerr(400, 'Missing request_id, attester_address, or signature');
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(attester_address)) return jerr(400, 'Bad attester_address');
    if (!/^0x[a-fA-F0-9]{130,132}$/.test(signature)) return jerr(400, 'Bad signature format');

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Load request
    const { data: row, error: rowErr } = await admin
      .from('pplp_mint_requests_v2')
      .select('*')
      .eq('id', request_id)
      .single();
    if (rowErr || !row) return jerr(404, 'Request not found');

    if (row.status !== 'pending_sig') {
      return jerr(409, `Request status is ${row.status}, not pending_sig`);
    }
    if (row.deadline && Math.floor(Date.now() / 1000) > row.deadline) {
      await admin.from('pplp_mint_requests_v2').update({ status: 'expired' }).eq('id', request_id);
      return jerr(410, 'Request deadline passed');
    }

    // Verify signer matches attester_address via EIP-712 recover
    const message = {
      user: row.recipient_address,
      actionHash: row.action_hash,
      amount: row.amount_wei.toString(),
      evidenceHash: row.evidence_hash,
      nonce: row.nonce.toString(),
    };
    const digest = TypedDataEncoder.hash(DOMAIN, TYPES, message);
    const recovered = recoverAddress(digest, signature);

    if (recovered.toLowerCase() !== attester_address.toLowerCase()) {
      return jerr(400, 'Signature does not match attester_address', {
        recovered,
        expected: attester_address,
      });
    }

    // Verify attester is registered on-chain
    const provider = new JsonRpcProvider(RPC_URL);
    const fun = new Contract(FUN_CONTRACT, ATTESTER_ABI, provider);
    const [isAtt, threshold] = await Promise.all([
      fun.isAttester(attester_address),
      fun.attesterThreshold(),
    ]);
    if (!isAtt) return jerr(403, 'Address is not an active on-chain attester');

    // Dedup: same attester can only sign once
    const sigs: Array<{ attester: string; signature: string }> = Array.isArray(row.signatures) ? row.signatures : [];
    if (sigs.some((s) => s.attester.toLowerCase() === attester_address.toLowerCase())) {
      return jerr(409, 'This attester already signed this request');
    }

    sigs.push({ attester: attester_address, signature });
    const newCount = sigs.length;
    const thresholdNum = Number(threshold);
    const newStatus = newCount >= thresholdNum ? 'signed' : 'pending_sig';

    const { error: updErr } = await admin
      .from('pplp_mint_requests_v2')
      .update({
        signatures: sigs,
        signatures_count: newCount,
        status: newStatus,
      })
      .eq('id', request_id);

    if (updErr) {
      console.error('[add-signature] update err', updErr);
      return jerr(500, 'Failed to save signature', { details: updErr.message });
    }

    return jok({
      request_id,
      signatures_count: newCount,
      threshold: thresholdNum,
      status: newStatus,
      ready_to_broadcast: newStatus === 'signed',
    });
  } catch (err: any) {
    console.error('[add-signature] error', err);
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
