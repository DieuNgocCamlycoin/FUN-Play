import { describe, it, expect } from 'vitest';
import {
  generateCommitment,
  verifyCommitment,
  buildMerkleRoot,
  buildMerkleProof,
  verifyMerkleProof,
} from '../zk-merkle';

describe('ZK commitment', () => {
  it('verifies a valid commitment', async () => {
    const c = await generateCommitment('T2');
    expect(await verifyCommitment('T2', c.raw_salt, c.commitment_hash)).toBe(true);
  });

  it('rejects wrong value', async () => {
    const c = await generateCommitment('T2');
    expect(await verifyCommitment('T3', c.raw_salt, c.commitment_hash)).toBe(false);
  });

  it('rejects wrong salt', async () => {
    const c = await generateCommitment('T2');
    expect(await verifyCommitment('T2', 'bad-salt', c.commitment_hash)).toBe(false);
  });

  it('produces deterministic hash for same value+salt', async () => {
    const a = await generateCommitment('X', 'fixed-salt');
    const b = await generateCommitment('X', 'fixed-salt');
    expect(a.commitment_hash).toBe(b.commitment_hash);
  });
});

describe('Merkle root', () => {
  it('handles empty set', async () => {
    const r = await buildMerkleRoot([]);
    expect(r.leaf_count).toBe(0);
    expect(r.depth).toBe(0);
    expect(r.root).toMatch(/^[a-f0-9]{64}$/);
  });

  it('handles single leaf', async () => {
    const r = await buildMerkleRoot(['a']);
    expect(r.leaf_count).toBe(1);
    expect(r.depth).toBe(0);
    expect(r.root).toBe('a');
  });

  it('is sort-order independent', async () => {
    const r1 = await buildMerkleRoot(['c', 'a', 'b']);
    const r2 = await buildMerkleRoot(['b', 'c', 'a']);
    expect(r1.root).toBe(r2.root);
  });
});

describe('Merkle proof', () => {
  const leaves = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];

  it('verifies every leaf in a 5-leaf tree', async () => {
    const { root } = await buildMerkleRoot(leaves);
    for (const leaf of leaves) {
      const result = await buildMerkleProof(leaves, leaf);
      expect(result).not.toBeNull();
      const ok = await verifyMerkleProof(leaf, result!.proof, root);
      expect(ok, `verify ${leaf}`).toBe(true);
    }
  });

  it('verifies every leaf in a 8-leaf tree', async () => {
    const big = ['l1','l2','l3','l4','l5','l6','l7','l8'];
    const { root } = await buildMerkleRoot(big);
    for (const leaf of big) {
      const r = await buildMerkleProof(big, leaf);
      const ok = await verifyMerkleProof(leaf, r!.proof, root);
      expect(ok, `verify ${leaf}`).toBe(true);
    }
  });

  it('rejects non-member', async () => {
    expect(await buildMerkleProof(leaves, 'omega')).toBeNull();
  });

  it('rejects tampered proof', async () => {
    const { root } = await buildMerkleRoot(leaves);
    const r = await buildMerkleProof(leaves, 'alpha');
    const tampered = [...r!.proof];
    tampered[0] = { ...tampered[0], hash: '0'.repeat(64) };
    expect(await verifyMerkleProof('alpha', tampered, root)).toBe(false);
  });

  it('rejects wrong leaf with valid proof', async () => {
    const { root } = await buildMerkleRoot(leaves);
    const r = await buildMerkleProof(leaves, 'alpha');
    expect(await verifyMerkleProof('beta', r!.proof, root)).toBe(false);
  });

  it('proof root matches global root', async () => {
    const { root } = await buildMerkleRoot(leaves);
    const r = await buildMerkleProof(leaves, 'gamma');
    expect(r!.root).toBe(root);
  });
});
