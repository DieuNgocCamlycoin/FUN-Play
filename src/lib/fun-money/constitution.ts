/**
 * FUN Money Constitution v2.0
 * Unified Charter for AI Agent & Smart Contract
 * Law of Light Economy – Executable Soul
 */

// ===== VERSION =====
export const CONSTITUTION_VERSION_V2 = 'v2.0';

// ===== CHƯƠNG II: ĐỊNH DANH CỐT LÕI =====
export const CORE_IDENTITY = {
  notInvestmentAsset: 'FUN Money không phải tài sản đầu tư',
  notOwnershipOrPower: 'FUN Money không đại diện sở hữu, địa vị hay quyền lực',
  isLightFlow: 'FUN Money là dòng chảy giá trị gắn với hành vi Ánh Sáng',
  valueInFlow: 'Giá trị của FUN Money nằm ở sự luân chuyển, không nằm ở số dư',
} as const;

// ===== CHƯƠNG III: PPLP v2 — 5 ĐIỀU KIỆN BẮT BUỘC =====
export interface PPLPValidation {
  /** Có hành vi thực (không chỉ ý định) */
  hasRealAction: boolean;
  /** Tạo ra giá trị thật (đo được / quan sát được) */
  hasRealValue: boolean;
  /** Có tác động tích cực đến con người / cộng đồng / hệ sinh thái / Trái Đất */
  hasPositiveImpact: boolean;
  /** Không phát hiện hành vi khai thác / thao túng / khuếch đại Ego */
  noExploitation: boolean;
  /** Phù hợp với Master Charter FUN Ecosystem */
  charterCompliant: boolean;
}

export const PPLP_REQUIREMENTS = [
  'hasRealAction',
  'hasRealValue',
  'hasPositiveImpact',
  'noExploitation',
  'charterCompliant',
] as const;

/**
 * Xác thực PPLP v2.0 — TẤT CẢ 5 điều kiện phải đúng
 * Nếu thiếu bất kỳ điều kiện nào → FUN Money không được sinh / kích hoạt / giữ
 */
export function validatePPLP(validation: PPLPValidation): { valid: boolean; failedConditions: string[] } {
  const failed: string[] = [];
  if (!validation.hasRealAction) failed.push('hasRealAction');
  if (!validation.hasRealValue) failed.push('hasRealValue');
  if (!validation.hasPositiveImpact) failed.push('hasPositiveImpact');
  if (!validation.noExploitation) failed.push('noExploitation');
  if (!validation.charterCompliant) failed.push('charterCompliant');
  return { valid: failed.length === 0, failedConditions: failed };
}

// ===== CHƯƠNG IV: 4 TRẠNG THÁI VÒNG ĐỜI =====
/**
 * FUN Money không burn – không tiêu hủy.
 * Mọi FUN chỉ đổi trạng thái và nơi cư trú.
 */
export type FunMoneyState = 'LOCKED' | 'ACTIVATED' | 'FLOWING' | 'RECYCLE';

export const TOKEN_LIFECYCLE = {
  LOCKED: 'Chưa đủ điều kiện',
  ACTIVATED: 'Được phép sử dụng',
  FLOWING: 'Đang luân chuyển đúng Luật',
  RECYCLE: 'Quay về Pool để tái phân phối',
} as const;

// ===== CHƯƠNG VI: POOL KHÔNG TỒN TẠI =====
export const FORBIDDEN_POOLS = ['Team Pool', 'Investor Pool'] as const;

// ===== CHƯƠNG VII: VAI TRÒ AI AGENT =====
export const AI_AGENT_ROLE = {
  title: 'Guardian of Flow – Người Gác Dòng Chảy',
  permissions: [
    'Quan sát hành vi',
    'Xác thực PPLP',
    'Cho phép luân chuyển',
    'Thu hồi khi lệch Luật',
  ],
  restrictions: [
    'Không có cảm xúc',
    'Không có lợi ích',
    'Không có quyền lực cá nhân',
  ],
  uncertaintyRules: [
    'Chọn ít FUN hơn',
    'Chọn quay về Pool',
    'Chọn Luật thay vì mở rộng',
  ],
} as const;

// ===== CHƯƠNG VIII: VAI TRÒ GUARDIAN CON NGƯỜI =====
export const GUARDIAN_RULES = {
  guardian: 'Bé Ly (CamLy Duong)',
  role: 'Guardian, không phải chủ sở hữu',
  restrictions: [
    'Không hưởng lợi cá nhân',
  ],
} as const;
