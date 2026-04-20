/**
 * trust-graph-builder — compute incoming trust score + network reach (BFS depth 2)
 * POST { user_id } -> { incoming_trust, network_reach, depth1, depth2 }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Depth 1 — direct vouches
    const { data: depth1Edges } = await admin
      .from('trust_edges')
      .select('from_user_id, weight')
      .eq('to_user_id', user_id);

    const depth1Ids = new Set<string>((depth1Edges || []).map((e: any) => e.from_user_id));

    // Get TC of each depth-1 voucher
    const ids = Array.from(depth1Ids);
    const { data: trustProfiles } = ids.length
      ? await admin.from('trust_profile').select('user_id, tc').in('user_id', ids)
      : { data: [] };
    const tcMap = new Map<string, number>(
      (trustProfiles || []).map((p: any) => [p.user_id, Number(p.tc) || 0.5])
    );

    // Weighted incoming trust = Σ (edge.weight * voucher.tc)
    let incomingTrust = 0;
    for (const e of depth1Edges || []) {
      const voucherTc = tcMap.get(e.from_user_id) ?? 0.5;
      incomingTrust += (Number(e.weight) || 0) * voucherTc;
    }
    incomingTrust = Math.min(2, incomingTrust);

    // Depth 2 — vouchers of vouchers
    let depth2Count = 0;
    const depth2Set = new Set<string>();
    if (ids.length > 0) {
      const { data: depth2Edges } = await admin
        .from('trust_edges')
        .select('from_user_id')
        .in('to_user_id', ids);
      for (const e of depth2Edges || []) {
        if (e.from_user_id !== user_id && !depth1Ids.has(e.from_user_id)) {
          depth2Set.add(e.from_user_id);
        }
      }
      depth2Count = depth2Set.size;
    }

    const networkReach = depth1Ids.size + depth2Count;

    return new Response(JSON.stringify({
      user_id,
      incoming_trust: Math.round(incomingTrust * 10000) / 10000,
      network_reach: networkReach,
      depth1: depth1Ids.size,
      depth2: depth2Count,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('trust-graph-builder error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
