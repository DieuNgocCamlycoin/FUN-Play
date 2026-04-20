// activate-fun-claim — User mở khoá FUN sau khi đã transfer on-chain
// token_state: locked → active (sau đó frontend hiện link "Claim về ví")
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const body = await req.json();
    const claim_id = String(body?.claim_id ?? '');
    if (!claim_id) return json({ error: 'claim_id required' }, 400);

    const { data: claim, error: cErr } = await supabase
      .from('claim_requests')
      .select('id, user_id, tx_hash, token_state, status')
      .eq('id', claim_id)
      .maybeSingle();
    if (cErr || !claim) return json({ error: 'Claim not found' }, 404);
    if (claim.user_id !== user.id) return json({ error: 'Forbidden — not your claim' }, 403);
    if (!claim.tx_hash) return json({ error: 'Claim not yet on-chain — cannot activate' }, 400);
    if (claim.token_state === 'active' || claim.token_state === 'claimed') {
      return json({ ok: true, claim_id, token_state: claim.token_state, message: 'Already activated' });
    }

    const { error: uErr } = await supabase
      .from('claim_requests')
      .update({
        token_state: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', claim_id)
      .eq('user_id', user.id);
    if (uErr) return json({ error: uErr.message }, 500);

    return json({ ok: true, claim_id, token_state: 'active' });
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
