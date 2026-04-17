// ZK Proof Engine — generate commitments, build Merkle trees, verify proofs
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function buildRoot(leaves: string[]): Promise<{ root: string; depth: number }> {
  if (leaves.length === 0) return { root: await sha256Hex('empty'), depth: 0 };
  let layer = [...leaves].sort();
  let depth = 0;
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i];
      const b = layer[i + 1] ?? a;
      const [lo, hi] = a < b ? [a, b] : [b, a];
      next.push(await sha256Hex(lo + hi));
    }
    layer = next;
    depth++;
  }
  return { root: layer[0], depth };
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
    const action = body.action || 'commit';

    // ----- Action: commit -----
    if (action === 'commit') {
      const { commitment_type, value } = body;
      if (!commitment_type || value === undefined) {
        return new Response(JSON.stringify({ error: 'Missing commitment_type or value' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const raw_salt = crypto.randomUUID() + crypto.randomUUID();
      const salt_hash = await sha256Hex(raw_salt);
      const commitment_hash = await sha256Hex(`${value}|${raw_salt}`);

      const { data: did } = await supabase.from('did_registry')
        .select('did_id').eq('user_id', user.id).maybeSingle();

      const { data, error } = await supabase.from('zk_commitments').insert({
        user_id: user.id,
        did_id: did?.did_id ?? null,
        commitment_type,
        commitment_hash,
        salt_hash,
        metadata: body.metadata ?? {},
      }).select().single();

      if (error) throw error;

      // Return raw_salt ONCE — user must store it client-side to later prove
      return new Response(JSON.stringify({
        success: true,
        commitment: data,
        raw_salt,
        warning: 'Store raw_salt securely — required for future proofs',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ----- Action: build_root (admin) -----
    if (action === 'build_root') {
      const { commitment_type, epoch_id } = body;
      const { data: roleRows } = await supabase.from('user_roles')
        .select('role').eq('user_id', user.id);
      if (!roleRows?.some((r: any) => r.role === 'admin')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: commits } = await supabase.from('zk_commitments')
        .select('id, commitment_hash')
        .eq('commitment_type', commitment_type)
        .eq('is_active', true);

      const leaves = (commits ?? []).map((c: any) => c.commitment_hash);
      const { root, depth } = await buildRoot(leaves);

      // Deactivate previous roots
      await supabase.from('zk_merkle_roots')
        .update({ is_active: false })
        .eq('commitment_type', commitment_type)
        .eq('is_active', true);

      const { data: rootRow, error: rootErr } = await supabase.from('zk_merkle_roots')
        .insert({
          commitment_type, epoch_id, root_hash: root,
          leaf_count: leaves.length, tree_depth: depth, algorithm: 'sha256',
        }).select().single();
      if (rootErr) throw rootErr;

      // Link commitments
      if (commits?.length) {
        await supabase.from('zk_commitments')
          .update({ merkle_root_id: rootRow.id })
          .in('id', commits.map((c: any) => c.id));
      }

      return new Response(JSON.stringify({ success: true, root: rootRow }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ----- Action: verify -----
    if (action === 'verify') {
      const { value, raw_salt, commitment_hash } = body;
      const expected = await sha256Hex(`${value}|${raw_salt}`);
      const valid = expected === commitment_hash;
      return new Response(JSON.stringify({ success: true, valid }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[zk-proof-engine] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
