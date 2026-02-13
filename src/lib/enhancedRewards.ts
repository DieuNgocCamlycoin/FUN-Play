import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

// Reward amounts (matching edge function defaults)
export const REWARD_AMOUNTS = {
  VIEW: 10000,
  LIKE: 5000,
  COMMENT: 5000,
  SHARE: 5000,
  SHORT_VIDEO_UPLOAD: 20000,
  LONG_VIDEO_UPLOAD: 70000,
  UPLOAD: 100000, // Legacy
  FIRST_UPLOAD: 500000,
  SIGNUP: 50000,
  WALLET_CONNECT: 50000,
};

// Daily limits (count-based)
export const DAILY_LIMITS = {
  VIEW_COUNT: 10,
  LIKE_COUNT: 20,
  SHARE_COUNT: 10,
  COMMENT_COUNT: 10,
  SHORT_VIDEO: 5,
  LONG_VIDEO: 3,
  UPLOAD_COUNT: 10,
};

// Validation requirements
export const VALIDATION = {
  MIN_COMMENT_LENGTH: 20,
  MIN_WATCH_PERCENTAGE: 30,
  MIN_VIEWS_FOR_UPLOAD_REWARD: 3,
  SHORT_VIDEO_MAX_DURATION: 180, // 3 minutes in seconds
  AUTO_APPROVE_THRESHOLD: 3, // suspicious_score < 3 = auto-approve
};

// Claim limits
export const CLAIM_LIMITS = {
  MIN_CLAIM_AMOUNT: 200000,
  DAILY_CLAIM_LIMIT: 500000,
};

export const MILESTONES = [10, 100, 1000, 10000, 100000, 500000, 1000000];

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

export const checkMilestone = (oldTotal: number, newTotal: number) => {
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

// Helper to determine video type based on duration
export const getVideoType = (durationSeconds: number): 'SHORT' | 'LONG' => {
  return durationSeconds < VALIDATION.SHORT_VIDEO_MAX_DURATION ? 'SHORT' : 'LONG';
};

// Helper to get upload reward amount based on video duration
export const getUploadRewardAmount = (durationSeconds: number): number => {
  return getVideoType(durationSeconds) === 'SHORT' 
    ? REWARD_AMOUNTS.SHORT_VIDEO_UPLOAD 
    : REWARD_AMOUNTS.LONG_VIDEO_UPLOAD;
};

// Check if view is valid
export const isValidView = (watchTimeSeconds: number, videoDurationSeconds: number): boolean => {
  const watchPercentage = (watchTimeSeconds / videoDurationSeconds) * 100;
  return watchPercentage >= VALIDATION.MIN_WATCH_PERCENTAGE;
};

// Check if comment is valid
export const isValidComment = (content: string): boolean => {
  return content.trim().length >= VALIDATION.MIN_COMMENT_LENGTH;
};

// Check if amount is claimable
export const isClaimable = (amount: number): boolean => {
  return amount >= CLAIM_LIMITS.MIN_CLAIM_AMOUNT;
};

// Award CAMLY via secure server-side edge function
export const awardCAMLY = async (
  userId: string,
  amount: number,
  type: "VIEW" | "LIKE" | "COMMENT" | "SHARE" | "UPLOAD" | "SHORT_VIDEO_UPLOAD" | "LONG_VIDEO_UPLOAD",
  videoId?: string
): Promise<{ 
  success: boolean; 
  milestone: number | null; 
  newTotal: number; 
  amount: number; 
  type: string;
  reason?: string;
  autoApproved?: boolean;
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
      reason: data?.reason,
      autoApproved: data?.autoApproved
    };
  } catch (error) {
    console.error("Error awarding CAMLY:", error);
    return { success: false, milestone: null, newTotal: 0, amount: 0, type };
  }
};

// Check upload reward eligibility
export const checkUploadRewardEligibility = async (videoId: string): Promise<{
  eligible: boolean;
  reason?: string;
  viewCount?: number;
  minViews?: number;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-upload-reward', {
      body: { videoId }
    });

    if (error) {
      return { eligible: false, reason: error.message };
    }

    if (data?.success) {
      return { eligible: true };
    }

    return {
      eligible: false,
      reason: data?.reason,
      viewCount: data?.viewCount,
      minViews: data?.minViews
    };
  } catch (error) {
    console.error("Error checking upload reward:", error);
    return { eligible: false, reason: 'Unknown error' };
  }
};

// Get daily reward status
export const getDailyRewardStatus = async (userId: string): Promise<{
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  shortVideoCount: number;
  longVideoCount: number;
  limits: typeof DAILY_LIMITS;
}> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data } = await supabase
    .from("daily_reward_limits")
    .select("view_count, like_count, share_count, comment_count, short_video_count, long_video_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  return {
    viewCount: data?.view_count || 0,
    likeCount: data?.like_count || 0,
    shareCount: data?.share_count || 0,
    commentCount: data?.comment_count || 0,
    shortVideoCount: data?.short_video_count || 0,
    longVideoCount: data?.long_video_count || 0,
    limits: DAILY_LIMITS
  };
};
