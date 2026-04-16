import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VALID_PLATFORMS = ['fun_play', 'fun_angel', 'fun_main'];

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

    // Fetch mint requests from ALL platforms (non-rejected)
    const { data: allMintRequests, error: mintError } = await supabase
      .from('mint_requests')
      .select('platform_id, action_type, calculated_amount_formatted, status, action_hash')
      .eq('user_id', user.id)
      .neq('status', 'rejected')
      .in('platform_id', ['FUN_PLAY', 'FUN_ANGEL', 'FUN_MAIN', 'FUN_PROFILE']);

    if (mintError) {
      console.error('Mint requests query error:', mintError);
      return new Response(JSON.stringify({ error: 'Failed to fetch mint data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Dedup by action_hash to avoid double-counting
    const seenHashes = new Set<string>();
    const dedupedRequests = (allMintRequests || []).filter((r: any) => {
      if (!r.action_hash) return true;
      if (seenHashes.has(r.action_hash)) return false;
      seenHashes.add(r.action_hash);
      return true;
    });

    // Platform breakdown
    const platformBreakdown: Record<string, { count: number; totalFun: number }> = {
      FUN_PLAY: { count: 0, totalFun: 0 },
      FUN_ANGEL: { count: 0, totalFun: 0 },
      FUN_MAIN: { count: 0, totalFun: 0 },
      FUN_PROFILE: { count: 0, totalFun: 0 },
    };

    let totalMintedFun = 0;
    const funMintedByAction: Record<string, { count: number; totalFun: number }> = {};

    for (const req of dedupedRequests) {
      const amount = parseFloat((req.calculated_amount_formatted || '0').replace(' FUN', ''));
      totalMintedFun += amount;

      // Platform breakdown
      const pid = req.platform_id || 'FUN_PLAY';
      if (!platformBreakdown[pid]) platformBreakdown[pid] = { count: 0, totalFun: 0 };
      platformBreakdown[pid].count++;
      platformBreakdown[pid].totalFun += amount;

      // Action breakdown
      if (!funMintedByAction[req.action_type]) {
        funMintedByAction[req.action_type] = { count: 0, totalFun: 0 };
      }
      funMintedByAction[req.action_type].count++;
      funMintedByAction[req.action_type].totalFun += amount;
    }

    // Check pending requests across all platforms
    const { data: pendingRequests } = await supabase
      .from('mint_requests')
      .select('id, platform_id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(5);

    const hasPendingRequest = (pendingRequests?.length || 0) > 0;

    // Also check pplp_mint_requests for pending
    const { data: pplpPending } = await supabase
      .from('pplp_mint_requests')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['pending_sig', 'signing'])
      .limit(1);

    const hasPplpPending = (pplpPending?.length || 0) > 0;

    return new Response(JSON.stringify({
      success: true,
      userId: user.id,
      totalMintedFun: Math.round(totalMintedFun * 100) / 100,
      platformBreakdown,
      funMintedByAction,
      hasPendingRequest: hasPendingRequest || hasPplpPending,
      totalRequests: dedupedRequests.length,
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
