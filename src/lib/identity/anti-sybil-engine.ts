/**
 * Anti-Sybil Engine — multi-signal scoring
 */

export interface SybilSignals {
  device_count_same_ip: number;
  wallets_same_pattern: number;
  referral_chain_anomaly: boolean;
  bot_like_velocity: boolean;
  cluster_synchronicity: number; // 0-1
  weak_social_high_reward: boolean;
  account_age_days: number;
  email_verified: boolean;
  phone_verified: boolean;
}

export interface SybilResult {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
}

export function scoreSybil(s: SybilSignals): SybilResult {
  let score = 0;
  const reasons: string[] = [];

  if (s.device_count_same_ip > 3) {
    score += Math.min(30, s.device_count_same_ip * 5);
    reasons.push(`${s.device_count_same_ip} accounts cùng IP`);
  }
  if (s.wallets_same_pattern > 2) {
    score += 15;
    reasons.push('Pattern wallet trùng lặp');
  }
  if (s.referral_chain_anomaly) {
    score += 20;
    reasons.push('Referral chain bất thường');
  }
  if (s.bot_like_velocity) {
    score += 25;
    reasons.push('Hành vi giống bot');
  }
  if (s.cluster_synchronicity > 0.7) {
    score += Math.round(s.cluster_synchronicity * 25);
    reasons.push('Hoạt động cụm đồng bộ');
  }
  if (s.weak_social_high_reward) {
    score += 15;
    reasons.push('Social yếu nhưng reward cao');
  }
  if (s.account_age_days < 7) {
    score += 10;
    reasons.push('Tài khoản mới <7 ngày');
  }
  if (!s.email_verified && !s.phone_verified) {
    score += 10;
    reasons.push('Chưa verify email/phone');
  }

  score = Math.min(100, score);
  
  let level: SybilResult['level'] = 'low';
  if (score >= 80) level = 'critical';
  else if (score >= 60) level = 'high';
  else if (score >= 30) level = 'medium';

  return { score, level, reasons };
}
