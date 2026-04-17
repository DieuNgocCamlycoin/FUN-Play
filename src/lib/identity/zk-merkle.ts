/**
 * ZK Merkle — proof-of-membership without revealing value.
 * Off-chain commitment + Merkle tree (sha-256, depth 20).
 *
 * Use cases:
 *  - "Tôi thuộc tier ≥ T2" mà không lộ TC chính xác
 *  - "Tôi sở hữu SBT loại X" mà không lộ token_id
 *  - "Tôi đã verify KYC" mà không lộ docs
 */
import { supabase } from '@/integrations/supabase/client';

export type CommitmentType = 'tier' | 'did_level' | 'sbt_ownership' | 'tc_range' | 'custom';

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateCommitment(value: string, salt?: string): Promise<{
  commitment_hash: string;
  salt_hash: string;
  raw_salt: string;
}> {
  const raw_salt = salt ?? crypto.randomUUID() + crypto.randomUUID();
  const salt_hash = await sha256Hex(raw_salt);
  const commitment_hash = await sha256Hex(`${value}|${raw_salt}`);
  return { commitment_hash, salt_hash, raw_salt };
}

export async function verifyCommitment(
  value: string,
  raw_salt: string,
  commitment_hash: string
): Promise<boolean> {
  const expected = await sha256Hex(`${value}|${raw_salt}`);
  return expected === commitment_hash;
}

/** Build Merkle root from sorted leaves (sha-256, pair-hash). */
export async function buildMerkleRoot(leaves: string[]): Promise<{
  root: string;
  depth: number;
  leaf_count: number;
}> {
  if (leaves.length === 0) return { root: await sha256Hex('empty'), depth: 0, leaf_count: 0 };
  let layer = [...leaves].sort();
  let depth = 0;
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i];
      const b = layer[i + 1] ?? a;
      const [lo, hi] = a < b ? [a, b] : [b, a];
      next.push(await sha256Hex(lo + hi));
    }
    layer = next;
    depth++;
  }
  return { root: layer[0], depth, leaf_count: leaves.length };
}

/** Generate Merkle proof path for a leaf. */
export async function buildMerkleProof(leaves: string[], target: string): Promise<{
  proof: { hash: string; position: 'left' | 'right' }[];
  root: string;
} | null> {
  if (!leaves.includes(target)) return null;
  let layer = [...leaves].sort();
  const proof: { hash: string; position: 'left' | 'right' }[] = [];
  let current = target;
  while (layer.length > 1) {
    const idx = layer.indexOf(current);
    const isLeft = idx % 2 === 0;
    const sibIdx = isLeft ? idx + 1 : idx - 1;
    const sibling = layer[sibIdx] ?? current;
    proof.push({ hash: sibling, position: isLeft ? 'right' : 'left' });
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i];
      const b = layer[i + 1] ?? a;
      const [lo, hi] = a < b ? [a, b] : [b, a];
      next.push(await sha256Hex(lo + hi));
    }
    const pairIdx = Math.floor(idx / 2);
    layer = next;
    current = layer[pairIdx];
  }
  return { proof, root: layer[0] };
}

export async function verifyMerkleProof(
  leaf: string,
  proof: { hash: string; position: 'left' | 'right' }[],
  root: string
): Promise<boolean> {
  let current = leaf;
  for (const step of proof) {
    const [lo, hi] = step.position === 'right'
      ? (current < step.hash ? [current, step.hash] : [step.hash, current])
      : (step.hash < current ? [step.hash, current] : [current, step.hash]);
    current = await sha256Hex(lo + hi);
  }
  return current === root;
}

/** Fetch latest active Merkle root for a commitment type. */
export async function getLatestMerkleRoot(commitment_type: CommitmentType) {
  const { data } = await supabase
    .from('zk_merkle_roots')
    .select('*')
    .eq('commitment_type', commitment_type)
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
