// AI Agent Engine — register agents with operator binding, log AI events
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ----- register_agent -----
    if (action === 'register_agent') {
      const { agent_name, agent_purpose, responsibility_level } = body;
      if (!agent_name) {
        return new Response(JSON.stringify({ error: 'Missing agent_name' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Operator must be at least L1
      const { data: opDid } = await supabase.from('did_registry')
        .select('level').eq('user_id', user.id).eq('entity_type', 'human').maybeSingle();
      if (!opDid || opDid.level === 'L0') {
        return new Response(JSON.stringify({ error: 'Operator must have DID L1+' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Critical agents need L3+
      if (responsibility_level === 'critical' && !['L3', 'L4'].includes(opDid.level)) {
        return new Response(JSON.stringify({ error: 'Critical agents need operator DID L3+' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: agentDid, error: didErr } = await supabase.from('did_registry').insert({
        user_id: user.id,
        entity_type: 'ai_agent',
        level: 'L1',
        status: 'basic',
        operator_user_id: user.id,
        metadata: { agent_name, purpose: agent_purpose ?? null },
      }).select('did_id').single();
      if (didErr) throw didErr;

      const { error: opErr } = await supabase.from('ai_operators').insert({
        agent_did_id: agentDid.did_id,
        operator_user_id: user.id,
        agent_name,
        agent_purpose,
        responsibility_level: responsibility_level ?? 'standard',
      });
      if (opErr) throw opErr;

      await supabase.from('identity_events').insert({
        user_id: user.id, did_id: agentDid.did_id, agent_did_id: agentDid.did_id,
        event_type: 'agent_registered', ai_origin: false,
        payload: { agent_name, responsibility_level: responsibility_level ?? 'standard' },
      });

      return new Response(JSON.stringify({ success: true, agent_did_id: agentDid.did_id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ----- log_event -----
    if (action === 'log_event') {
      const { agent_did_id, event_type, payload } = body;
      if (!agent_did_id || !event_type) {
        return new Response(JSON.stringify({ error: 'Missing fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: agent } = await supabase.from('ai_operators')
        .select('operator_user_id, is_active')
        .eq('agent_did_id', agent_did_id).maybeSingle();
      if (!agent || !agent.is_active || agent.operator_user_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden or agent inactive' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase.from('identity_events').insert({
        user_id: user.id, did_id: agent_did_id, agent_did_id,
        event_type, ai_origin: true, payload: payload ?? {},
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ----- revoke_agent -----
    if (action === 'revoke_agent') {
      const { agent_did_id, reason } = body;
      const { data: agent } = await supabase.from('ai_operators')
        .select('operator_user_id').eq('agent_did_id', agent_did_id).maybeSingle();
      if (!agent || agent.operator_user_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('ai_operators')
        .update({ is_active: false, revoked_at: new Date().toISOString(), revoke_reason: reason })
        .eq('agent_did_id', agent_did_id);

      await supabase.from('did_registry')
        .update({ status: 'suspended' })
        .eq('did_id', agent_did_id);

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ai-agent-engine] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
