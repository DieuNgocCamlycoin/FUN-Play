import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reward amounts - server-side source of truth
const REWARD_AMOUNTS = {
  VIEW: 500,
  LIKE: 500,
  COMMENT: 5000,
  SHARE: 2000,
  UPLOAD: 50000,
};

// Daily limits - enforced server-side
const DAILY_LIMITS = {
  VIEW_REWARDS: 50000,
  COMMENT_REWARDS: 25000,
  UPLOAD_COUNT: 10,
};

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
    const { type, videoId } = await req.json();

    // 4. Validate reward type
    const validTypes = ['VIEW', 'LIKE', 'COMMENT', 'SHARE', 'UPLOAD'];
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid reward type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Get server-controlled reward amount (ignore any client-provided amount)
    const amount = REWARD_AMOUNTS[type as keyof typeof REWARD_AMOUNTS];

    // 6. Use service role for database operations
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // 7. Get or create daily limits (server-side)
    const today = new Date().toISOString().split('T')[0];
    
    let { data: limits, error: limitsError } = await adminSupabase
      .from("daily_reward_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (limitsError && limitsError.code === 'PGRST116') {
      // Create new record
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

    // 8. Check daily limits (server-side enforcement)
    if (type === "VIEW" || type === "LIKE" || type === "SHARE") {
      if (Number(limits.view_rewards_earned) + amount > DAILY_LIMITS.VIEW_REWARDS) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: "Daily view reward limit reached (50,000 CAMLY)",
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
            reason: "Daily comment reward limit reached (25,000 CAMLY)",
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
            reason: "Daily upload limit reached (10 uploads)",
            milestone: null,
            newTotal: 0,
            amount: 0,
            type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 9. Get current total rewards
    const { data: profileData, error: profileError } = await adminSupabase
      .from("profiles")
      .select("total_camly_rewards")
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

    // 10. Update profile with new total (atomic operation)
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({ total_camly_rewards: newTotal })
      .eq("id", userId);

    if (updateError) {
      console.error('Failed to update rewards:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update rewards' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Create reward transaction record
    const txHash = `REWARD_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await adminSupabase.from("reward_transactions").insert({
      user_id: userId,
      video_id: videoId || null,
      amount: amount,
      reward_type: type,
      status: "success",
      tx_hash: txHash,
    });

    // 12. Update daily limits
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

    // 13. Check for milestones
    const MILESTONES = [10, 100, 1000, 10000, 100000];
    const reachedMilestone = MILESTONES.find(
      milestone => oldTotal < milestone && newTotal >= milestone
    ) || null;

    console.log(`Awarded ${amount} CAMLY to user ${userId} for ${type}. New total: ${newTotal}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        milestone: reachedMilestone, 
        newTotal, 
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
