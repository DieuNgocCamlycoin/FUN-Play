import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default values (fallback if config not available)
const DEFAULT_CONFIG = {
  SHORT_VIDEO_REWARD: 20000,
  LONG_VIDEO_REWARD: 70000,
  SHORT_VIDEO_MAX_DURATION: 180, // 3 minutes in seconds
  MIN_VIEWS_FOR_UPLOAD_REWARD: 3,
  DAILY_SHORT_VIDEO_LIMIT: 5,
  DAILY_LONG_VIDEO_LIMIT: 3,
  AUTO_APPROVE_THRESHOLD: 3,
};

// Helper to get config from database
async function getConfig(adminSupabase: any): Promise<Record<string, number>> {
  try {
    const { data: configData, error } = await adminSupabase
      .from("reward_config")
      .select("config_key, config_value");

    if (error || !configData || configData.length === 0) {
      console.log("Using default config for upload rewards");
      return DEFAULT_CONFIG;
    }

    const config: Record<string, number> = { ...DEFAULT_CONFIG };
    for (const c of configData) {
      config[c.config_key] = Number(c.config_value);
    }

    return config;
  } catch (err) {
    console.error("Error loading config:", err);
    return DEFAULT_CONFIG;
  }
}

serve(async (req) => {
  console.log("=== CHECK-UPLOAD-REWARD FUNCTION STARTED ===");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // 3. Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === ANTI-FARMING GATES ===
    const { data: profileGate } = await adminSupabase
      .from('profiles')
      .select('created_at, signup_ip_hash, banned')
      .eq('id', user.id)
      .single();

    // Gate C: Ban check
    if (profileGate?.banned) {
      console.log(`User ${user.id} is banned - blocking upload reward`);
      return new Response(
        JSON.stringify({ success: false, error: 'Account suspended' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gate A: 24-hour account age
    const accountAgeHours = (Date.now() - new Date(profileGate?.created_at || 0).getTime()) / 3600000;
    if (accountAgeHours < 24) {
      console.log(`User ${user.id} account too new (${accountAgeHours.toFixed(1)}h) - blocking upload reward`);
      return new Response(
        JSON.stringify({ success: false, reason: 'Account must be 24 hours old for upload rewards', accountAgeHours: Math.floor(accountAgeHours) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gate B: IP cluster block (5+ accounts from same signup IP)
    if (profileGate?.signup_ip_hash) {
      const { count: sameIpCount } = await adminSupabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('signup_ip_hash', profileGate.signup_ip_hash);

      if ((sameIpCount || 0) >= 5) {
        console.log(`User ${user.id} from IP cluster (${sameIpCount} accounts) - blocking upload reward`);
        return new Response(
          JSON.stringify({ success: false, reason: 'Upload rewards blocked - suspicious IP cluster' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // === END ANTI-FARMING GATES ===

    const { videoId } = await req.json();
    if (!videoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Video ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking upload reward for video: ${videoId}, user: ${user.id}`);

    // 4. Get config
    const config = await getConfig(adminSupabase);

    // 5. Get video details
    const { data: video, error: videoError } = await adminSupabase
      .from("videos")
      .select("id, user_id, duration, view_count, upload_rewarded, created_at")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      console.log("Video not found:", videoId);
      return new Response(
        JSON.stringify({ success: false, error: 'Video not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Verify video belongs to user
    if (video.user_id !== user.id) {
      console.log("Video does not belong to user");
      return new Response(
        JSON.stringify({ success: false, error: 'Not your video' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Check if already rewarded
    if (video.upload_rewarded) {
      console.log("Video already rewarded");
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: 'Video already rewarded',
          alreadyRewarded: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Check if video has enough views
    const viewCount = video.view_count || 0;
    const minViews = config.MIN_VIEWS_FOR_UPLOAD_REWARD;
    
    if (viewCount < minViews) {
      console.log(`Video has ${viewCount} views, needs ${minViews}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: `Need ${minViews} views to receive upload reward (currently: ${viewCount})`,
          viewCount,
          minViews,
          needsMoreViews: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Determine video type (short or long)
    const durationSeconds = video.duration || 0;
    const isShortVideo = durationSeconds < config.SHORT_VIDEO_MAX_DURATION;
    const videoType = isShortVideo ? 'SHORT' : 'LONG';
    const rewardAmount = isShortVideo ? config.SHORT_VIDEO_REWARD : config.LONG_VIDEO_REWARD;

    console.log(`Video type: ${videoType}, duration: ${durationSeconds}s, reward: ${rewardAmount}`);

    // 10. Check daily limits for this video type
    const today = new Date().toISOString().split('T')[0];
    
    let { data: dailyLimits, error: limitsError } = await adminSupabase
      .from("daily_reward_limits")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (limitsError && limitsError.code === 'PGRST116') {
      // Create daily limits record
      const { data: newLimits } = await adminSupabase
        .from("daily_reward_limits")
        .insert({ user_id: user.id, date: today })
        .select()
        .single();
      dailyLimits = newLimits;
    }

    const currentShortCount = dailyLimits?.short_video_count || 0;
    const currentLongCount = dailyLimits?.long_video_count || 0;

    if (isShortVideo && currentShortCount >= config.DAILY_SHORT_VIDEO_LIMIT) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: `Daily short video reward limit reached (${config.DAILY_SHORT_VIDEO_LIMIT})`,
          limitReached: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isShortVideo && currentLongCount >= config.DAILY_LONG_VIDEO_LIMIT) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: `Daily long video reward limit reached (${config.DAILY_LONG_VIDEO_LIMIT})`,
          limitReached: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Get user profile for suspicious score check
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("total_camly_rewards, pending_rewards, approved_reward, suspicious_score")
      .eq("id", user.id)
      .single();

    const suspiciousScore = profile?.suspicious_score || 0;
    const canAutoApprove = suspiciousScore < config.AUTO_APPROVE_THRESHOLD;

    // 12. Calculate new totals
    const oldTotal = Number(profile?.total_camly_rewards) || 0;
    const newTotal = oldTotal + rewardAmount;
    const oldPending = Number(profile?.pending_rewards) || 0;
    const oldApproved = Number(profile?.approved_reward) || 0;

    let newPending = oldPending;
    let newApproved = oldApproved;

    if (canAutoApprove) {
      newApproved = oldApproved + rewardAmount;
    } else {
      newPending = oldPending + rewardAmount;
    }

    // 13. Update profile
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        total_camly_rewards: newTotal,
        pending_rewards: newPending,
        approved_reward: newApproved
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update profile:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update rewards' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 14. Mark video as rewarded
    await adminSupabase
      .from("videos")
      .update({ upload_rewarded: true })
      .eq("id", videoId);

    // 15. Create reward transaction
    const txHash = `UPLOAD_${videoType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await adminSupabase.from("reward_transactions").insert({
      user_id: user.id,
      video_id: videoId,
      amount: rewardAmount,
      reward_type: `${videoType}_VIDEO_UPLOAD`,
      status: "success",
      tx_hash: txHash,
      approved: canAutoApprove,
      approved_at: canAutoApprove ? new Date().toISOString() : null,
    });

    // 16. Update daily limits
    const updateField = isShortVideo ? 'short_video_count' : 'long_video_count';
    const currentCount = isShortVideo ? currentShortCount : currentLongCount;
    
    await adminSupabase
      .from("daily_reward_limits")
      .update({ 
        [updateField]: currentCount + 1,
        upload_rewards_earned: (dailyLimits?.upload_rewards_earned || 0) + rewardAmount,
        uploads_count: (dailyLimits?.uploads_count || 0) + 1
      })
      .eq("user_id", user.id)
      .eq("date", today);

    console.log(`Upload reward granted: ${rewardAmount} CAMLY for ${videoType} video`);

    return new Response(
      JSON.stringify({
        success: true,
        amount: rewardAmount,
        videoType,
        newTotal,
        autoApproved: canAutoApprove,
        message: canAutoApprove 
          ? `You earned ${rewardAmount.toLocaleString()} CAMLY for your ${videoType.toLowerCase()} video!`
          : `${rewardAmount.toLocaleString()} CAMLY pending admin approval`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check upload reward error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
