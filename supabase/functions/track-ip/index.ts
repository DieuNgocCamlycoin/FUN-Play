import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// SHA-256 hash function using Web Crypto API
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[track-ip] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Use anon key client to verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('[track-ip] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    const body = await req.json();
    const { action_type, wallet_address } = body;

    if (!action_type || !['signup', 'login', 'wallet_connect', 'claim'].includes(action_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action_type. Must be signup, login, wallet_connect, or claim' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract IP from request headers (server-side)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const realIp = req.headers.get('x-real-ip');
    
    const rawIp = cfConnectingIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || realIp || 'unknown';
    
    console.log(`[track-ip] User: ${user.id}, Action: ${action_type}, IP source: ${cfConnectingIp ? 'cf' : forwardedFor ? 'xff' : realIp ? 'real-ip' : 'unknown'}`);

    // Hash the IP for privacy (never store raw IP)
    const ipHash = await sha256(rawIp);

    // Use service role client for DB operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Insert into ip_tracking table
    const { error: insertError } = await supabaseAdmin
      .from('ip_tracking')
      .insert({
        ip_hash: ipHash,
        user_id: user.id,
        action_type: action_type,
        wallet_address: wallet_address || null,
        device_fingerprint: req.headers.get('user-agent')?.substring(0, 200) || null,
      });

    if (insertError) {
      console.error('[track-ip] Insert error:', insertError.message);
      // Don't fail the request - IP tracking is non-critical
    } else {
      console.log(`[track-ip] Tracked: ${action_type} for user ${user.id}, ip_hash: ${ipHash.substring(0, 12)}...`);
    }

    // Update signup_ip_hash in profiles for signup actions
    if (action_type === 'signup') {
      // Check for rapid signups from same IP (anti-farming)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentSignups } = await supabaseAdmin
        .from('ip_tracking')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .eq('action_type', 'signup')
        .gte('created_at', oneHourAgo);

      // Check how many BANNED accounts share this IP hash
      const { count: bannedFromSameIp } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('signup_ip_hash', ipHash)
        .eq('banned', true);

      const updateData: Record<string, any> = { signup_ip_hash: ipHash };
      
      if ((recentSignups || 0) >= 3) {
        updateData.suspicious_score = 5;
        console.log(`[track-ip] Flagged user ${user.id} with suspicious_score=5 (${recentSignups} signups from same IP in 1hr)`);
      }

      // Auto-ban if 2+ banned accounts from same IP (farming cluster)
      if ((bannedFromSameIp || 0) >= 2) {
        updateData.banned = true;
        updateData.banned_at = new Date().toISOString();
        updateData.ban_reason = `Auto-banned: IP associated with ${bannedFromSameIp} banned accounts`;
        updateData.violation_level = 3;
        updateData.pending_rewards = 0;
        updateData.approved_reward = 0;
        console.log(`[track-ip] AUTO-BANNED user ${user.id} (${bannedFromSameIp} banned accounts from same IP)`);
      }

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('[track-ip] Profile update error:', updateError.message);
      } else {
        console.log(`[track-ip] Updated signup_ip_hash for user ${user.id}${updateData.banned ? ' (AUTO-BANNED)' : ''}`);
      }

      // IP cluster flagging: if 5+ unbanned accounts share this IP, flag all as suspicious_score=5
      const { data: clusterProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, pending_rewards')
        .eq('signup_ip_hash', ipHash)
        .eq('banned', false);

      if (clusterProfiles && clusterProfiles.length >= 5) {
        const highRewardCount = clusterProfiles.filter(p => (p.pending_rewards || 0) > 100000).length;
        if (highRewardCount >= 3) {
          // Flag all accounts in this cluster
          const clusterIds = clusterProfiles.map(p => p.id);
          await supabaseAdmin
            .from('profiles')
            .update({ suspicious_score: 5 })
            .in('id', clusterIds);
          console.log(`[track-ip] Flagged ${clusterIds.length} accounts from IP cluster as suspicious_score=5 (${highRewardCount} with high pending)`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, ip_hash: ipHash }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[track-ip] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
