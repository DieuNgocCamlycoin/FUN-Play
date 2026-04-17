/**
 * did-kyc-light — upgrade DID L1 → L2 via verified phone OTP
 * Caller must already have verified phone at Supabase Auth (auth.users.phone_confirmed_at)
 * POST { phone }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anon.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { phone } = await req.json().catch(() => ({}));
    if (!phone || typeof phone !== 'string') return json({ error: "Missing phone" }, 400);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify the auth user's phone is confirmed and matches
    const { data: au, error: auErr } = await admin.auth.admin.getUserById(user.id);
    if (auErr || !au?.user) return json({ error: "User not found" }, 404);
    const aPhone = au.user.phone;
    const phoneConfirmed = !!(au.user as { phone_confirmed_at?: string }).phone_confirmed_at;
    if (!phoneConfirmed || !aPhone) return json({ error: "Phone not verified at auth" }, 403);

    // Normalize compare (auth stores without leading +)
    const norm = (p: string) => p.replace(/^\+/, '');
    if (norm(aPhone) !== norm(phone)) return json({ error: "Phone mismatch" }, 400);

    // Get DID
    const { data: did } = await admin.from('did_registry')
      .select('did_id, level').eq('user_id', user.id).maybeSingle();
    if (!did) return json({ error: "DID not found" }, 404);

    const phoneHash = await sha256(`${norm(phone)}:${user.id}`);

    // Insert/update identity_link (social with phone)
    await admin.from('identity_links').upsert({
      did_id: did.did_id,
      link_type: 'social',
      link_value: phoneHash,
      verification_state: 'verified',
      verified_at: new Date().toISOString(),
      metadata: { kind: 'phone', verified_via: 'auth_otp' },
    }, { onConflict: 'did_id,link_type,link_value' });

    // Upgrade DID level if currently <= L1
    let newLevel = did.level;
    if (did.level === 'L0' || did.level === 'L1') {
      newLevel = 'L2';
      await admin.from('did_registry').update({
        level: 'L2',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('did_id', did.did_id);
    }

    // Log identity event + give TC delta
    await admin.from('identity_events').insert({
      user_id: user.id,
      did_id: did.did_id,
      event_type: 'phone_verified',
      tc_delta: 0.10,
      payload: { from_level: did.level, to_level: newLevel },
    });

    // Trigger trust recompute (best-effort)
    await admin.rpc('recompute_trust_profile', { _user_id: user.id }).catch(() => {});

    // Trigger SBT auto-issue (best-effort) — verified_phone or trust_verified rules
    await admin.functions.invoke('sbt-issuance-engine', {
      body: { user_id: user.id },
    }).catch(() => {});

    return json({ success: true, did_level: newLevel });
  } catch (e) {
    console.error("did-kyc-light error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
