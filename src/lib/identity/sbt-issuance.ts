/**
 * SBT Issuance — auto-issue based on rules
 */
import { supabase } from '@/integrations/supabase/client';

export type SBTCategory = 'identity' | 'trust' | 'contribution' | 'credential' | 'milestone' | 'legacy';
export type SBTStatus = 'active' | 'frozen' | 'revoked' | 'archived';

export interface SBTBadge {
  token_id: string;
  did_id: string;
  user_id: string;
  category: SBTCategory;
  sbt_type: string;
  issuer: string;
  issued_at: string;
  status: SBTStatus;
  trust_weight: number;
  privacy_level: string;
  metadata: Record<string, unknown>;
}

export interface SBTRule {
  id: string;
  category: SBTCategory;
  sbt_type: string;
  display_name: string;
  description: string | null;
  issue_mode: 'auto' | 'semi_auto' | 'governance';
  trust_weight: number;
  conditions: Record<string, unknown>;
  is_active: boolean;
}

export async function getUserSBTs(userId: string): Promise<SBTBadge[]> {
  const { data } = await supabase.from('sbt_registry')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('issued_at', { ascending: false });
  return (data as unknown as SBTBadge[]) ?? [];
}

export async function getSBTRules(): Promise<SBTRule[]> {
  const { data } = await supabase.from('sbt_issuance_rules')
    .select('*')
    .eq('is_active', true)
    .order('category');
  return (data as unknown as SBTRule[]) ?? [];
}

export const CATEGORY_LABELS: Record<SBTCategory, string> = {
  identity: 'Định danh',
  trust: 'Tin cậy',
  contribution: 'Đóng góp',
  credential: 'Chứng chỉ',
  milestone: 'Cột mốc',
  legacy: 'Di sản',
};
