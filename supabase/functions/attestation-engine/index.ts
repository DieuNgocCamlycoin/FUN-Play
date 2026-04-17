/**
 * attestation-engine — peer attestations
 * POST { to_user_id, attestation_type, weight?, comment? }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_TYPES = ['endorse_skill', 'endorse_character', 'mentor_validation', 'peer_review', 'community_vouch'];
const MAX_WEIGHT = 0.10;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { to_user_id, attestation_type, weight = 0.05, comment } = body;

    if (!to_user_id || !attestation_type) {
      return new Response(JSON.stringify({ error: "Missing to_user_id or attestation_type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (to_user_id === user.id) {
      return new Response(JSON.stringify({ error: "Cannot self-attest" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!ALLOWED_TYPES.includes(attestation_type)) {
      return new Response(JSON.stringify({ error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Both must have DID
    const { data: fromDid } = await admin.from('did_registry').select('did_id, level').eq('user_id', user.id).maybeSingle();
    const { data: toDid } = await admin.from('did_registry').select('did_id').eq('user_id', to_user_id).maybeSingle();
    if (!fromDid || !toDid) {
      return new Response(JSON.stringify({ error: "Both users need DID" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Attester must be at least L1
    if (fromDid.level === 'L0') {
      return new Response(JSON.stringify({ error: "Attester must be DID L1+" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Cap weight
    const finalWeight = Math.min(MAX_WEIGHT, Math.max(0, Number(weight)));

    // Insert
    const { data, error: insErr } = await admin.from('attestation_log').insert({
      from_did: fromDid.did_id,
      to_did: toDid.did_id,
      from_user_id: user.id,
      to_user_id,
      attestation_type,
      weight: finalWeight,
      comment: comment || null,
      status: 'active',
    }).select().single();

    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Log event for recipient
    await admin.from('identity_events').insert({
      user_id: to_user_id,
      did_id: toDid.did_id,
      event_type: 'attestation_received',
      event_ref: data.id,
      tc_delta: finalWeight,
      payload: { from_user_id: user.id, attestation_type },
    });

    return new Response(JSON.stringify({ success: true, attestation: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("attestation-engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
