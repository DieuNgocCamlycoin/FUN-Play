/**
 * DID Registry helpers — client side
 */
import { supabase } from '@/integrations/supabase/client';

export type DIDLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
export type DIDEntityType = 'human' | 'organization' | 'ai_agent' | 'validator' | 'merchant';
export type DIDStatus = 'pending' | 'basic' | 'verified' | 'trusted' | 'restricted' | 'suspended';

export const DID_LEVEL_LABELS: Record<DIDLevel, string> = {
  L0: 'Anonymous',
  L1: 'Basic',
  L2: 'Verified',
  L3: 'Trusted',
  L4: 'Core',
};

export const DID_LEVEL_DESCRIPTIONS: Record<DIDLevel, string> = {
  L0: 'Wallet hoặc khách',
  L1: 'Email / phone / profile',
  L2: 'Verified - xác minh mạnh',
  L3: 'SBT + lịch sử sạch + hoạt động thật',
  L4: 'Core contributor / curator / validator',
};

export interface DIDRecord {
  did_id: string;
  user_id: string;
  entity_type: DIDEntityType;
  level: DIDLevel;
  status: DIDStatus;
  metadata: Record<string, unknown>;
  anchor_hash: string | null;
  created_at: string;
  updated_at: string;
}

export async function getOrCreateDID(userId: string): Promise<DIDRecord | null> {
  const { data: existing } = await supabase.from('did_registry')
    .select('*').eq('user_id', userId).maybeSingle();
  
  if (existing) return existing as unknown as DIDRecord;
  
  const { data: created, error } = await supabase.from('did_registry')
    .insert({ user_id: userId, level: 'L0', status: 'pending', entity_type: 'human' })
    .select().single();
  
  if (error) {
    console.error('[did-registry] create failed:', error);
    return null;
  }
  return created as unknown as DIDRecord;
}

export async function getDID(userId: string): Promise<DIDRecord | null> {
  const { data } = await supabase.from('did_registry')
    .select('*').eq('user_id', userId).maybeSingle();
  return (data as unknown as DIDRecord) ?? null;
}
