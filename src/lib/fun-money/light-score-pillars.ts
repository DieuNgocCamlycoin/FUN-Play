/**
 * Light Score 5-Pillar Config — CTO Diagram v13Apr2026
 * 
 * 5 PILLARS (IMMUTABLE):
 * 1. Serving Life — Phụng sự sự sống
 * 2. Transparent Truth — Chân thật minh bạch
 * 3. Healing & Love — Chữa lành & Yêu thương
 * 4. Long-term Value — Giá trị dài hạn
 * 5. Unity over Separation — Đoàn kết vượt chia rẽ
 * 
 * FORMULA: FinalScore = (S × T × L × V × U) / 10⁴
 * Scale: 0–10 each pillar
 * Zero-kill rule: Any pillar = 0 → Score = 0
 */

// ===== PILLAR NAMES (CTO Diagram fixed) =====

export type PillarName = 'serving' | 'truth' | 'love' | 'value' | 'unity';

export const PILLAR_LIST: PillarName[] = ['serving', 'truth', 'love', 'value', 'unity'];

// ===== PILLAR DEFINITIONS =====

export interface PillarConfig {
  id: PillarName;
  label: string;
  labelVi: string;
  emoji: string;
  description: string;
  maxScore: number;
  color: string;
}

export const PILLAR_CONFIGS: Record<PillarName, PillarConfig> = {
  serving: {
    id: 'serving',
    label: 'Serving Life',
    labelVi: 'Phụng sự',
    emoji: '🙏',
    description: 'Phụng sự sự sống — hành động vì lợi ích cộng đồng, giúp đỡ người khác',
    maxScore: 10,
    color: 'hsl(210, 80%, 60%)',
  },
  truth: {
    id: 'truth',
    label: 'Transparent Truth',
    labelVi: 'Chân thật',
    emoji: '💎',
    description: 'Chân thật minh bạch — nội dung thật, không spam, không gian lận',
    maxScore: 10,
    color: 'hsl(150, 70%, 50%)',
  },
  love: {
    id: 'love',
    label: 'Healing & Love',
    labelVi: 'Chữa lành',
    emoji: '💗',
    description: 'Chữa lành & Yêu thương — lan tỏa năng lượng tích cực, hỗ trợ chữa lành',
    maxScore: 10,
    color: 'hsl(340, 70%, 60%)',
  },
  value: {
    id: 'value',
    label: 'Long-term Value',
    labelVi: 'Giá trị',
    emoji: '🌟',
    description: 'Giá trị dài hạn — đóng góp bền vững, xây dựng hệ sinh thái',
    maxScore: 10,
    color: 'hsl(40, 90%, 55%)',
  },
  unity: {
    id: 'unity',
    label: 'Unity',
    labelVi: 'Đoàn kết',
    emoji: '🤝',
    description: 'Đoàn kết vượt chia rẽ — hợp tác, cầu nối, giải quyết xung đột',
    maxScore: 10,
    color: 'hsl(280, 70%, 60%)',
  },
};

// ===== LEVEL DEFINITIONS =====

export interface LightLevel {
  id: string;
  label: string;
  emoji: string;
  minScore: number;
  maxScore: number | null;
  description: string;
  color: string;
  nftTier: number;
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

// ===== STREAK BONUS CONFIG =====

export const STREAK_BONUS = {
  7: 0.02,
  30: 0.05,
  90: 0.10,
} as const;

// ===== ACTION GROUPS (CTO Diagram — 5 Fixed) =====

export type ActionGroup = 'inner_work' | 'channeling' | 'giving' | 'social_impact' | 'service';

export interface ActionGroupConfig {
  id: ActionGroup;
  label: string;
  labelVi: string;
  emoji: string;
  description: string;
  /** Maps old action types to this group */
  actionTypes: string[];
}

export const ACTION_GROUPS: Record<ActionGroup, ActionGroupConfig> = {
  inner_work: {
    id: 'inner_work',
    label: 'Inner Work',
    labelVi: 'Tu tập nội tâm',
    emoji: '🧘',
    description: 'Thiền định, chiêm nghiệm, phát triển bản thân',
    actionTypes: ['WATCH_VIDEO', 'LEARN_COMPLETE'],
  },
  channeling: {
    id: 'channeling',
    label: 'Channeling',
    labelVi: 'Truyền tải',
    emoji: '📡',
    description: 'Sáng tạo nội dung, học tập, chia sẻ kiến thức',
    actionTypes: ['CONTENT_CREATE', 'UPLOAD_VIDEO', 'CREATE_POST', 'PROJECT_SUBMIT', 'MODEL_IMPROVEMENT'],
  },
  giving: {
    id: 'giving',
    label: 'Giving',
    labelVi: 'Cho đi',
    emoji: '🎁',
    description: 'Quyên góp, trao thưởng, chia sẻ tài nguyên',
    actionTypes: ['DONATE', 'VOLUNTEER', 'CAMPAIGN_DELIVERY_PROOF'],
  },
  social_impact: {
    id: 'social_impact',
    label: 'Social Impact',
    labelVi: 'Tác động xã hội',
    emoji: '🌍',
    description: 'Giúp đỡ cộng đồng, cố vấn, hướng dẫn',
    actionTypes: ['MENTOR_HELP', 'COMMUNITY_BUILD', 'COMMUNITY_ACTION', 'SOCIAL_IMPACT', 'TREE_PLANT', 'CLEANUP_EVENT'],
  },
  service: {
    id: 'service',
    label: 'Service',
    labelVi: 'Phụng sự nền tảng',
    emoji: '⚙️',
    description: 'Đóng góp nền tảng, quản trị, kiểm duyệt',
    actionTypes: ['CONTENT_REVIEW', 'PEER_REVIEW', 'FRAUD_REPORT_VALID', 'MODERATION_HELP', 'AI_REVIEW_HELPFUL', 'IMPACT_REPORT', 'SUSTAINABILITY_REPORT'],
  },
};

/** Map an action type to its ActionGroup */
export function getActionGroup(actionType: string): ActionGroup {
  for (const [groupId, group] of Object.entries(ACTION_GROUPS)) {
    if (group.actionTypes.includes(actionType)) {
      return groupId as ActionGroup;
    }
  }
  return 'service'; // Default fallback
}

// ===== BADGE DEFINITIONS (Phase 2) =====

export interface BadgeDefinition {
  id: string;
  label: string;
  emoji: string;
  description: string;
  condition: string;
}

export const REPUTATION_BADGES: BadgeDefinition[] = [
  { id: 'community_builder', label: 'Community Builder', emoji: '🏗️', description: 'Đóng góp xây dựng cộng đồng', condition: 'Serving >= 7 & streak >= 30' },
  { id: 'transparent_wallet', label: 'Transparent Truth', emoji: '💎', description: 'Luôn chân thật, minh bạch', condition: 'Truth >= 8' },
  { id: 'long_term_holder', label: 'Long-term Holder', emoji: '⏳', description: 'Giữ token dài hạn', condition: 'Value >= 7 & wallet age >= 6 months' },
  { id: 'pure_contributor', label: 'Pure Contributor', emoji: '🌟', description: 'Đóng góp thuần túy, không spam', condition: 'All pillars >= 6 & risk < 0.1' },
  { id: 'early_supporter', label: 'Early Supporter', emoji: '🚀', description: 'Gia nhập sớm và đồng hành', condition: 'Account age >= 1 year & Unity >= 6' },
];
