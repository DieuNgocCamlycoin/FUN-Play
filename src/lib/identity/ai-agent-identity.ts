/**
 * AI Agent Identity helpers.
 * Mỗi AI agent là 1 DID entity_type='ai_agent', bắt buộc có 1 human operator.
 * Attestation từ AI bị cap weight ≤ 0.05 (trigger DB enforce).
 */
import { supabase } from '@/integrations/supabase/client';

export type ResponsibilityLevel = 'standard' | 'elevated' | 'critical';

export interface AIAgent {
  agent_did_id: string;
  agent_name: string;
  operator_user_id: string;
  responsibility_level: ResponsibilityLevel;
  attestation_weight_cap: number;
  is_active: boolean;
}

export async function registerAIAgent(params: {
  agent_name: string;
  agent_purpose?: string;
  operator_user_id: string;
  responsibility_level?: ResponsibilityLevel;
}): Promise<{ agent_did_id: string } | null> {
  // 1. Create DID with entity_type='ai_agent'
  const { data: did, error: didErr } = await supabase
    .from('did_registry')
    .insert({
      user_id: params.operator_user_id,
      entity_type: 'ai_agent',
      level: 'L1',
      status: 'basic',
      operator_user_id: params.operator_user_id,
      metadata: { agent_name: params.agent_name, purpose: params.agent_purpose ?? null },
    })
    .select('did_id')
    .single();
  if (didErr || !did) {
    console.error('[ai-agent] DID create failed', didErr);
    return null;
  }

  // 2. Bind operator
  const { error: opErr } = await supabase.from('ai_operators').insert({
    agent_did_id: did.did_id,
    operator_user_id: params.operator_user_id,
    agent_name: params.agent_name,
    agent_purpose: params.agent_purpose,
    responsibility_level: params.responsibility_level ?? 'standard',
  });
  if (opErr) {
    console.error('[ai-agent] operator binding failed', opErr);
    return null;
  }

  return { agent_did_id: did.did_id };
}

export async function listMyAgents(operator_user_id: string): Promise<AIAgent[]> {
  const { data } = await supabase
    .from('ai_operators')
    .select('*')
    .eq('operator_user_id', operator_user_id)
    .eq('is_active', true);
  return (data ?? []) as AIAgent[];
}

export async function logAgentEvent(params: {
  agent_did_id: string;
  operator_user_id: string;
  event_type: string;
  payload?: Record<string, unknown>;
}) {
  return supabase.from('identity_events').insert({
    user_id: params.operator_user_id,
    did_id: params.agent_did_id,
    agent_did_id: params.agent_did_id,
    event_type: params.event_type,
    ai_origin: true,
    payload: params.payload ?? {},
  });
}

export async function revokeAgent(agent_did_id: string, reason: string) {
  return supabase
    .from('ai_operators')
    .update({ is_active: false, revoked_at: new Date().toISOString(), revoke_reason: reason })
    .eq('agent_did_id', agent_did_id);
}
