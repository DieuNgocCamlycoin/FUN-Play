import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Suspicious patterns for usernames
const SUSPICIOUS_PATTERNS = [
  /^(test|abc|user_|admin|fake|spam|bot|tmp|temp)/i,
  /^[a-z]{1,2}$/i, // Very short names
  /^\d+$/, // Only numbers
  /^(.)\1+$/, // Repeated characters like "aaa" or "111"
];

serve(async (req) => {
  console.log("=== DETECT-ABUSE FUNCTION STARTED ===");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Authorization (admin or service role)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { userId, ipHash } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Detecting abuse for user: ${userId}, IP hash: ${ipHash || 'N/A'}`);

    let suspiciousScore = 0;
    const reasons: string[] = [];

    // 3. Get user profile
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("username, display_name, avatar_url, created_at, signup_ip_hash, wallet_address")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check for suspicious username patterns
    const username = profile.username || '';
    const displayName = profile.display_name || '';
    
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(username) || pattern.test(displayName)) {
        suspiciousScore += 1;
        reasons.push('Suspicious username pattern');
        break; // Only count once
      }
    }

    // 5. Check if no avatar (incomplete profile)
    if (!profile.avatar_url) {
      suspiciousScore += 1;
      reasons.push('No avatar set');
    }

    // 6. Check for very short display name
    if (displayName.length <= 1) {
      suspiciousScore += 1;
      reasons.push('Very short display name');
    }

    // 7. If IP hash provided, check for multi-account abuse
    if (ipHash) {
      // Check for multiple accounts from same IP
      const { data: sameIpAccounts, error: ipError } = await adminSupabase
        .from("ip_tracking")
        .select("user_id")
        .eq("ip_hash", ipHash)
        .eq("action_type", "signup");

      if (!ipError && sameIpAccounts) {
        const uniqueAccounts = new Set(sameIpAccounts.map(a => a.user_id));
        if (uniqueAccounts.size > 2) {
          suspiciousScore += 2;
          reasons.push(`Multiple accounts from same IP (${uniqueAccounts.size})`);
        }
      }

      // Check for multiple wallets from same IP
      const { data: sameIpWallets } = await adminSupabase
        .from("ip_tracking")
        .select("wallet_address")
        .eq("ip_hash", ipHash)
        .eq("action_type", "wallet_connect")
        .not("wallet_address", "is", null);

      if (sameIpWallets) {
        const uniqueWallets = new Set(sameIpWallets.map(w => w.wallet_address?.toLowerCase()));
        if (uniqueWallets.size >= 3) {
          suspiciousScore += 3;
          reasons.push(`Multiple wallets from same IP (${uniqueWallets.size})`);
        }
      }
    }

    // 8. Check for excessive claims
    const today = new Date().toISOString().split('T')[0];
    const { data: todayClaims } = await adminSupabase
      .from("claim_requests")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", today);

    if (todayClaims && todayClaims.length > 3) {
      suspiciousScore += 1;
      reasons.push(`Excessive claim attempts today (${todayClaims.length})`);
    }

    // 9. Check for rapid account creation (if we have signup IP)
    if (profile.signup_ip_hash) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentSignups } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("signup_ip_hash", profile.signup_ip_hash)
        .gte("created_at", oneHourAgo);

      if (recentSignups && recentSignups.length > 3) {
        suspiciousScore += 2;
        reasons.push(`Rapid account creation from same IP`);
      }
    }

    // 10. Check for new account with high activity (possible bot)
    const accountAge = Date.now() - new Date(profile.created_at).getTime();
    const accountAgeDays = accountAge / (1000 * 60 * 60 * 24);

    if (accountAgeDays < 1) {
      const { count: rewardCount } = await adminSupabase
        .from("reward_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // More than 50 rewards in first day is suspicious
      if (rewardCount && rewardCount > 50) {
        suspiciousScore += 2;
        reasons.push(`High activity on new account (${rewardCount} rewards in first day)`);
      }
    }

    // 11. Update user's suspicious score in database
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({ suspicious_score: suspiciousScore })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update suspicious score:", updateError);
    }

    // 12. Determine recommendation
    const canAutoApprove = suspiciousScore < 3;
    const recommendation = canAutoApprove ? 'auto_approve' : 'manual_review';

    console.log(`User ${userId} suspicious score: ${suspiciousScore}, recommendation: ${recommendation}`);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        suspiciousScore,
        reasons,
        recommendation,
        canAutoApprove
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Detect abuse error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
