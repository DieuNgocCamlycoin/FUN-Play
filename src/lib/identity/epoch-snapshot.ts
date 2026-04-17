/**
 * Epoch Snapshot — snapshot identity+trust state per epoch
 */
import { supabase } from '@/integrations/supabase/client';

export function currentEpochId(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getUserEpochSnapshot(userId: string, epochId?: string) {
  const epoch = epochId ?? currentEpochId();
  const { data } = await supabase.from('identity_epoch_snapshot')
    .select('*')
    .eq('user_id', userId)
    .eq('epoch_id', epoch)
    .maybeSingle();
  return data;
}
