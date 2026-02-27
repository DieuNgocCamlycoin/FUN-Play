import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_REWARD_AMOUNTS: Record<string, number> = {
  VIEW: 5000,
  LIKE: 2000,
  SHARE: 5000,
};

const DEFAULT_DAILY_LIMITS: Record<string, number> = {
  VIEW_COUNT: 10,
  LIKE_COUNT: 20,
  SHARE_COUNT: 10,
};

// New defaults for short/long video differentiation
const DEFAULT_SHORT_VIDEO_VIEW_REWARD = 3000;
const DEFAULT_LONG_VIDEO_VIEW_REWARD = 8000;
const DEFAULT_SHORT_VIDEO_MIN_WATCH_PERCENT = 90;
const DEFAULT_LONG_VIDEO_MIN_WATCH_SECONDS = 300;
const DEFAULT_SHORT_VIDEO_MAX_DURATION = 180;

const DAILY_TOTAL_CAP = 500000;

interface BatchAction {
  type: 'VIEW' | 'LIKE' | 'SHARE';
  videoId: string;
  timestamp: number;
  actualWatchTime?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // === BAN CHECK ===
    const { data: profileCheck } = await adminSupabase
      .from('profiles')
      .select('banned')
      .eq('id', userId)
      .single();

    if (profileCheck?.banned === true) {
      return new Response(
        JSON.stringify({ success: false, reason: 'Account suspended', results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { actions } = await req.json() as { actions: BatchAction[] };
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No actions provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cap batch size to prevent abuse
    const cappedActions = actions.slice(0, 20);

    // === FAST-PATH: Load daily limits once ===
    const today = new Date().toISOString().split('T')[0];
    let { data: limits, error: limitsError } = await adminSupabase
      .from("daily_reward_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (limitsError && limitsError.code === 'PGRST116') {
      const { data: newLimits } = await adminSupabase
        .from("daily_reward_limits")
        .insert({ user_id: userId, date: today })
        .select()
        .single();
      limits = newLimits;
    }

    if (!limits) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load reward config
    let rewardAmounts = { ...DEFAULT_REWARD_AMOUNTS };
    let dailyLimits = { ...DEFAULT_DAILY_LIMITS };
    let shortVideoViewReward = DEFAULT_SHORT_VIDEO_VIEW_REWARD;
    let longVideoViewReward = DEFAULT_LONG_VIDEO_VIEW_REWARD;
    let shortVideoMinWatchPercent = DEFAULT_SHORT_VIDEO_MIN_WATCH_PERCENT;
    let longVideoMinWatchSeconds = DEFAULT_LONG_VIDEO_MIN_WATCH_SECONDS;
    let shortVideoMaxDuration = DEFAULT_SHORT_VIDEO_MAX_DURATION;
    
    const { data: configData } = await adminSupabase
      .from("reward_config")
      .select("config_key, config_value");

    if (configData) {
      for (const c of configData) {
        if (c.config_key === 'VIEW_REWARD') rewardAmounts.VIEW = Number(c.config_value);
        else if (c.config_key === 'LIKE_REWARD') rewardAmounts.LIKE = Number(c.config_value);
        else if (c.config_key === 'SHARE_REWARD') rewardAmounts.SHARE = Number(c.config_value);
        else if (c.config_key === 'DAILY_VIEW_COUNT_LIMIT') dailyLimits.VIEW_COUNT = Number(c.config_value);
        else if (c.config_key === 'DAILY_LIKE_COUNT_LIMIT') dailyLimits.LIKE_COUNT = Number(c.config_value);
        else if (c.config_key === 'DAILY_SHARE_COUNT_LIMIT') dailyLimits.SHARE_COUNT = Number(c.config_value);
        else if (c.config_key === 'SHORT_VIDEO_VIEW_REWARD') shortVideoViewReward = Number(c.config_value);
        else if (c.config_key === 'LONG_VIDEO_VIEW_REWARD') longVideoViewReward = Number(c.config_value);
        else if (c.config_key === 'SHORT_VIDEO_MIN_WATCH_PERCENT') shortVideoMinWatchPercent = Number(c.config_value);
        else if (c.config_key === 'LONG_VIDEO_MIN_WATCH_SECONDS') longVideoMinWatchSeconds = Number(c.config_value);
        else if (c.config_key === 'SHORT_VIDEO_MAX_DURATION') shortVideoMaxDuration = Number(c.config_value);
      }
    }

    // Check auto-approve
    let canAutoApprove = false;
    try {
      const { data: autoConfig } = await adminSupabase
        .from("reward_config")
        .select("config_value")
        .eq("config_key", "AUTO_APPROVE_ENABLED")
        .single();

      if (autoConfig?.config_value === 1) {
        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("suspicious_score")
          .eq("id", userId)
          .single();
        canAutoApprove = (profile?.suspicious_score || 0) < 3;
      }
    } catch { canAutoApprove = false; }

    // Mutable counters
    let viewCount = limits.view_count || 0;
    let likeCount = limits.like_count || 0;
    let shareCount = limits.share_count || 0;
    let shortVideoCount = limits.short_video_count || 0;
    let longVideoCount = limits.long_video_count || 0;
    let viewEarned = limits.view_rewards_earned || 0;
    let likeEarned = limits.like_rewards_earned || 0;
    let shareEarned = limits.share_rewards_earned || 0;
    let totalTodayEarned = viewEarned + likeEarned + shareEarned +
      (limits.comment_rewards_earned || 0) + (limits.upload_rewards_earned || 0);

    const results: any[] = [];
    let totalAwarded = 0;

    for (const action of cappedActions) {
      const { type, videoId, actualWatchTime } = action;
      if (!['VIEW', 'LIKE', 'SHARE'].includes(type) || !videoId) {
        results.push({ type, videoId, success: false, reason: 'Invalid action' });
        continue;
      }

      // Check daily count limit
      if (type === 'VIEW' && viewCount >= dailyLimits.VIEW_COUNT) {
        results.push({ type, videoId, success: false, reason: 'Daily limit reached' });
        continue;
      }
      if (type === 'LIKE' && likeCount >= dailyLimits.LIKE_COUNT) {
        results.push({ type, videoId, success: false, reason: 'Daily limit reached' });
        continue;
      }
      if (type === 'SHARE' && shareCount >= dailyLimits.SHARE_COUNT) {
        results.push({ type, videoId, success: false, reason: 'Daily limit reached' });
        continue;
      }

      // Determine reward amount — for VIEW, classify by video duration
      let amount = rewardAmounts[type] || 0;
      let videoCategory: 'short' | 'long' | null = null;

      if (type === 'VIEW') {
        // Fetch video duration for classification
        const { data: videoData } = await adminSupabase
          .from("videos")
          .select("duration")
          .eq("id", videoId)
          .single();

        const videoDuration = videoData?.duration || 0;

        if (videoDuration > 0) {
          const isShort = videoDuration <= shortVideoMaxDuration;
          videoCategory = isShort ? 'short' : 'long';

          // Determine required watch time
          const requiredWatch = isShort
            ? videoDuration * (shortVideoMinWatchPercent / 100)
            : longVideoMinWatchSeconds;

          // Validate watch time
          if (actualWatchTime == null || actualWatchTime < requiredWatch) {
            const watchPct = actualWatchTime != null ? Math.round((actualWatchTime / videoDuration) * 100) : 0;
            console.log(`[batch] Rejected VIEW for ${videoId}: category=${videoCategory}, watchTime=${actualWatchTime ?? 0}s, required=${requiredWatch}s, duration=${videoDuration}s`);
            
            // Log the rejected view
            await adminSupabase.from("view_logs").insert({
              user_id: userId,
              video_id: videoId,
              watch_time_seconds: actualWatchTime ?? 0,
              watch_percentage: watchPct,
              video_duration_seconds: videoDuration,
              is_valid: false,
            });
            
            results.push({ type, videoId, success: false, reason: 'Insufficient watch time', videoCategory });
            continue;
          }

          // Set reward amount based on category
          amount = isShort ? shortVideoViewReward : longVideoViewReward;
        }
      }

      // Check total daily cap
      if (totalTodayEarned + amount > DAILY_TOTAL_CAP) {
        results.push({ type, videoId, success: false, reason: 'Daily total cap reached' });
        continue;
      }

      // Check already rewarded
      const { data: existing } = await adminSupabase
        .from("reward_actions")
        .select("id")
        .eq("user_id", userId)
        .eq("video_id", videoId)
        .eq("action_type", type)
        .limit(1);

      if (existing && existing.length > 0) {
        results.push({ type, videoId, success: false, reason: 'Already rewarded' });
        continue;
      }

      // VIEW: dedup check
      if (type === 'VIEW') {
        const cutoff = new Date(Date.now() - 60000).toISOString();
        const { data: recentViews } = await adminSupabase
          .from("view_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("video_id", videoId)
          .gte("created_at", cutoff)
          .limit(1);

        if (recentViews && recentViews.length > 0) {
          results.push({ type, videoId, success: false, reason: 'Duplicate view' });
          continue;
        }
      }

      // Award the reward
      const { error: rpcError } = await adminSupabase.rpc('atomic_increment_reward', {
        p_user_id: userId,
        p_amount: amount,
        p_auto_approve: canAutoApprove,
      });

      if (rpcError) {
        results.push({ type, videoId, success: false, reason: 'DB error' });
        continue;
      }

      // Record transaction
      const txHash = `BATCH_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await adminSupabase.from("reward_transactions").insert({
        user_id: userId,
        video_id: videoId,
        amount,
        reward_type: type,
        status: "success",
        tx_hash: txHash,
        approved: canAutoApprove,
        approved_at: canAutoApprove ? new Date().toISOString() : null,
      });

      // Record action
      await adminSupabase.from("reward_actions").upsert({
        user_id: userId,
        video_id: videoId,
        action_type: type,
      }, { onConflict: 'user_id,video_id,action_type', ignoreDuplicates: true });

      // Log valid view with details
      if (type === 'VIEW') {
        const { data: vData } = await adminSupabase
          .from("videos")
          .select("duration")
          .eq("id", videoId)
          .single();
        const vDuration = vData?.duration || 0;
        const watchPct = vDuration > 0 ? Math.round(((actualWatchTime ?? 0) / vDuration) * 100) : 0;
        
        await adminSupabase.from("view_logs").insert({
          user_id: userId,
          video_id: videoId,
          watch_time_seconds: actualWatchTime ?? 0,
          watch_percentage: watchPct,
          video_duration_seconds: vDuration,
          is_valid: true,
        });
      }

      // Update counters
      if (type === 'VIEW') {
        viewCount++;
        viewEarned += amount;
        if (videoCategory === 'short') shortVideoCount++;
        else if (videoCategory === 'long') longVideoCount++;
      }
      else if (type === 'LIKE') { likeCount++; likeEarned += amount; }
      else if (type === 'SHARE') { shareCount++; shareEarned += amount; }
      totalTodayEarned += amount;
      totalAwarded += amount;

      results.push({ type, videoId, success: true, amount, autoApproved: canAutoApprove, videoCategory });
    }

    // Update daily limits in one shot
    await adminSupabase
      .from("daily_reward_limits")
      .update({
        view_count: viewCount,
        like_count: likeCount,
        share_count: shareCount,
        short_video_count: shortVideoCount,
        long_video_count: longVideoCount,
        view_rewards_earned: viewEarned,
        like_rewards_earned: likeEarned,
        share_rewards_earned: shareEarned,
      })
      .eq("user_id", userId)
      .eq("date", today);

    console.log(`[batch-award-camly] Processed ${cappedActions.length} actions for user ${userId}, awarded ${totalAwarded} CAMLY`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        dailyCounts: {
          view_count: viewCount,
          like_count: likeCount,
          share_count: shareCount,
          short_video_count: shortVideoCount,
          long_video_count: longVideoCount,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch award error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
