/**
 * useOnChainAllocation — Read user's on-chain FUN Money balance + locked grants
 * SDK v2.0 — FUNMoneyMinter (no more locked/activated states)
 */

import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { getBalance, getLockedGrants, getContractAddress, type LockedGrant } from '@/lib/fun-money/web3-config';

export interface OnChainAllocation {
  /** Direct ERC20 balance (minted tokens) */
  flowing: bigint;
  /** Sum of unclaimed locked grants */
  locked: bigint;
  /** Total = flowing + locked */
  total: bigint;
  /** Locked grants detail */
  grants: LockedGrant[];
  contractAddress: string;
}

interface UseOnChainAllocationReturn {
  allocation: OnChainAllocation | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOnChainAllocation(
  address: string | null,
  provider: BrowserProvider | null
): UseOnChainAllocationReturn {
  const [allocation, setAllocation] = useState<OnChainAllocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address || !provider) {
      setAllocation(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [balance, grants] = await Promise.all([
        getBalance(provider, address),
        getLockedGrants(provider, address).catch(() => [] as LockedGrant[])
      ]);

      const lockedAmount = grants
        .filter(g => !g.claimed)
        .reduce((sum, g) => sum + g.amount, 0n);

      setAllocation({
        flowing: balance,
        locked: lockedAmount,
        total: balance + lockedAmount,
        grants,
        contractAddress: getContractAddress()
      });
    } catch (err: any) {
      console.error('[useOnChainAllocation] Error:', err);
      setError(err.message?.slice(0, 100) || 'Failed to read allocation');
    } finally {
      setLoading(false);
    }
  }, [address, provider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { allocation, loading, error, refresh };
}
