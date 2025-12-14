import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

// Reward amounts
export const REWARD_AMOUNTS = {
  VIEW: 500, // 5,000 CAMLY per 10 valid views = 500 per view
  LIKE: 500,
  COMMENT: 5000,
  SHARE: 2000,
  UPLOAD: 50000,
};

// Daily limits
export const DAILY_LIMITS = {
  VIEW_REWARDS: 50000,
  COMMENT_REWARDS: 25000,
  UPLOAD_COUNT: 10,
};

// Valid view requirements
export const VIEW_REQUIREMENTS = {
  MIN_WATCH_SECONDS: 30,
  MIN_WATCH_PERCENTAGE: 30,
};

export const MILESTONES = [10, 100, 1000, 10000, 100000];

const playCelebrationSound = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3");
  audio.volume = 0.5;
  audio.play().catch(() => console.log("Sound play failed"));
};

const triggerConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#00E7FF', '#7A2BFF', '#FF00E5', '#FFD700'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#00E7FF', '#7A2BFF', '#FF00E5', '#FFD700'],
    });
  }, 250);
};

const checkMilestone = (oldTotal: number, newTotal: number) => {
  const reachedMilestone = MILESTONES.find(
    milestone => oldTotal < milestone && newTotal >= milestone
  );
  
  if (reachedMilestone) {
    triggerConfetti();
    playCelebrationSound();
    return reachedMilestone;
  }
  return null;
};

// Get or create daily reward limits for user
const getDailyLimits = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("daily_reward_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (error && error.code === 'PGRST116') {
    // No record exists, create one
    const { data: newData, error: insertError } = await supabase
      .from("daily_reward_limits")
      .insert({ user_id: userId, date: today })
      .select()
      .single();
    
    if (insertError) throw insertError;
    return newData;
  }
  
  if (error) throw error;
  return data;
};

// Update daily limits
const updateDailyLimits = async (
  userId: string, 
  field: 'view_rewards_earned' | 'comment_rewards_earned' | 'upload_rewards_earned' | 'uploads_count',
  increment: number
) => {
  const today = new Date().toISOString().split('T')[0];
  const limits = await getDailyLimits(userId);
  
  const newValue = (Number(limits[field]) || 0) + increment;
  
  await supabase
    .from("daily_reward_limits")
    .update({ [field]: newValue })
    .eq("user_id", userId)
    .eq("date", today);
};

// Check if view is valid
export const isValidView = (watchTimeSeconds: number, videoDurationSeconds: number): boolean => {
  const watchPercentage = (watchTimeSeconds / videoDurationSeconds) * 100;
  return watchTimeSeconds >= VIEW_REQUIREMENTS.MIN_WATCH_SECONDS || 
         watchPercentage >= VIEW_REQUIREMENTS.MIN_WATCH_PERCENTAGE;
};

// Log a view and check if it should be rewarded
export const logView = async (
  userId: string,
  videoId: string,
  watchTimeSeconds: number,
  videoDurationSeconds: number,
  sessionId?: string
): Promise<{ isValid: boolean; shouldReward: boolean }> => {
  const isValid = isValidView(watchTimeSeconds, videoDurationSeconds);
  const watchPercentage = Math.round((watchTimeSeconds / videoDurationSeconds) * 100);

  // Insert view log
  await supabase.from("view_logs").insert({
    user_id: userId,
    video_id: videoId,
    watch_time_seconds: watchTimeSeconds,
    video_duration_seconds: videoDurationSeconds,
    watch_percentage: watchPercentage,
    is_valid: isValid,
    session_id: sessionId,
  });

  if (!isValid) return { isValid: false, shouldReward: false };

  // Count valid views for this user on this video today
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from("view_logs")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .eq("is_valid", true)
    .gte("created_at", today);

  // Check if this is the 10th valid view (reward every 10 views)
  const shouldReward = (count || 0) % 10 === 0 && (count || 0) > 0;

  return { isValid, shouldReward };
};

// Award CAMLY via secure server-side edge function
export const awardCAMLY = async (
  userId: string,
  amount: number,
  type: "VIEW" | "LIKE" | "COMMENT" | "SHARE" | "UPLOAD",
  videoId?: string
): Promise<{ 
  success: boolean; 
  milestone: number | null; 
  newTotal: number; 
  amount: number; 
  type: string;
  reason?: string;
}> => {
  try {
    // Call secure edge function instead of client-side logic
    const { data, error } = await supabase.functions.invoke('award-camly', {
      body: { type, videoId }
    });

    if (error) {
      console.error("Edge function error:", error);
      return { success: false, milestone: null, newTotal: 0, amount: 0, type };
    }

    // Trigger celebration effects on client if milestone reached
    if (data?.milestone) {
      triggerConfetti();
      playCelebrationSound();
    }

    return {
      success: data?.success ?? false,
      milestone: data?.milestone ?? null,
      newTotal: data?.newTotal ?? 0,
      amount: data?.amount ?? 0,
      type: data?.type ?? type,
      reason: data?.reason
    };
  } catch (error) {
    console.error("Error awarding CAMLY:", error);
    return { success: false, milestone: null, newTotal: 0, amount: 0, type };
  }
};

// Check if comment is valid (min 5 characters)
export const isValidComment = (content: string): boolean => {
  return content.trim().length >= 5;
};

// Check comment reward eligibility (max 5 per user per content per day)
export const canRewardComment = async (userId: string, videoId: string): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { count } = await supabase
    .from("comment_logs")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .eq("is_rewarded", true)
    .gte("created_at", today);

  return (count || 0) < 5;
};

// Log and reward comment
export const logAndRewardComment = async (
  userId: string,
  videoId: string,
  commentId: string,
  content: string
): Promise<{ rewarded: boolean; amount: number; reason?: string }> => {
  const isValid = isValidComment(content);
  
  if (!isValid) {
    await supabase.from("comment_logs").insert({
      user_id: userId,
      video_id: videoId,
      comment_id: commentId,
      is_valid: false,
      is_rewarded: false,
    });
    return { rewarded: false, amount: 0, reason: "Comment must be at least 5 characters" };
  }

  const canReward = await canRewardComment(userId, videoId);
  
  if (!canReward) {
    await supabase.from("comment_logs").insert({
      user_id: userId,
      video_id: videoId,
      comment_id: commentId,
      is_valid: true,
      is_rewarded: false,
    });
    return { rewarded: false, amount: 0, reason: "Max 5 rewarded comments per video per day" };
  }

  await supabase.from("comment_logs").insert({
    user_id: userId,
    video_id: videoId,
    comment_id: commentId,
    is_valid: true,
    is_rewarded: true,
  });

  const result = await awardCAMLY(userId, REWARD_AMOUNTS.COMMENT, "COMMENT", videoId);
  return { rewarded: result.success, amount: result.amount, reason: result.reason };
};

// Award upload reward
export const awardUploadReward = async (userId: string, videoId: string) => {
  return awardCAMLY(userId, REWARD_AMOUNTS.UPLOAD, "UPLOAD", videoId);
};

// Award view reward (called when user reaches 10 valid views)
export const awardViewReward = async (userId: string, videoId: string) => {
  return awardCAMLY(userId, REWARD_AMOUNTS.VIEW * 10, "VIEW", videoId); // 5,000 CAMLY for 10 views
};

// Award like reward
export const awardLikeReward = async (userId: string, videoId: string) => {
  return awardCAMLY(userId, REWARD_AMOUNTS.LIKE, "LIKE", videoId);
};

// Award share reward
export const awardShareReward = async (userId: string, videoId: string) => {
  return awardCAMLY(userId, REWARD_AMOUNTS.SHARE, "SHARE", videoId);
};
