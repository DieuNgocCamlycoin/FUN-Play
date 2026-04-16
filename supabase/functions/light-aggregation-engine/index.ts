/**
 * light-aggregation-engine — Edge Function
 * Engine 3/4: Aggregates VVU into PLS/NLS/LLS/TLS per epoch
 * 
 * POST body: { user_id } or {} for batch mode
 * Returns: TLS result with 3-tier breakdown
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Weight constants
const ALPHA = 0.50; // Personal Light
const BETA = 0.30;  // Network Light
const GAMMA = 0.20; // Legacy Light

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    let targetUserId: string | null = null;
    try {
      const body = await req.json();
      targetUserId = body?.user_id || null;
    } catch { /* batch mode */ }

    // Get users to process
    let userIds: string[] = [];
    if (targetUserId) {
      userIds = [targetUserId];
    } else {
      const { data: users } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('banned', false)
        .limit(500);
      userIds = (users || []).map((u: any) => u.id);
    }

    const results: any[] = [];

    for (const userId of userIds) {
      try {
        // Fetch profile for previous scores
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('total_light_score, trust_level, consistency_days')
          .eq('id', userId)
          .single();

        // Fetch recent validated actions with VVU
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: actions } = await adminSupabase
          .from('user_actions')
          .select('id, action_type, vvu_score, impact_multiplier, created_at')
          .eq('user_id', userId)
          .in('status', ['validated', 'minted'])
          .gte('created_at', thirtyDaysAgo);

        const userActions = actions || [];

        // PLS: sum of personal VVU × Consistency × Reliability
        const personalVVU = userActions.reduce((s: number, a: any) => s + (a.vvu_score || 0), 0);
        
        const streak = profile?.consistency_days || 0;
        const c = Math.max(0.9, Math.min(1.3, 1 + Math.log(1 + streak) / 6));
        const r = Math.max(0.5, Math.min(1.2, (profile?.trust_level || 1.0)));
        
        const plsDelta = personalVVU * c * r;

        // NLS: actions that helped others (impact_multiplier > 1 means network effect)
        const networkActions = userActions.filter((a: any) => (a.impact_multiplier || 0) > 0.5);
        const networkVVU = networkActions.reduce((s: number, a: any) => s + (a.vvu_score || 0) * (a.impact_multiplier || 0), 0);
        const nlsDelta = networkVVU * 0.5; // dampened

        // LLS: long-term persistent value (simplified: based on account age and total history)
        const { count: totalActionCount } = await adminSupabase
          .from('user_actions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['validated', 'minted']);

        const longevity = Math.min(1, (totalActionCount || 0) / 100); // 100 actions = full longevity
        const llsDelta = longevity * plsDelta * 0.1; // Legacy is slow-growing

        // Previous scores (stored or 0)
        const previousPLS = (profile?.total_light_score || 0) * ALPHA;
        const previousNLS = (profile?.total_light_score || 0) * BETA;
        const previousLLS = (profile?.total_light_score || 0) * GAMMA;

        // Calculate new scores
        const pls = previousPLS + plsDelta;
        const nls = previousNLS + nlsDelta;
        const lls = previousLLS + llsDelta;

        // Raw TLS
        const rawTLS = ALPHA * pls + BETA * nls + GAMMA * lls;

        // Display TLS
        const displayTLS = Math.round(100 * Math.log(1 + Math.max(0, rawTLS)) * 100) / 100;

        // Determine tier
        const tiers = [
          { id: 'seed_light', min: 0, label: 'Seed Light' },
          { id: 'pure_light', min: 50, label: 'Pure Light' },
          { id: 'guiding_light', min: 150, label: 'Guiding Light' },
          { id: 'radiant_light', min: 350, label: 'Radiant Light' },
          { id: 'legacy_light', min: 700, label: 'Legacy Light' },
          { id: 'cosmic_light', min: 1500, label: 'Cosmic Light' },
        ];
        let tier = tiers[0];
        for (let i = tiers.length - 1; i >= 0; i--) {
          if (displayTLS >= tiers[i].min) { tier = tiers[i]; break; }
        }

        // Update profile
        await adminSupabase.from('profiles').update({
          total_light_score: Math.round(rawTLS * 100) / 100,
          last_light_score_update: new Date().toISOString(),
        }).eq('id', userId);

        // Log to ledger
        const now = new Date();
        const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        await adminSupabase.from('light_score_ledger').insert({
          user_id: userId,
          period: 'monthly',
          period_start: periodStart.toISOString(),
          period_end: now.toISOString(),
          base_score: Math.round(personalVVU * 100) / 100,
          consistency_multiplier: Math.round(c * 10000) / 10000,
          sequence_multiplier: Math.round(nlsDelta * 100) / 100,
          integrity_penalty: 0,
          reputation_weight: Math.round(r * 10000) / 10000,
          final_light_score: Math.round(rawTLS * 100) / 100,
          level: tier.id,
          rule_version: 'v2.5',
        });

        results.push({
          user_id: userId,
          raw_tls: Math.round(rawTLS * 100) / 100,
          display_tls: displayTLS,
          tier: tier.id,
          pls: Math.round(pls * 100) / 100,
          nls: Math.round(nls * 100) / 100,
          lls: Math.round(lls * 100) / 100,
          deltas: {
            pls: Math.round(plsDelta * 100) / 100,
            nls: Math.round(nlsDelta * 100) / 100,
            lls: Math.round(llsDelta * 100) / 100,
          },
        });

      } catch (err) {
        console.error(`Error processing user ${userId}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results: targetUserId ? results[0] : undefined,
      summary: targetUserId ? undefined : { total: results.length },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("light-aggregation-engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
