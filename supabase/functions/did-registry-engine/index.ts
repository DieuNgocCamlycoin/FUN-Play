// DID Registry Engine — manages DID lifecycle, level upgrades, status changes
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DIDLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

const LEVEL_ORDER: Record<DIDLevel, number> = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 };

// Auto-upgrade thresholds based on signals
function evaluateLevel(signals: {
  email_verified: boolean;
  phone_verified: boolean;
  has_profile: boolean;
  kyc_level: number; // 0-3
  sbt_count: number;
  account_age_days: number;
  active_days_30d: number;
  has_strong_attestations: boolean;
  is_core_contributor: boolean;
}): DIDLevel {
  if (signals.is_core_contributor && signals.sbt_count >= 5 && signals.kyc_level >= 2) return 'L4';
  if (signals.sbt_count >= 2 && signals.account_age_days >= 30 && signals.active_days_30d >= 10 && signals.has_strong_attestations) return 'L3';
  if (signals.kyc_level >= 1 || (signals.email_verified && signals.phone_verified && signals.has_profile)) return 'L2';
  if (signals.email_verified || signals.phone_verified || signals.has_profile) return 'L1';
  return 'L0';
}

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

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'evaluate';
    const targetUserId = body.user_id || user.id;

    // Only allow self or admin to act on other users
    if (targetUserId !== user.id) {
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      if (!roles?.some((r: any) => r.role === 'admin')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 1. Get or create DID
    let { data: did } = await supabase.from('did_registry')
      .select('*').eq('user_id', targetUserId).maybeSingle();

    if (!did) {
      const { data: created, error: createErr } = await supabase.from('did_registry')
        .insert({ user_id: targetUserId, level: 'L0', status: 'pending', entity_type: 'human' })
        .select().single();
      if (createErr) throw createErr;
      did = created;
    }

    if (action === 'get') {
      return new Response(JSON.stringify({ success: true, did }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Gather signals for level evaluation
    const { data: profile } = await supabase.from('profiles')
      .select('display_name, avatar_url, email_verified, phone_verified, banned')
      .eq('id', targetUserId).maybeSingle();

    const { data: identityProof } = await supabase.from('user_identity_proofs')
      .select('kyc_level').eq('user_id', targetUserId).maybeSingle();

    const { count: sbtCount } = await supabase.from('sbt_registry')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId).eq('status', 'active');

    const { data: attestations } = await supabase.from('attestation_log')
      .select('weight').eq('to_user_id', targetUserId).eq('status', 'active');
    const totalAttestWeight = (attestations || []).reduce((s: number, a: any) => s + (a.weight || 0), 0);

    const accountAgeMs = Date.now() - new Date(did.created_at).getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    const signals = {
      email_verified: !!profile?.email_verified,
      phone_verified: !!profile?.phone_verified,
      has_profile: !!(profile?.display_name && profile?.avatar_url),
      kyc_level: identityProof?.kyc_level ?? 0,
      sbt_count: sbtCount ?? 0,
      account_age_days: accountAgeDays,
      active_days_30d: 0, // TODO: query from features_user_day
      has_strong_attestations: totalAttestWeight >= 3,
      is_core_contributor: false, // requires governance flag
    };

    const newLevel = evaluateLevel(signals);
    const oldLevel = did.level as DIDLevel;
    const upgraded = LEVEL_ORDER[newLevel] > LEVEL_ORDER[oldLevel];
    const downgraded = LEVEL_ORDER[newLevel] < LEVEL_ORDER[oldLevel];

    // 3. Determine status
    let newStatus = did.status;
    if (profile?.banned) newStatus = 'suspended';
    else if (newLevel === 'L0') newStatus = 'pending';
    else if (newLevel === 'L1') newStatus = 'basic';
    else if (newLevel === 'L2') newStatus = 'verified';
    else if (LEVEL_ORDER[newLevel] >= 3) newStatus = 'trusted';

    // 4. Update if changed
    if (newLevel !== oldLevel || newStatus !== did.status) {
      const { error: updErr } = await supabase.from('did_registry')
        .update({ level: newLevel, status: newStatus, updated_at: new Date().toISOString() })
        .eq('did_id', did.did_id);
      if (updErr) throw updErr;

      // Log identity event
      await supabase.from('identity_events').insert({
        user_id: targetUserId,
        did_id: did.did_id,
        event_type: upgraded ? 'level_upgrade' : (downgraded ? 'level_downgrade' : 'status_change'),
        payload: { from_level: oldLevel, to_level: newLevel, from_status: did.status, to_status: newStatus, signals },
      });

      did.level = newLevel;
      did.status = newStatus;
    }

    return new Response(JSON.stringify({
      success: true,
      did,
      signals,
      changed: newLevel !== oldLevel || newStatus !== did.status,
      upgraded,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[did-registry-engine] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
