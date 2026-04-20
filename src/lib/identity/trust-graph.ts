/**
 * Trust Graph helpers — vouch / unvouch / get stats
 */
import { supabase } from '@/integrations/supabase/client';

export interface TrustEdge {
  id: string;
  from_user_id: string;
  to_user_id: string;
  weight: number;
  reason: string | null;
  created_at: string;
}

export interface TrustGraphVoucher {
  user_id: string;
  weight: number;
  reason: string | null;
  created_at: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  voucher_tc: number;
}

export interface TrustGraphStats {
  incoming_count: number;
  outgoing_count: number;
  avg_incoming_weight: number;
  top_vouchers: TrustGraphVoucher[];
}

export async function getTrustGraphStats(userId: string): Promise<TrustGraphStats> {
  const { data, error } = await (supabase as any).rpc('get_trust_graph_stats', { p_user_id: userId });
  if (error) throw error;
  return (data as TrustGraphStats) ?? { incoming_count: 0, outgoing_count: 0, avg_incoming_weight: 0, top_vouchers: [] };
}

export async function vouchForUser(toUserId: string, weight = 0.7, reason?: string): Promise<TrustEdge> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (user.id === toUserId) throw new Error('Cannot vouch for yourself');

  const { data, error } = await (supabase as any)
    .from('trust_edges')
    .upsert({
      from_user_id: user.id,
      to_user_id: toUserId,
      weight: Math.max(0, Math.min(1, weight)),
      reason: reason ?? null,
    }, { onConflict: 'from_user_id,to_user_id' })
    .select()
    .single();
  if (error) throw error;
  return data as TrustEdge;
}

export async function unvouchUser(toUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await (supabase as any)
    .from('trust_edges')
    .delete()
    .eq('from_user_id', user.id)
    .eq('to_user_id', toUserId);
  if (error) throw error;
}

export async function hasVouchedFor(toUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await (supabase as any)
    .from('trust_edges')
    .select('id')
    .eq('from_user_id', user.id)
    .eq('to_user_id', toUserId)
    .maybeSingle();
  return !!data;
}
