import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default reward amounts (fallback if reward_config not available)
const DEFAULT_REWARD_AMOUNTS: Record<string, number> = {
  VIEW: 10000,
  LIKE: 5000,
  COMMENT: 5000,
  SHARE: 5000,
  UPLOAD: 100000,
  FIRST_UPLOAD: 500000,
  SIGNUP: 50000,
};

// Default daily limits (fallback if reward_config not available)
const DEFAULT_DAILY_LIMITS: Record<string, number> = {
  VIEW_REWARDS: 100000,
  COMMENT_REWARDS: 50000,
  UPLOAD_COUNT: 10,
};

// Helper to get reward config from database
async function getRewardConfig(adminSupabase: any): Promise<{ amounts: Record<string, number>; limits: Record<string, number> }> {
  try {
    const { data: configData, error } = await adminSupabase
      .from("reward_config")
      .select("config_key, config_value");

    if (error || !configData || configData.length === 0) {
      console.log("Using default reward config");
      return { amounts: DEFAULT_REWARD_AMOUNTS, limits: DEFAULT_DAILY_LIMITS };
    }

    const amounts: Record<string, number> = { ...DEFAULT_REWARD_AMOUNTS };
    const limits: Record<string, number> = { ...DEFAULT_DAILY_LIMITS };

    for (const config of configData) {
      const key = config.config_key;
      const value = Number(config.config_value);

      // Map config keys to reward amounts
      if (key === 'VIEW_REWARD') amounts.VIEW = value;
      else if (key === 'LIKE_REWARD') amounts.LIKE = value;
      else if (key === 'COMMENT_REWARD') amounts.COMMENT = value;
      else if (key === 'SHARE_REWARD') amounts.SHARE = value;
      else if (key === 'UPLOAD_REWARD') amounts.UPLOAD = value;
      else if (key === 'FIRST_UPLOAD_REWARD') amounts.FIRST_UPLOAD = value;
      else if (key === 'SIGNUP_REWARD') amounts.SIGNUP = value;
      // Map config keys to limits
      else if (key === 'DAILY_VIEW_LIMIT') limits.VIEW_REWARDS = value;
      else if (key === 'DAILY_COMMENT_LIMIT') limits.COMMENT_REWARDS = value;
      else if (key === 'DAILY_UPLOAD_LIMIT') limits.UPLOAD_COUNT = value;
    }

    console.log("Loaded reward config from database:", { amounts, limits });
    return { amounts, limits };
  } catch (err) {
    console.error("Error loading reward config:", err);
    return { amounts: DEFAULT_REWARD_AMOUNTS, limits: DEFAULT_DAILY_LIMITS };
  }
}

// Check for duplicate views within time window (anti-fraud)
async function checkViewDedupe(adminSupabase: any, userId: string, videoId: string): Promise<boolean> {
  const dedupeWindowSeconds = 60; // 60 second window
  const cutoffTime = new Date(Date.now() - dedupeWindowSeconds * 1000).toISOString();

  const { data: recentViews, error } = await adminSupabase
    .from("view_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .gte("created_at", cutoffTime)
    .limit(1);

  if (error) {
    console.error("Error checking view dedupe:", error);
    return false; // Allow on error to not block legitimate users
  }

  return !recentViews || recentViews.length === 0;
}

// Check for spam comments (same content hash)
async function checkCommentSpam(adminSupabase: any, userId: string, contentHash: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const { data: duplicateComments, error } = await adminSupabase
    .from("comment_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("content_hash", contentHash)
    .gte("created_at", today)
    .limit(1);

  if (error) {
    console.error("Error checking comment spam:", error);
    return false; // Allow on error
  }

  return !duplicateComments || duplicateComments.length === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // 3. Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const { type, videoId, contentHash, sessionId } = await req.json();

    // 4. Validate reward type
    const validTypes = ['VIEW', 'LIKE', 'COMMENT', 'SHARE', 'UPLOAD', 'FIRST_UPLOAD', 'SIGNUP'];
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid reward type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Use service role for database operations
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // 6. Load reward config from database
    const { amounts: REWARD_AMOUNTS, limits: DAILY_LIMITS } = await getRewardConfig(adminSupabase);

    // 7. Get server-controlled reward amount
    const amount = REWARD_AMOUNTS[type] || 0;
    if (amount === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Reward type not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Anti-fraud checks
    if (type === "VIEW" && videoId) {
      const isUniqueView = await checkViewDedupe(adminSupabase, userId, videoId);
      if (!isUniqueView) {
        console.log(`Duplicate view detected for user ${userId} on video ${videoId}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: "Duplicate view detected. Please wait before watching again.",
            milestone: null,
            newTotal: 0,
            amount: 0,
            type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (type === "COMMENT" && contentHash) {
      const isUniqueComment = await checkCommentSpam(adminSupabase, userId, contentHash);
      if (!isUniqueComment) {
        console.log(`Spam comment detected for user ${userId}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: "Duplicate comment detected. Please write a unique comment.",
            milestone: null,
            newTotal: 0,
            amount: 0,
            type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 9. Get or create daily limits (server-side)
    const today = new Date().toISOString().split('T')[0];
    
    let { data: limits, error: limitsError } = await adminSupabase
      .from("daily_reward_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (limitsError && limitsError.code === 'PGRST116') {
      const { data: newLimits, error: insertError } = await adminSupabase
        .from("daily_reward_limits")
        .insert({ user_id: userId, date: today })
        .select()
        .single();
      
      if (insertError) {
        console.error('Failed to create daily limits:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Database error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      limits = newLimits;
    } else if (limitsError) {
      console.error('Failed to get daily limits:', limitsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. Check daily limits (server-side enforcement)
    if (type === "VIEW" || type === "LIKE" || type === "SHARE") {
      if (Number(limits.view_rewards_earned) + amount > DAILY_LIMITS.VIEW_REWARDS) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Daily view reward limit reached (${DAILY_LIMITS.VIEW_REWARDS.toLocaleString()} CAMLY)`,
            milestone: null,
            newTotal: 0,
            amount: 0,
            type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (type === "COMMENT") {
      if (Number(limits.comment_rewards_earned) + amount > DAILY_LIMITS.COMMENT_REWARDS) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Daily comment reward limit reached (${DAILY_LIMITS.COMMENT_REWARDS.toLocaleString()} CAMLY)`,
            milestone: null,
            newTotal: 0,
            amount: 0,
            type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (type === "UPLOAD") {
      if (Number(limits.uploads_count) >= DAILY_LIMITS.UPLOAD_COUNT) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Daily upload limit reached (${DAILY_LIMITS.UPLOAD_COUNT} uploads)`,
            milestone: null,
            newTotal: 0,
            amount: 0,
            type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 11. Get current total rewards
    const { data: profileData, error: profileError } = await adminSupabase
      .from("profiles")
      .select("total_camly_rewards, pending_rewards")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error('Failed to get profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const oldTotal = Number(profileData?.total_camly_rewards) || 0;
    const newTotal = oldTotal + amount;
    const oldPending = Number(profileData?.pending_rewards) || 0;
    const newPending = oldPending + amount;

    // 12. Update profile with new total and pending rewards (atomic operation)
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({ 
        total_camly_rewards: newTotal,
        pending_rewards: newPending 
      })
      .eq("id", userId);

    if (updateError) {
      console.error('Failed to update rewards:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update rewards' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 13. Create reward transaction record
    const txHash = `REWARD_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await adminSupabase.from("reward_transactions").insert({
      user_id: userId,
      video_id: videoId || null,
      amount: amount,
      reward_type: type,
      status: "success",
      tx_hash: txHash,
    });

    // 14. Update daily limits
    if (type === "VIEW" || type === "LIKE" || type === "SHARE") {
      await adminSupabase
        .from("daily_reward_limits")
        .update({ view_rewards_earned: Number(limits.view_rewards_earned) + amount })
        .eq("user_id", userId)
        .eq("date", today);
    } else if (type === "COMMENT") {
      await adminSupabase
        .from("daily_reward_limits")
        .update({ comment_rewards_earned: Number(limits.comment_rewards_earned) + amount })
        .eq("user_id", userId)
        .eq("date", today);
    } else if (type === "UPLOAD") {
      await adminSupabase
        .from("daily_reward_limits")
        .update({ 
          upload_rewards_earned: Number(limits.upload_rewards_earned) + amount,
          uploads_count: Number(limits.uploads_count) + 1
        })
        .eq("user_id", userId)
        .eq("date", today);
    }

    // 15. Check for milestones
    const MILESTONES = [10, 100, 1000, 10000, 100000, 500000, 1000000];
    const reachedMilestone = MILESTONES.find(
      milestone => oldTotal < milestone && newTotal >= milestone
    ) || null;

    console.log(`Awarded ${amount} CAMLY to user ${userId} for ${type}. New total: ${newTotal}, Pending: ${newPending}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        milestone: reachedMilestone, 
        newTotal, 
        pendingRewards: newPending,
        amount, 
        type 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Award CAMLY error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
