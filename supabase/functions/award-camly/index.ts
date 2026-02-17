import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default reward amounts (fallback if reward_config not available)
const DEFAULT_REWARD_AMOUNTS: Record<string, number> = {
  VIEW: 5000,
  LIKE: 2000,
  COMMENT: 5000,
  SHARE: 5000,
  SHORT_VIDEO_UPLOAD: 20000,
  LONG_VIDEO_UPLOAD: 70000,
  UPLOAD: 100000, // Legacy - will be deprecated
  FIRST_UPLOAD: 500000,
  SIGNUP: 50000,
  WALLET_CONNECT: 50000,
};

// Default daily limits (COUNT-based, not amount-based)
const DEFAULT_DAILY_LIMITS: Record<string, number> = {
  VIEW_COUNT: 10,
  LIKE_COUNT: 20,
  SHARE_COUNT: 10,
  COMMENT_COUNT: 10,
  SHORT_VIDEO: 5,
  LONG_VIDEO: 3,
  UPLOAD_COUNT: 10, // Legacy
};

// Default validation config
const DEFAULT_VALIDATION: Record<string, number> = {
  MIN_COMMENT_LENGTH: 20,
  MIN_WATCH_PERCENTAGE: 30,
  AUTO_APPROVE_THRESHOLD: 3,
};

// Helper to get reward config from database
async function getRewardConfig(adminSupabase: any): Promise<{
  amounts: Record<string, number>;
  limits: Record<string, number>;
  validation: Record<string, number>;
}> {
  try {
    const { data: configData, error } = await adminSupabase
      .from("reward_config")
      .select("config_key, config_value");

    if (error || !configData || configData.length === 0) {
      console.log("Using default reward config");
      return {
        amounts: DEFAULT_REWARD_AMOUNTS,
        limits: DEFAULT_DAILY_LIMITS,
        validation: DEFAULT_VALIDATION,
      };
    }

    const amounts: Record<string, number> = { ...DEFAULT_REWARD_AMOUNTS };
    const limits: Record<string, number> = { ...DEFAULT_DAILY_LIMITS };
    const validation: Record<string, number> = { ...DEFAULT_VALIDATION };

    for (const config of configData) {
      const key = config.config_key;
      const value = Number(config.config_value);

      // Map config keys to reward amounts
      if (key === 'VIEW_REWARD') amounts.VIEW = value;
      else if (key === 'LIKE_REWARD') amounts.LIKE = value;
      else if (key === 'COMMENT_REWARD') amounts.COMMENT = value;
      else if (key === 'SHARE_REWARD') amounts.SHARE = value;
      else if (key === 'UPLOAD_REWARD') amounts.UPLOAD = value;
      else if (key === 'SHORT_VIDEO_REWARD') amounts.SHORT_VIDEO_UPLOAD = value;
      else if (key === 'LONG_VIDEO_REWARD') amounts.LONG_VIDEO_UPLOAD = value;
      else if (key === 'FIRST_UPLOAD_REWARD') amounts.FIRST_UPLOAD = value;
      else if (key === 'SIGNUP_REWARD') amounts.SIGNUP = value;
      else if (key === 'WALLET_CONNECT_REWARD') amounts.WALLET_CONNECT = value;
      // Map config keys to count-based limits
      else if (key === 'DAILY_VIEW_COUNT_LIMIT') limits.VIEW_COUNT = value;
      else if (key === 'DAILY_LIKE_COUNT_LIMIT') limits.LIKE_COUNT = value;
      else if (key === 'DAILY_SHARE_COUNT_LIMIT') limits.SHARE_COUNT = value;
      else if (key === 'DAILY_COMMENT_COUNT_LIMIT') limits.COMMENT_COUNT = value;
      else if (key === 'DAILY_SHORT_VIDEO_LIMIT') limits.SHORT_VIDEO = value;
      else if (key === 'DAILY_LONG_VIDEO_LIMIT') limits.LONG_VIDEO = value;
      else if (key === 'DAILY_UPLOAD_LIMIT') limits.UPLOAD_COUNT = value;
      // Map validation config
      else if (key === 'MIN_COMMENT_LENGTH') validation.MIN_COMMENT_LENGTH = value;
      else if (key === 'MIN_WATCH_PERCENTAGE') validation.MIN_WATCH_PERCENTAGE = value;
      else if (key === 'AUTO_APPROVE_THRESHOLD') validation.AUTO_APPROVE_THRESHOLD = value;
    }

    console.log("Loaded reward config from database");
    return { amounts, limits, validation };
  } catch (err) {
    console.error("Error loading reward config:", err);
    return {
      amounts: DEFAULT_REWARD_AMOUNTS,
      limits: DEFAULT_DAILY_LIMITS,
      validation: DEFAULT_VALIDATION,
    };
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
    return false;
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
    return false;
  }

  return !duplicateComments || duplicateComments.length === 0;
}

// Check if action already rewarded for this video (LIKE/SHARE only once per video)
async function checkAlreadyRewarded(
  adminSupabase: any,
  userId: string,
  videoId: string,
  actionType: string
): Promise<boolean> {
  const { data: existingAction, error } = await adminSupabase
    .from("reward_actions")
    .select("id")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .eq("action_type", actionType)
    .limit(1);

  if (error) {
    console.error("Error checking reward actions:", error);
    return false; // Allow on error
  }

  return existingAction && existingAction.length > 0;
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

    // === BAN CHECK (early exit before any reward logic) ===
    const serviceRoleKeyEarly = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminSupabaseEarly = createClient(supabaseUrl, serviceRoleKeyEarly);
    const { data: profileCheck } = await adminSupabaseEarly
      .from('profiles')
      .select('banned')
      .eq('id', userId)
      .single();
    
    if (profileCheck?.banned === true) {
      console.log(`[award-camly] Blocked banned user ${userId}`);
      return new Response(
        JSON.stringify({ success: false, reason: 'Account suspended', milestone: null, newTotal: 0, amount: 0, type: 'BLOCKED' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, videoId, contentHash, commentLength, sessionId } = await req.json();

    // 4. Validate reward type
    const validTypes = [
      'VIEW', 'LIKE', 'COMMENT', 'SHARE',
      'UPLOAD', 'SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD',
      'FIRST_UPLOAD', 'SIGNUP', 'WALLET_CONNECT'
    ];
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
    const { amounts: REWARD_AMOUNTS, limits: DAILY_LIMITS, validation } = await getRewardConfig(adminSupabase);

    // 7. Get server-controlled reward amount
    let effectiveType = type;
    let amount = REWARD_AMOUNTS[type] || 0;
    if (amount === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Reward type not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7b. Server-side duration verification for ALL upload reward types (including legacy UPLOAD)
    if ((effectiveType === 'SHORT_VIDEO_UPLOAD' || effectiveType === 'LONG_VIDEO_UPLOAD' || effectiveType === 'UPLOAD') && videoId) {
      const { data: videoData } = await adminSupabase
        .from('videos').select('duration').eq('id', videoId).single();
      
      if (videoData?.duration) {
        // Always reclassify based on actual duration from DB
        if (videoData.duration > 180) {
          if (effectiveType !== 'LONG_VIDEO_UPLOAD') {
            console.warn(`Override: Video ${videoId} duration=${videoData.duration}s, changing ${effectiveType} -> LONG_VIDEO_UPLOAD`);
          }
          effectiveType = 'LONG_VIDEO_UPLOAD';
          amount = REWARD_AMOUNTS['LONG_VIDEO_UPLOAD'];
        } else {
          if (effectiveType !== 'SHORT_VIDEO_UPLOAD') {
            console.warn(`Override: Video ${videoId} duration=${videoData.duration}s, changing ${effectiveType} -> SHORT_VIDEO_UPLOAD`);
          }
          effectiveType = 'SHORT_VIDEO_UPLOAD';
          amount = REWARD_AMOUNTS['SHORT_VIDEO_UPLOAD'];
        }
      } else {
        // Duration is NULL - default to SHORT but log for reconciliation
        console.warn(`Video ${videoId} has NULL duration, defaulting to SHORT_VIDEO_UPLOAD. Will be reconciled later.`);
        effectiveType = 'SHORT_VIDEO_UPLOAD';
        amount = REWARD_AMOUNTS['SHORT_VIDEO_UPLOAD'];
      }
    }

    // 8. Anti-fraud checks
    // 8a. Duplicate view check
    if (type === "VIEW" && videoId) {
      const isUniqueView = await checkViewDedupe(adminSupabase, userId, videoId);
      if (!isUniqueView) {
        console.log(`Duplicate view detected for user ${userId} on video ${videoId}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: "Duplicate view detected. Please wait before watching again.",
            milestone: null, newTotal: 0, amount: 0, type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 8b. Comment spam check
    if (type === "COMMENT" && contentHash) {
      const isUniqueComment = await checkCommentSpam(adminSupabase, userId, contentHash);
      if (!isUniqueComment) {
        console.log(`Spam comment detected for user ${userId}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: "Duplicate comment detected. Please write a unique comment.",
            milestone: null, newTotal: 0, amount: 0, type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 8c. Server-side comment content validation (không tin client)
    if (type === "COMMENT" && videoId) {
      const { data: latestComment } = await adminSupabase
        .from("comments")
        .select("content")
        .eq("user_id", userId)
        .eq("video_id", videoId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!latestComment?.content ||
          latestComment.content.trim().length < validation.MIN_COMMENT_LENGTH) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Bình luận phải có ít nhất ${validation.MIN_COMMENT_LENGTH} ký tự`,
            milestone: null, newTotal: 0, amount: 0, type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 8d. Already rewarded check for ALL action types with videoId
    if (["LIKE", "SHARE", "VIEW", "COMMENT"].includes(type) && videoId) {
      const alreadyRewarded = await checkAlreadyRewarded(adminSupabase, userId, videoId, type);
      if (alreadyRewarded) {
        console.log(`User ${userId} already rewarded for ${type} on video ${videoId}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Bạn đã nhận thưởng ${type.toLowerCase()} cho video này rồi`,
            milestone: null, newTotal: 0, amount: 0, type
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

    // 10. Check COUNT-BASED daily limits
    const currentViewCount = limits?.view_count || 0;
    const currentLikeCount = limits?.like_count || 0;
    const currentShareCount = limits?.share_count || 0;
    const currentCommentCount = limits?.comment_count || 0;

    if (type === "VIEW") {
      if (currentViewCount >= DAILY_LIMITS.VIEW_COUNT) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Daily view reward limit reached (${DAILY_LIMITS.VIEW_COUNT} views)`,
            milestone: null, newTotal: 0, amount: 0, type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (type === "LIKE") {
      if (currentLikeCount >= DAILY_LIMITS.LIKE_COUNT) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Daily like reward limit reached (${DAILY_LIMITS.LIKE_COUNT} likes)`,
            milestone: null, newTotal: 0, amount: 0, type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (type === "SHARE") {
      if (currentShareCount >= DAILY_LIMITS.SHARE_COUNT) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Daily share reward limit reached (${DAILY_LIMITS.SHARE_COUNT} shares)`,
            milestone: null, newTotal: 0, amount: 0, type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (type === "COMMENT") {
      if (currentCommentCount >= DAILY_LIMITS.COMMENT_COUNT) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Daily comment reward limit reached (${DAILY_LIMITS.COMMENT_COUNT} comments)`,
            milestone: null, newTotal: 0, amount: 0, type
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check SHORT_VIDEO daily limit
    if (effectiveType === "SHORT_VIDEO_UPLOAD") {
      const currentShortCount = limits?.short_video_count || 0;
      if (currentShortCount >= DAILY_LIMITS.SHORT_VIDEO) {
        console.log(`Short video daily limit reached for user ${userId}: ${currentShortCount}/${DAILY_LIMITS.SHORT_VIDEO}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Đã đạt giới hạn video ngắn hàng ngày (${DAILY_LIMITS.SHORT_VIDEO} video)`,
            milestone: null, newTotal: 0, amount: 0, type: effectiveType
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check LONG_VIDEO daily limit
    if (effectiveType === "LONG_VIDEO_UPLOAD") {
      const currentLongCount = limits?.long_video_count || 0;
      if (currentLongCount >= DAILY_LIMITS.LONG_VIDEO) {
        console.log(`Long video daily limit reached for user ${userId}: ${currentLongCount}/${DAILY_LIMITS.LONG_VIDEO}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: `Đã đạt giới hạn video dài hàng ngày (${DAILY_LIMITS.LONG_VIDEO} video)`,
            milestone: null, newTotal: 0, amount: 0, type: effectiveType
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 10b. GIỚI HẠN CỨNG 500.000 CAMLY/NGÀY/NGƯỜI
    const DAILY_TOTAL_CAP = 500000;
    const totalTodayEarned =
      (limits?.view_rewards_earned || 0) +
      (limits?.like_rewards_earned || 0) +
      (limits?.share_rewards_earned || 0) +
      (limits?.comment_rewards_earned || 0) +
      (limits?.upload_rewards_earned || 0);

    if (totalTodayEarned + amount > DAILY_TOTAL_CAP) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: `Đã đạt giới hạn thưởng hàng ngày (${DAILY_TOTAL_CAP.toLocaleString()} CAMLY)`,
          milestone: null, newTotal: 0, amount: 0, type
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Trust score gating with INLINE abuse detection
    let canAutoApprove = false;
    
    try {
      // Check master toggle first
      const { data: autoApproveConfig } = await adminSupabase
        .from("reward_config")
        .select("config_value")
        .eq("config_key", "AUTO_APPROVE_ENABLED")
        .single();
      
      const isAutoApproveEnabled = autoApproveConfig?.config_value === 1;
      
      if (!isAutoApproveEnabled) {
        canAutoApprove = false;
        console.log(`AUTO_APPROVE_ENABLED=false, reward for user ${userId} requires admin approval`);
      } else {
        // Compute suspicious_score fresh (inline abuse detection)
        const autoApproveThreshold = validation.AUTO_APPROVE_THRESHOLD || 3;
        let suspiciousScore = 0;

        const { data: profileForAbuse } = await adminSupabase
          .from("profiles")
          .select("signup_ip_hash, avatar_url, avatar_verified, display_name, created_at")
          .eq("id", userId)
          .single();

        if (profileForAbuse?.signup_ip_hash) {
          const { count: sameIpCount } = await adminSupabase
            .from("ip_tracking")
            .select("user_id", { count: "exact", head: true })
            .eq("ip_hash", profileForAbuse.signup_ip_hash)
            .eq("action_type", "signup");
          
          if ((sameIpCount || 0) > 5) suspiciousScore += 3;
          else if ((sameIpCount || 0) > 2) suspiciousScore += 1;
        }

        if (!profileForAbuse?.avatar_url) suspiciousScore += 1;
        if (!profileForAbuse?.avatar_verified) suspiciousScore += 1;
        if (!profileForAbuse?.display_name || profileForAbuse.display_name.length < 3) suspiciousScore += 1;

        // Persist updated score for admin visibility
        await adminSupabase
          .from("profiles")
          .update({ suspicious_score: suspiciousScore })
          .eq("id", userId);

        canAutoApprove = suspiciousScore < autoApproveThreshold;
        
        if (!canAutoApprove) {
          console.log(`User ${userId} suspicious_score=${suspiciousScore} >= threshold=${autoApproveThreshold}, requiring admin approval`);
        }
      }
    } catch (err) {
      console.warn("Could not check auto-approve config, defaulting to pending:", err);
      canAutoApprove = false;
    }

    // 12. ATOMIC INCREMENT via RPC - prevents race conditions
    const { data: updatedProfile, error: updateError } = await adminSupabase.rpc('atomic_increment_reward', {
      p_user_id: userId,
      p_amount: amount,
      p_auto_approve: canAutoApprove
    });

    if (updateError) {
      console.error('Failed to update rewards:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update rewards' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newTotal = Number(updatedProfile?.total_camly_rewards) || 0;
    const newPending = Number(updatedProfile?.pending_rewards) || 0;
    const newApproved = Number(updatedProfile?.approved_reward) || 0;

    // 14. Create reward transaction record
    const txHash = `REWARD_${effectiveType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await adminSupabase.from("reward_transactions").insert({
      user_id: userId,
      video_id: videoId || null,
      amount: amount,
      reward_type: effectiveType,
      status: "success",
      tx_hash: txHash,
      approved: canAutoApprove,
      approved_at: canAutoApprove ? new Date().toISOString() : null,
    });

    // 15. Record reward action for LIKE/SHARE to prevent duplicates
    if (["LIKE", "SHARE", "VIEW", "COMMENT"].includes(type) && videoId) {
      await adminSupabase.from("reward_actions").upsert({
        user_id: userId,
        video_id: videoId,
        action_type: type,
      }, { onConflict: 'user_id,video_id,action_type', ignoreDuplicates: true });
    }

    // 16. Update COUNT-BASED daily limits
    const updateFields: Record<string, any> = {};
    
    if (type === "VIEW") {
      updateFields.view_count = currentViewCount + 1;
      updateFields.view_rewards_earned = (limits?.view_rewards_earned || 0) + amount;
    } else if (type === "LIKE") {
      updateFields.like_count = currentLikeCount + 1;
      updateFields.like_rewards_earned = (limits?.like_rewards_earned || 0) + amount;
    } else if (type === "SHARE") {
      updateFields.share_count = currentShareCount + 1;
      updateFields.share_rewards_earned = (limits?.share_rewards_earned || 0) + amount;
    } else if (type === "COMMENT") {
      updateFields.comment_count = currentCommentCount + 1;
      updateFields.comment_rewards_earned = (limits?.comment_rewards_earned || 0) + amount;
    } else if (effectiveType === "SHORT_VIDEO_UPLOAD") {
      updateFields.short_video_count = (limits?.short_video_count || 0) + 1;
      updateFields.uploads_count = (limits?.uploads_count || 0) + 1;
      updateFields.upload_rewards_earned = (limits?.upload_rewards_earned || 0) + amount;
    } else if (effectiveType === "LONG_VIDEO_UPLOAD") {
      updateFields.long_video_count = (limits?.long_video_count || 0) + 1;
      updateFields.uploads_count = (limits?.uploads_count || 0) + 1;
      updateFields.upload_rewards_earned = (limits?.upload_rewards_earned || 0) + amount;
    } else if (effectiveType === "UPLOAD" || effectiveType === "FIRST_UPLOAD") {
      updateFields.uploads_count = (limits?.uploads_count || 0) + 1;
      updateFields.upload_rewards_earned = (limits?.upload_rewards_earned || 0) + amount;
    }

    if (Object.keys(updateFields).length > 0) {
      await adminSupabase
        .from("daily_reward_limits")
        .update(updateFields)
        .eq("user_id", userId)
        .eq("date", today);
    }

    // 17. Check for milestones (use newTotal - amount as oldTotal approximation)
    const MILESTONES = [10, 100, 1000, 10000, 100000, 500000, 1000000];
    const oldTotal = newTotal - amount;
    const reachedMilestone = MILESTONES.find(
      milestone => oldTotal < milestone && newTotal >= milestone
    ) || null;

    console.log(`Awarded ${amount} CAMLY to user ${userId} for ${effectiveType}. New total: ${newTotal}, AutoApproved: ${canAutoApprove}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        milestone: reachedMilestone, 
        newTotal, 
        pendingRewards: newPending,
        approvedRewards: newApproved,
        autoApproved: canAutoApprove,
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
