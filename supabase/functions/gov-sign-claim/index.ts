// gov-sign-claim — Verify off-chain EIP-191 signature từ 1 nhóm GOV (will/wisdom/love)
// Khi đủ 3 nhóm khác nhau → set status='approved_for_chain' để cron xử lý
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { verifyMessage, getAddress } from 'https://esm.sh/ethers@6.13.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_GROUPS = ['will', 'wisdom', 'love'] as const;
type GovGroup = typeof VALID_GROUPS[number];

function buildMessage(claim: { id: string; user_id: string; amount: number | string; epoch_id: string | null }) {
  return [
    'FUN Money — GOV Approval',
    `claim_id: ${claim.id}`,
    `user_id: ${claim.user_id}`,
    `epoch: ${claim.epoch_id ?? 'n/a'}`,
    `amount: ${claim.amount} FUN`,
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const claim_id = String(body?.claim_id ?? '');
    const signature = String(body?.signature ?? '');
    const gov_group = String(body?.gov_group ?? '').toLowerCase() as GovGroup;
    const signer_address = body?.signer_address ? getAddress(String(body.signer_address)) : null;

    if (!claim_id || !signature || !VALID_GROUPS.includes(gov_group)) {
      return json({ error: 'Invalid input: claim_id, signature, gov_group required' }, 400);
    }

    // Load claim
    const { data: claim, error: cErr } = await supabase
      .from('claim_requests')
      .select('id, user_id, amount, epoch_id, gov_required, gov_signatures, gov_completed_groups, gov_signatures_count, status, tx_hash')
      .eq('id', claim_id)
      .maybeSingle();
    if (cErr || !claim) return json({ error: 'Claim not found' }, 404);
    if (claim.tx_hash) return json({ error: 'Claim already on-chain' }, 400);
    if (!claim.gov_required) return json({ error: 'Claim does not require GOV signatures (legacy)' }, 400);

    const completed = (claim.gov_completed_groups || []) as string[];
    if (completed.includes(gov_group)) {
      return json({ error: `Group ${gov_group} already signed this claim` }, 409);
    }

    // Verify signature
    const message = buildMessage(claim);
    let recovered: string;
    try {
      recovered = getAddress(verifyMessage(message, signature));
    } catch (e: any) {
      return json({ error: 'Invalid signature', details: e.message }, 400);
    }

    if (signer_address && signer_address !== recovered) {
      return json({ error: 'signer_address does not match recovered signer' }, 400);
    }

    // Check signer is registered GOV attester for this group
    const { data: attester, error: aErr } = await supabase
      .from('gov_attesters')
      .select('id, wallet_address, gov_group, is_active')
      .ilike('wallet_address', recovered)
      .eq('gov_group', gov_group)
      .eq('is_active', true)
      .maybeSingle();
    if (aErr) return json({ error: 'Attester lookup failed', details: aErr.message }, 500);
    if (!attester) {
      return json({
        error: `Address ${recovered} is not a registered active attester for group ${gov_group}`,
      }, 403);
    }

    // Append signature
    const sigs = (claim.gov_signatures as Record<string, any>) || {};
    sigs[gov_group] = {
      signer: recovered,
      signature,
      signed_at: new Date().toISOString(),
      attester_id: attester.id,
      user_id: user.id,
    };
    const newCompleted = Array.from(new Set([...completed, gov_group]));
    const newCount = newCompleted.length;
    const newStatus = newCount >= 3 ? 'approved_for_chain' : claim.status;

    const { error: uErr } = await supabase
      .from('claim_requests')
      .update({
        gov_signatures: sigs,
        gov_completed_groups: newCompleted,
        gov_signatures_count: newCount,
        status: newStatus,
      })
      .eq('id', claim_id);
    if (uErr) return json({ error: 'Failed to save signature', details: uErr.message }, 500);

    // Auto-trigger processor when fully signed
    if (newCount >= 3) {
      supabase.functions.invoke('process-fun-claims', {
        body: { claim_id },
      }).catch(() => { /* cron will pick up */ });
    }

    return json({
      ok: true,
      claim_id,
      gov_group,
      signer: recovered,
      signatures_count: newCount,
      ready_for_chain: newCount >= 3,
    });
  } catch (err: any) {
    return json({ error: err.message || String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
