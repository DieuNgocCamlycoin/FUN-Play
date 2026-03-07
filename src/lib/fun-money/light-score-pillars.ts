/**
 * Light Score 5-Pillar Extension Config
 * 
 * Extends LS-Math v1.0 with 5 sub-scores from the Whitepaper:
 * 1. Identity Score — Xác thực con người thật
 * 2. Activity Score — Đóng góp nội dung & hoạt động (maps to existing Action Base + Content)
 * 3. On-chain History Score — Lịch sử blockchain
 * 4. Wallet Transparency Score — Minh bạch ví
 * 5. Ecosystem Alignment Score — Đồng hành hệ sinh thái
 * 
 * Each pillar is scored 0-100, then weighted to produce the final Light Score.
 * This EXTENDS (not replaces) LS-Math v1.0 — the core scoring formula remains.
 */

// ===== PILLAR WEIGHTS =====

export const PILLAR_WEIGHTS_V1 = {
  identity: 0.20,
  activity: 0.20,
  onchain: 0.20,
  transparency: 0.20,
  alignment: 0.20,
} as const;

/** Phase 2 weights (more emphasis on transparency) */
export const PILLAR_WEIGHTS_V2 = {
  identity: 0.15,
  activity: 0.20,
  onchain: 0.20,
  transparency: 0.25,
  alignment: 0.20,
} as const;

export type PillarName = keyof typeof PILLAR_WEIGHTS_V1;

// ===== PILLAR DEFINITIONS =====

export interface PillarConfig {
  id: PillarName;
  label: string;
  emoji: string;
  description: string;
  maxScore: number;
  color: string; // HSL for radar chart
}

export const PILLAR_CONFIGS: Record<PillarName, PillarConfig> = {
  identity: {
    id: 'identity',
    label: 'Identity',
    emoji: '🆔',
    description: 'Xác thực con người thật — hồ sơ, email, Web3 Profile, tài khoản lâu dài',
    maxScore: 100,
    color: 'hsl(210, 80%, 60%)',
  },
  activity: {
    id: 'activity',
    label: 'Activity',
    emoji: '⚡',
    description: 'Đóng góp nội dung & hoạt động — bài viết, tương tác, tham gia cộng đồng',
    maxScore: 100,
    color: 'hsl(150, 70%, 50%)',
  },
  onchain: {
    id: 'onchain',
    label: 'On-chain',
    emoji: '⛓️',
    description: 'Lịch sử blockchain — giao dịch, tuổi ví, tương tác smart contract',
    maxScore: 100,
    color: 'hsl(280, 70%, 60%)',
  },
  transparency: {
    id: 'transparency',
    label: 'Transparency',
    emoji: '🔍',
    description: 'Minh bạch ví — pattern giao dịch tự nhiên, không spam/bot/clone',
    maxScore: 100,
    color: 'hsl(40, 90%, 55%)',
  },
  alignment: {
    id: 'alignment',
    label: 'Alignment',
    emoji: '🤝',
    description: 'Đồng hành hệ sinh thái — giữ Camly, tham gia platform, đóng góp cộng đồng',
    maxScore: 100,
    color: 'hsl(0, 70%, 60%)',
  },
};

export const PILLAR_LIST: PillarName[] = ['identity', 'activity', 'onchain', 'transparency', 'alignment'];

// ===== LEVEL DEFINITIONS (Whitepaper v1) =====

export interface LightLevel {
  id: string;
  label: string;
  emoji: string;
  minScore: number;
  maxScore: number | null; // null = no upper bound
  description: string;
  color: string; // gradient class
  nftTier: number; // 1-5 for NFT
}

export const LIGHT_LEVELS: LightLevel[] = [
  {
    id: 'light_seed',
    label: 'Light Seed',
    emoji: '🌱',
    minScore: 0,
    maxScore: 99,
    description: 'Người mới — bắt đầu hành trình ánh sáng',
    color: 'from-gray-400 to-gray-500',
    nftTier: 1,
  },
  {
    id: 'light_builder',
    label: 'Light Builder',
    emoji: '🔨',
    minScore: 100,
    maxScore: 249,
    description: 'Người xây dựng — đóng góp nội dung đều đặn',
    color: 'from-green-400 to-emerald-500',
    nftTier: 2,
  },
  {
    id: 'light_guardian',
    label: 'Light Guardian',
    emoji: '🛡️',
    minScore: 250,
    maxScore: 499,
    description: 'Người bảo vệ — thành viên cốt lõi cộng đồng',
    color: 'from-blue-400 to-indigo-500',
    nftTier: 3,
  },
  {
    id: 'light_leader',
    label: 'Light Leader',
    emoji: '👑',
    minScore: 500,
    maxScore: 799,
    description: 'Người dẫn dắt — ảnh hưởng tích cực sâu rộng',
    color: 'from-amber-400 to-orange-500',
    nftTier: 4,
  },
  {
    id: 'cosmic_contributor',
    label: 'Cosmic Contributor',
    emoji: '✨',
    minScore: 800,
    maxScore: null,
    description: 'Đóng góp xuất sắc — linh hồn của hệ sinh thái',
    color: 'from-purple-400 via-pink-500 to-amber-400',
    nftTier: 5,
  },
];

export function getLightLevel(score: number): LightLevel {
  for (let i = LIGHT_LEVELS.length - 1; i >= 0; i--) {
    if (score >= LIGHT_LEVELS[i].minScore) {
      return LIGHT_LEVELS[i];
    }
  }
  return LIGHT_LEVELS[0];
}

// ===== RISK PENALTY TIERS =====

export const RISK_PENALTY_TIERS = {
  light: { min: 5, max: 15, label: 'Nhẹ' },
  medium: { min: 15, max: 35, label: 'Trung bình' },
  heavy: { min: 35, max: 80, label: 'Mạnh' },
} as const;

// ===== TIME DECAY CONFIG =====

export const TIME_DECAY_CONFIG = {
  inactivity_30d: { type: 'activity', reduction: 0.10, label: 'Giảm nhẹ Activity Score' },
  inactivity_60d: { type: 'alignment', reduction: 0.20, label: 'Giảm thêm Alignment Score' },
  inactivity_90d: { type: 'priority', reduction: 0.30, label: 'Giảm cấp độ ưu tiên thưởng' },
  inactivity_180d: { type: 'dormant', reduction: 0.50, label: 'Chuyển sang trạng thái ngủ' },
} as const;

// ===== STREAK BONUS CONFIG =====

export const STREAK_BONUS = {
  7: 0.02,   // +2%
  30: 0.05,  // +5%
  90: 0.10,  // +10%
} as const;

// ===== BADGE DEFINITIONS (Phase 2) =====

export interface BadgeDefinition {
  id: string;
  label: string;
  emoji: string;
  description: string;
  condition: string;
}

export const REPUTATION_BADGES: BadgeDefinition[] = [
  { id: 'community_builder', label: 'Community Builder', emoji: '🏗️', description: 'Đóng góp xây dựng cộng đồng', condition: 'Activity Score >= 70 & streak >= 30' },
  { id: 'transparent_wallet', label: 'Transparent Wallet', emoji: '💎', description: 'Ví minh bạch, không gian lận', condition: 'Transparency Score >= 80' },
  { id: 'long_term_holder', label: 'Long-term Holder', emoji: '⏳', description: 'Giữ token dài hạn', condition: 'Alignment Score >= 70 & wallet age >= 6 months' },
  { id: 'pure_contributor', label: 'Pure Contributor', emoji: '🌟', description: 'Đóng góp thuần túy, không spam', condition: 'All pillars >= 60 & risk < 0.1' },
  { id: 'early_supporter', label: 'Early Supporter', emoji: '🚀', description: 'Gia nhập sớm và đồng hành', condition: 'Account age >= 1 year & Alignment >= 60' },
];
