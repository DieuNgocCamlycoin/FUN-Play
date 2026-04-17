// Org Identity Engine — create org DID, manage members, verify badges, issue org SBT
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

    // ----- create_org -----
    if (action === 'create_org') {
      const { name, description } = body;
      if (!name) {
        return new Response(JSON.stringify({ error: 'Missing name' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check user DID level (require L2+ to create org)
      const { data: userDid } = await supabase.from('did_registry')
        .select('level').eq('user_id', user.id).eq('entity_type', 'human').maybeSingle();
      const lvl = userDid?.level || 'L0';
      if (!['L2', 'L3', 'L4'].includes(lvl)) {
        return new Response(JSON.stringify({ error: 'Need DID L2+ to create organization' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: org, error: orgErr } = await supabase.from('did_registry').insert({
        user_id: user.id,
        entity_type: 'organization',
        level: 'L1',
        status: 'basic',
        metadata: { name, description: description ?? null, founder: user.id },
      }).select('did_id').single();
      if (orgErr) throw orgErr;

      await supabase.from('org_members').insert({
        org_did_id: org.did_id, user_id: user.id, role: 'owner',
      });

      await supabase.from('identity_events').insert({
        user_id: user.id, did_id: org.did_id,
        event_type: 'org_created', payload: { name },
      });

      return new Response(JSON.stringify({ success: true, did_id: org.did_id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ----- invite_member -----
    if (action === 'invite_member') {
      const { org_did_id, target_user_id, role } = body;
      if (!org_did_id || !target_user_id || !role) {
        return new Response(JSON.stringify({ error: 'Missing fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify caller is owner/admin
      const { data: caller } = await supabase.from('org_members')
        .select('role').eq('org_did_id', org_did_id).eq('user_id', user.id)
        .eq('is_active', true).maybeSingle();
      if (!caller || !['owner', 'admin'].includes(caller.role)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase.from('org_members').insert({
        org_did_id, user_id: target_user_id, role, invited_by: user.id,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ----- request_verified_badge (admin only approves) -----
    if (action === 'verify_org') {
      const { org_did_id } = body;
      const { data: roleRows } = await supabase.from('user_roles')
        .select('role').eq('user_id', user.id);
      if (!roleRows?.some((r: any) => r.role === 'admin')) {
        return new Response(JSON.stringify({ error: 'Admin only' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase.from('did_registry')
        .update({
          verified_org_badge: true,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          status: 'trusted',
          level: 'L3',
        })
        .eq('did_id', org_did_id)
        .eq('entity_type', 'organization');
      if (error) throw error;

      await supabase.from('identity_events').insert({
        user_id: user.id, did_id: org_did_id,
        event_type: 'org_verified', payload: { verified_by: user.id },
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[org-identity-engine] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
