/**
 * ZK Merkle — proof-of-membership without revealing value.
 * Off-chain commitment + Merkle tree (sha-256, depth ≤20).
 *
 * Use cases:
 *  - "Tôi thuộc tier ≥ T2" mà không lộ TC chính xác
 *  - "Tôi sở hữu SBT loại X" mà không lộ token_id
 *  - "Tôi đã verify KYC" mà không lộ docs
 *
 * Tree convention:
 *  - Leaves are sorted ascending once at build time.
 *  - Pair-hash uses positional concat (left||right) — NO canonical sort,
 *    so the proof's `position` field is meaningful at verify time.
 *  - Odd nodes are duplicated (last leaf paired with itself).
 */
import { supabase } from '@/integrations/supabase/client';

export type CommitmentType = 'tier' | 'did_level' | 'sbt_ownership' | 'tc_range' | 'custom';

export type ProofStep = { hash: string; position: 'left' | 'right' };

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

/** Hash a parent node from its left and right children (positional). */
async function hashPair(left: string, right: string): Promise<string> {
  return sha256Hex(left + right);
}

/** Build full layered Merkle tree (sorted leaves, positional pair-hash). */
async function buildLayers(leaves: string[]): Promise<string[][]> {
  if (leaves.length === 0) return [[await sha256Hex('empty')]];
  const layers: string[][] = [[...leaves].sort()];
  while (layers[layers.length - 1].length > 1) {
    const cur = layers[layers.length - 1];
    const next: string[] = [];
    for (let i = 0; i < cur.length; i += 2) {
      const left = cur[i];
      const right = cur[i + 1] ?? cur[i]; // duplicate odd
      next.push(await hashPair(left, right));
    }
    layers.push(next);
  }
  return layers;
}

/** Build Merkle root from leaves. */
export async function buildMerkleRoot(leaves: string[]): Promise<{
  root: string;
  depth: number;
  leaf_count: number;
}> {
  const layers = await buildLayers(leaves);
  return {
    root: layers[layers.length - 1][0],
    depth: Math.max(0, layers.length - 1),
    leaf_count: leaves.length,
  };
}

/** Generate Merkle proof path for a leaf. */
export async function buildMerkleProof(leaves: string[], target: string): Promise<{
  proof: ProofStep[];
  root: string;
} | null> {
  if (!leaves.includes(target)) return null;
  const layers = await buildLayers(leaves);
  const proof: ProofStep[] = [];
  let idx = layers[0].indexOf(target);
  for (let l = 0; l < layers.length - 1; l++) {
    const layer = layers[l];
    const isLeft = idx % 2 === 0;
    const sibIdx = isLeft ? idx + 1 : idx - 1;
    const sibling = layer[sibIdx] ?? layer[idx]; // duplicate when odd
    // sibling is on the OPPOSITE side of current node
    proof.push({ hash: sibling, position: isLeft ? 'right' : 'left' });
    idx = Math.floor(idx / 2);
  }
  return { proof, root: layers[layers.length - 1][0] };
}

export async function verifyMerkleProof(
  leaf: string,
  proof: ProofStep[],
  root: string
): Promise<boolean> {
  let current = leaf;
  for (const step of proof) {
    current = step.position === 'right'
      ? await hashPair(current, step.hash)  // sibling on right
      : await hashPair(step.hash, current); // sibling on left
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
