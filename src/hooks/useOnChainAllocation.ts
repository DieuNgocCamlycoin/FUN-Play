/**
 * Hook to read user's on-chain FUN Money allocation
 * Reads locked, activated, and flowing (balance) amounts from the contract
 */

import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { getAllocation, getBalance, getContractAddress } from '@/lib/fun-money/web3-config';

export interface OnChainAllocation {
  locked: bigint;
  activated: bigint;
  flowing: bigint;
  total: bigint;
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
      const [alloc, balance] = await Promise.all([
        getAllocation(provider, address),
        getBalance(provider, address)
      ]);

      setAllocation({
        locked: alloc.locked,
        activated: alloc.activated,
        flowing: balance,
        total: alloc.locked + alloc.activated + balance,
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
