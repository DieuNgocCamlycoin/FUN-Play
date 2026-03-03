/**
 * PPLP Reason Codes — Positive Language System
 * 
 * Triết lý: Không dùng từ tiêu cực (spam, fraud, violation, punishment).
 * Mọi mã lý do đều mang tính xây dựng và hướng đến sự phát triển.
 */

// ===== POSITIVE REASON CODES (Tăng điểm) =====

export const POSITIVE_REASONS = {
  CONSISTENCY_STRONG: {
    code: 'CONSISTENCY_STRONG',
    label: 'Nhịp sống đều đặn',
    description: 'Hoạt động liên tục nhiều ngày, thể hiện cam kết lâu dài',
    emoji: '🔥',
  },
  MENTOR_CHAIN_COMPLETED: {
    code: 'MENTOR_CHAIN_COMPLETED',
    label: 'Chuỗi hướng dẫn hoàn thành',
    description: 'Đã giúp đỡ thành viên mới và họ hoàn thành hồ sơ',
    emoji: '🤝',
  },
  VALUE_LOOP_ACTIVE: {
    code: 'VALUE_LOOP_ACTIVE',
    label: 'Vòng giá trị đang hoạt động',
    description: 'Đang tham gia chuỗi trao đổi giá trị trong cộng đồng',
    emoji: '♻️',
  },
  COMMUNITY_VALIDATED: {
    code: 'COMMUNITY_VALIDATED',
    label: 'Cộng đồng xác nhận',
    description: 'Nội dung được cộng đồng đánh giá cao qua PPLP Rating',
    emoji: '✅',
  },
  CROSS_PLATFORM_CONTRIBUTOR: {
    code: 'CROSS_PLATFORM_CONTRIBUTOR',
    label: 'Đóng góp đa nền tảng',
    description: 'Hoạt động tích cực trên nhiều mô-đun của hệ sinh thái',
    emoji: '🌐',
  },
  HEALING_IMPACT_DETECTED: {
    code: 'HEALING_IMPACT_DETECTED',
    label: 'Tác động chữa lành',
    description: 'Nội dung mang giá trị chữa lành, được ghi nhận bởi hệ thống',
    emoji: '💚',
  },
  GOVERNANCE_PARTICIPATION: {
    code: 'GOVERNANCE_PARTICIPATION',
    label: 'Tham gia quản trị',
    description: 'Đóng góp vào quyết định cộng đồng và quản trị hệ sinh thái',
    emoji: '🏛️',
  },
  BUILDER_STREAK_ACTIVE: {
    code: 'BUILDER_STREAK_ACTIVE',
    label: 'Chuỗi xây dựng đang hoạt động',
    description: 'Tạo nội dung liên tục 7+ ngày, thể hiện tinh thần xây dựng',
    emoji: '🏗️',
  },
  CHARITY_CHAIN_COMPLETED: {
    code: 'CHARITY_CHAIN_COMPLETED',
    label: 'Chuỗi trao tặng hoàn thành',
    description: 'Chuỗi "pay-it-forward" — trao đi và nhận lại giá trị',
    emoji: '🎁',
  },
  CONFLICT_HARMONY_RESOLVED: {
    code: 'CONFLICT_HARMONY_RESOLVED',
    label: 'Hòa giải thành công',
    description: 'Góp phần giải quyết mâu thuẫn cộng đồng một cách hài hòa',
    emoji: '🕊️',
  },
} as const;

// ===== ADJUSTMENT REASON CODES (Điều chỉnh — không tiêu cực) =====

export const ADJUSTMENT_REASONS = {
  INTERACTION_PATTERN_UNSTABLE: {
    code: 'INTERACTION_PATTERN_UNSTABLE',
    label: 'Nhịp tương tác chưa ổn định',
    description: 'Mô hình hoạt động đang thay đổi, cần thời gian quan sát',
    emoji: '📊',
  },
  RATING_CLUSTER_REVIEW: {
    code: 'RATING_CLUSTER_REVIEW',
    label: 'Đánh giá đang được xem xét',
    description: 'Nhóm đánh giá cần xác minh tính đa dạng',
    emoji: '🔍',
  },
  CONTENT_REVIEW_IN_PROGRESS: {
    code: 'CONTENT_REVIEW_IN_PROGRESS',
    label: 'Nội dung đang được xem xét',
    description: 'Nội dung cần thêm thời gian để hệ thống đánh giá',
    emoji: '⏳',
  },
  TEMPORARY_WEIGHT_ADJUSTMENT: {
    code: 'TEMPORARY_WEIGHT_ADJUSTMENT',
    label: 'Điều chỉnh trọng số tạm thời',
    description: 'Hệ thống đang cân bằng lại trọng số hoạt động',
    emoji: '⚖️',
  },
  QUALITY_SIGNAL_LOW: {
    code: 'QUALITY_SIGNAL_LOW',
    label: 'Tín hiệu chất lượng cần cải thiện',
    description: 'Nội dung cần nâng cao giá trị để đạt điểm cao hơn',
    emoji: '📈',
  },
} as const;

// ===== ELIGIBILITY REASON CODES (Đủ/Không đủ điều kiện mint) =====

export const ELIGIBILITY_REASONS = {
  QUALIFIED: {
    code: 'qualified',
    label: 'Đủ điều kiện',
    description: 'Đáp ứng tất cả điều kiện để nhận phân bổ FUN',
    emoji: '✨',
  },
  PPLP_NOT_ACCEPTED: {
    code: 'pplp_not_accepted',
    label: 'Chưa chấp nhận PPLP',
    description: 'Cần chấp nhận giao thức PPLP để tham gia',
    emoji: '📋',
  },
  LEVEL_TOO_LOW: {
    code: 'level_too_low',
    label: 'Cấp độ chưa đủ',
    description: 'Cần đạt cấp Light Sprout trở lên',
    emoji: '🌱',
  },
  ANTI_FARM_FLAGGED: {
    code: 'anti_farm_flagged',
    label: 'Cần xem xét thêm',
    description: 'Hệ thống cần thêm thời gian xác minh hoạt động',
    emoji: '🔎',
  },
  NO_ACTIVITY_IN_EPOCH: {
    code: 'no_activity_in_epoch',
    label: 'Chưa có hoạt động trong kỳ',
    description: 'Cần tham gia hoạt động trong tháng hiện tại',
    emoji: '💤',
  },
  ANTI_WHALE_CAPPED: {
    code: 'anti_whale_capped',
    label: 'Đã đạt giới hạn phân bổ',
    description: 'Phân bổ đã được điều chỉnh để bảo vệ sự công bằng (tối đa 3%)',
    emoji: '🐋',
  },
} as const;

// ===== ALL REASON CODES =====

export const ALL_REASON_CODES = {
  ...POSITIVE_REASONS,
  ...ADJUSTMENT_REASONS,
  ...ELIGIBILITY_REASONS,
} as const;

export type ReasonCode = keyof typeof ALL_REASON_CODES;

/**
 * Get human-readable label for a reason code
 */
export function getReasonLabel(code: string): string {
  const reason = (ALL_REASON_CODES as Record<string, { label: string }>)[code];
  return reason?.label || code;
}

/**
 * Get emoji for a reason code
 */
export function getReasonEmoji(code: string): string {
  const reason = (ALL_REASON_CODES as Record<string, { emoji: string }>)[code];
  return reason?.emoji || '📌';
}
