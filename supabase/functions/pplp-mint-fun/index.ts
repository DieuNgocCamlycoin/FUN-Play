import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Unified multi-platform config — shared spec across all 3 platforms
const VALID_PLATFORMS: Record<string, { daily_cap: number; label: string }> = {
  fun_play: { daily_cap: 2, label: 'play.fun.rich' },
  fun_angel: { daily_cap: 2, label: 'angel.fun.rich' },
  fun_main: { daily_cap: 2, label: 'fun.rich' },
};
const DEFAULT_PLATFORM = 'fun_play';
const CROSS_PLATFORM_EPOCH_CAP = 20_000_000; // 20M FUN shared across all platforms

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
    const { recipient_address, action_type, amount, amount_wei, action_hash, evidence_hash, nonce, action_ids, platform_id: reqPlatform } = body;

    // Enforce single mint point: only fun_main accepted
    const platformId = reqPlatform || 'fun_main';
    const platformConfig = VALID_PLATFORMS[platformId];
    if (!platformConfig) {
      return new Response(JSON.stringify({ error: `Invalid platform_id. Valid: ${Object.keys(VALID_PLATFORMS).join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!recipient_address || !action_type || amount == null || !amount_wei) {
      return new Response(JSON.stringify({ error: 'Missing required fields: recipient_address, action_type, amount, amount_wei' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reject 0 FUN requests
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be greater than 0. User has no FUN to mint.' }), {
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

    // === Identity + Trust Layer v1.0 gate ===
    // Require trust_tier ≥ T2 (verified) for full mint, T0/T1 sandbox-only
    const { data: trustProfile } = await supabase
      .from('trust_profile')
      .select('tc, tier, sybil_risk')
      .eq('user_id', user.id)
      .maybeSingle();

    const userTier = trustProfile?.tier || 'T0';
    const sybilRisk = Number(trustProfile?.sybil_risk) || 0;
    const tcValue = Number(trustProfile?.tc) || 0.3;

    // Block critical sybil risk
    if (sybilRisk >= 60) {
      return new Response(JSON.stringify({
        error: 'Sybil risk quá cao — mint bị tạm khóa. Vui lòng liên hệ hỗ trợ.',
        sybil_risk: sybilRisk,
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // T0/T1 → sandbox cap (max 100 FUN per request)
    const SANDBOX_MAX = 100;
    if ((userTier === 'T0' || userTier === 'T1') && amount > SANDBOX_MAX) {
      return new Response(JSON.stringify({
        error: `Trust tier ${userTier} chỉ được mint tối đa ${SANDBOX_MAX} FUN/request (sandbox). Hãy nâng DID lên L2+ để mở full mint.`,
        current_tier: userTier,
        current_tc: tcValue,
        required_tier: 'T2',
        sandbox_max: SANDBOX_MAX,
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check per-platform daily cap
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('pplp_mint_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('platform_id', platformId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);

    if ((count ?? 0) >= platformConfig.daily_cap) {
      return new Response(JSON.stringify({ error: `Daily cap reached for ${platformConfig.label} (${platformConfig.daily_cap} requests/day)` }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cross-platform epoch cap check (all platforms share 20M FUN/epoch)
    const monthStart = `${today.slice(0, 7)}-01T00:00:00Z`;
    const { data: epochTotal } = await supabase
      .from('pplp_mint_requests')
      .select('amount')
      .in('status', ['pending_sig', 'signing', 'signed', 'submitted', 'confirmed'])
      .gte('created_at', monthStart);

    const totalMintedThisEpoch = (epochTotal || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    if (totalMintedThisEpoch + amount > CROSS_PLATFORM_EPOCH_CAP) {
      return new Response(JSON.stringify({ 
        error: `Cross-platform epoch cap reached (${CROSS_PLATFORM_EPOCH_CAP.toLocaleString()} FUN/month)`,
        current_total: totalMintedThisEpoch,
        requested: amount,
      }), {
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
        platform_id: platformId,
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
      platform: platformConfig.label,
      message: `Mint request created on ${platformConfig.label}. Waiting for 3-of-3 multisig signatures.`
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
