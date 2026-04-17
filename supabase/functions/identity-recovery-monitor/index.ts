// identity-recovery-monitor — daily job:
// 1) Decay sybil_risk by 5/week for users without new risk events in 7 days
// 2) Auto-unfreeze recovery_log entries past their freeze window
// 3) Recompute trust profiles for affected users
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DECAY_PER_DAY = 5 / 7; // 5 points per week
const QUIET_DAYS = 7;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const sinceQuiet = new Date(Date.now() - QUIET_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const stats = { sybil_rescored: 0, profiles_decayed: 0, freezes_lifted: 0, recomputed: 0, errors: [] as string[] };

    // 0) Re-score sybil risk for users active in last 24h (catches new IP/device collisions)
    const { data: activeUsers } = await supabase
      .from('identity_events')
      .select('user_id')
      .gte('created_at', since24h)
      .limit(2000);
    const uniqActive = Array.from(new Set((activeUsers || []).map((r: any) => r.user_id))).slice(0, 500);
    for (const uid of uniqActive) {
      const { error: sErr } = await supabase.rpc('recompute_sybil_risk', { _user_id: uid });
      if (!sErr) stats.sybil_rescored++;
    }

    // 1) Pick users with sybil_risk > 0 and no risky identity_events in last 7d
    const { data: candidates } = await supabase
      .from('trust_profile')
      .select('user_id, sybil_risk')
      .gt('sybil_risk', 0)
      .limit(500);

    for (const row of candidates || []) {
      const { count: recentRisk } = await supabase
        .from('identity_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', row.user_id)
        .gt('risk_delta', 0)
        .gte('created_at', sinceQuiet);

      if ((recentRisk ?? 0) > 0) continue;

      const newRisk = Math.max(0, Number(row.sybil_risk) - DECAY_PER_DAY);
      const { error } = await supabase
        .from('trust_profile')
        .update({ sybil_risk: newRisk, updated_at: new Date().toISOString() })
        .eq('user_id', row.user_id);

      if (error) {
        stats.errors.push(`decay ${row.user_id}: ${error.message}`);
        continue;
      }
      stats.profiles_decayed++;

      // Recompute on threshold crossings (every 5 points or hitting 0)
      if (Math.floor(Number(row.sybil_risk) / 5) !== Math.floor(newRisk / 5) || newRisk === 0) {
        const { error: rpcErr } = await supabase.rpc('recompute_trust_profile', { _user_id: row.user_id });
        if (!rpcErr) stats.recomputed++;
      }
    }

    // 2) Lift expired recovery cooldowns
    const nowIso = new Date().toISOString();
    const { data: expired } = await supabase
      .from('recovery_log')
      .select('id, user_id')
      .lt('cooldown_until', nowIso)
      .in('status', ['initiated', 'pending'])
      .limit(200);

    for (const r of expired || []) {
      const { error } = await supabase
        .from('recovery_log')
        .update({ status: 'completed', completed_at: nowIso })
        .eq('id', r.id);
      if (!error) stats.freezes_lifted++;
    }

    return new Response(JSON.stringify({ success: true, stats, ran_at: nowIso }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[identity-recovery-monitor] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
