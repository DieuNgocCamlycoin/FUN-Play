import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

export const REWARD_AMOUNTS = {
  VIEW: 0.1,
  LIKE: 0.5,
  COMMENT: 1.0,
  SHARE: 2.0,
};

export const MILESTONES = [10, 100, 1000, 10000];

const playCelebrationSound = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3");
  audio.volume = 0.5;
  audio.play().catch(() => console.log("Sound play failed"));
};

const triggerConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

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

export const awardCAMLY = async (
  userId: string,
  amount: number,
  type: "VIEW" | "LIKE" | "COMMENT" | "SHARE",
  videoId?: string,
  showNotification: boolean = true
): Promise<{ milestone: number | null; newTotal: number; amount: number; type: string }> => {
  try {
    // Get current total rewards
    const { data: profileData } = await supabase
      .from("profiles")
      .select("total_camly_rewards")
      .eq("id", userId)
      .single();

    const oldTotal = profileData?.total_camly_rewards || 0;
    const newTotal = oldTotal + amount;

    // Update total_camly_rewards (accumulate forever)
    await supabase
      .from("profiles")
      .update({ total_camly_rewards: newTotal })
      .eq("id", userId);

    // Create wallet transaction record
    await supabase.from("wallet_transactions").insert({
      from_user_id: null, // System reward
      to_user_id: userId,
      from_address: "SYSTEM_REWARD",
      to_address: "USER_WALLET",
      amount: amount,
      token_type: "CAMLY",
      tx_hash: `REWARD_${type}_${Date.now()}`,
      status: "success",
      video_id: videoId || null,
    });

    // Check for milestone achievement
    const milestone = checkMilestone(oldTotal, newTotal);

    return { milestone, newTotal, amount, type };
  } catch (error) {
    console.error("Error awarding CAMLY:", error);
    return { milestone: null, newTotal: 0, amount: 0, type };
  }
};

// Track view rewards to prevent duplicate rewards for the same video
const viewRewardedVideos = new Set<string>();

export const awardViewReward = async (userId: string, videoId: string) => {
  const key = `${userId}_${videoId}`;
  if (viewRewardedVideos.has(key)) return;
  
  viewRewardedVideos.add(key);
  return awardCAMLY(userId, REWARD_AMOUNTS.VIEW, "VIEW", videoId);
};

export const awardLikeReward = async (userId: string, videoId: string) => {
  return awardCAMLY(userId, REWARD_AMOUNTS.LIKE, "LIKE", videoId);
};

export const awardCommentReward = async (userId: string, videoId: string) => {
  return awardCAMLY(userId, REWARD_AMOUNTS.COMMENT, "COMMENT", videoId);
};

export const awardShareReward = async (userId: string, videoId: string) => {
  return awardCAMLY(userId, REWARD_AMOUNTS.SHARE, "SHARE", videoId);
};
