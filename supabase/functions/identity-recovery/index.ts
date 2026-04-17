// Identity Recovery — 4-layer recovery flow with cooldowns
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RecoveryLayer = 'primary' | 'wallet' | 'guardian' | 'governance';

const COOLDOWN_HOURS: Record<RecoveryLayer, number> = {
  primary: 24, wallet: 72, guardian: 168, governance: 720,
};
const MAX_ATTEMPTS_30D = 3;
const FREEZE_PAYOUT_HOURS = 72;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, layer, evidence } = body as {
      action: 'request' | 'verify' | 'list';
      layer?: RecoveryLayer;
      evidence?: Record<string, unknown>;
    };

    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === 'list') {
      const { data: events } = await supabase.from('recovery_log')
        .select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(20);
      return new Response(JSON.stringify({ success: true, events: events || [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!layer || !COOLDOWN_HOURS[layer]) {
      return new Response(JSON.stringify({ error: 'Invalid recovery layer' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check 30d attempt limit
    const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await supabase.from('recovery_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', cutoff30d);

    if ((recentAttempts ?? 0) >= MAX_ATTEMPTS_30D) {
      return new Response(JSON.stringify({ error: 'Vượt quá số lần khôi phục cho phép trong 30 ngày' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check per-layer cooldown
    const cooldownMs = COOLDOWN_HOURS[layer] * 60 * 60 * 1000;
    const cooldownCutoff = new Date(Date.now() - cooldownMs).toISOString();
    const { data: lastSame } = await supabase.from('recovery_log')
      .select('created_at').eq('user_id', user.id).eq('recovery_layer', layer)
      .gte('created_at', cooldownCutoff).limit(1).maybeSingle();

    if (lastSame) {
      return new Response(JSON.stringify({
        error: `Cooldown layer ${layer}: phải đợi ${COOLDOWN_HOURS[layer]}h sau lần thử gần nhất`,
      }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert recovery log + freeze payout
    const freezeUntil = new Date(Date.now() + FREEZE_PAYOUT_HOURS * 60 * 60 * 1000).toISOString();
    const { data: log, error: logErr } = await supabase.from('recovery_log').insert({
      user_id: user.id,
      recovery_layer: layer,
      action,
      evidence: evidence || {},
      payout_frozen_until: freezeUntil,
      risk_delta: layer === 'governance' ? 0.05 : 0.15,
      status: action === 'verify' ? 'completed' : 'pending',
    }).select().single();

    if (logErr) throw logErr;

    // Log identity event for risk delta
    await supabase.from('identity_events').insert({
      user_id: user.id,
      event_type: 'recovery_initiated',
      payload: { layer, action, recovery_log_id: log.id },
      risk_delta: layer === 'governance' ? 0.05 : 0.15,
    });

    return new Response(JSON.stringify({
      success: true,
      log,
      payout_frozen_until: freezeUntil,
      message: `Recovery ${layer} đã ghi nhận. Payout bị tạm khóa ${FREEZE_PAYOUT_HOURS}h.`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[identity-recovery] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
