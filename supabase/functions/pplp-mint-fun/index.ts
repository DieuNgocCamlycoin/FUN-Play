import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PLATFORM_ID = 'fun_play';
const DAILY_CAP = 2;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { recipient_address, action_type, amount, amount_wei, action_hash, evidence_hash, nonce, action_ids } = body;

    // Validate required fields
    if (!recipient_address || !action_type || !amount || !amount_wei) {
      return new Response(JSON.stringify({ error: 'Missing required fields: recipient_address, action_type, amount, amount_wei' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user not banned
    const { data: profile } = await supabase
      .from('profiles')
      .select('banned, display_name')
      .eq('id', user.id)
      .single();

    if (profile?.banned) {
      return new Response(JSON.stringify({ error: 'User is banned' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check daily cap (2 requests/day)
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('pplp_mint_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);

    if ((count ?? 0) >= DAILY_CAP) {
      return new Response(JSON.stringify({ error: `Daily cap reached (${DAILY_CAP} requests/day)` }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert mint request
    const { data: mintRequest, error: insertError } = await supabase
      .from('pplp_mint_requests')
      .insert({
        user_id: user.id,
        recipient_address,
        action_ids: action_ids || [],
        action_type,
        amount,
        amount_wei,
        action_hash: action_hash || null,
        evidence_hash: evidence_hash || null,
        nonce: nonce || null,
        multisig_signatures: {},
        multisig_completed_groups: [],
        multisig_required_groups: ['will', 'wisdom', 'love'],
        status: 'pending_sig',
        platform_id: PLATFORM_ID,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create mint request', details: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      request: mintRequest,
      message: `Mint request created. Waiting for 3-of-3 multisig signatures.`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
