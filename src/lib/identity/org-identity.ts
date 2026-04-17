/**
 * Organization Identity helpers.
 * Org có DID riêng (entity_type='organization'), members với roles, optional verified badge.
 */
import { supabase } from '@/integrations/supabase/client';

export type OrgRole = 'owner' | 'admin' | 'sbt_issuer' | 'member';

export interface OrgDID {
  did_id: string;
  name?: string;
  verified_org_badge: boolean;
  member_count?: number;
}

export interface OrgMember {
  id: string;
  org_did_id: string;
  user_id: string;
  role: OrgRole;
  joined_at: string;
  is_active: boolean;
}

export async function createOrg(params: {
  name: string;
  description?: string;
  founder_user_id: string;
}): Promise<{ did_id: string } | null> {
  const { data: org, error } = await supabase
    .from('did_registry')
    .insert({
      user_id: params.founder_user_id,
      entity_type: 'organization',
      level: 'L1',
      status: 'basic',
      metadata: { name: params.name, description: params.description ?? null },
    })
    .select('did_id')
    .single();
  if (error || !org) {
    console.error('[org] create failed', error);
    return null;
  }
  await supabase.from('org_members').insert({
    org_did_id: org.did_id,
    user_id: params.founder_user_id,
    role: 'owner',
  });
  return { did_id: org.did_id };
}

export async function listMyOrgs(user_id: string): Promise<OrgMember[]> {
  const { data } = await supabase
    .from('org_members')
    .select('*')
    .eq('user_id', user_id)
    .eq('is_active', true);
  return (data ?? []) as OrgMember[];
}

export async function getOrgMembers(org_did_id: string): Promise<OrgMember[]> {
  const { data } = await supabase
    .from('org_members')
    .select('*')
    .eq('org_did_id', org_did_id)
    .eq('is_active', true);
  return (data ?? []) as OrgMember[];
}

export async function inviteMember(params: {
  org_did_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string;
}) {
  return supabase.from('org_members').insert({
    org_did_id: params.org_did_id,
    user_id: params.user_id,
    role: params.role,
    invited_by: params.invited_by,
  });
}

export async function isOrgIssuer(org_did_id: string, user_id: string): Promise<boolean> {
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_did_id', org_did_id)
    .eq('user_id', user_id)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) return false;
  return ['owner', 'admin', 'sbt_issuer'].includes(data.role);
}
