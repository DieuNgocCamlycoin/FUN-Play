/**
 * Admin Mint Request Hook
 * Extracted from useFunMoneyMintRequest for Admin-specific operations
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MintRequest } from './useFunMoneyMintRequest';

export interface UseAdminMintRequestReturn {
  loading: boolean;
  error: string | null;
  requests: MintRequest[];
  pendingCount: number;
  fetchPendingRequests: () => Promise<void>;
  fetchAllRequests: (status?: string, limit?: number) => Promise<void>;
  approveRequest: (id: string, reason?: string) => Promise<boolean>;
  rejectRequest: (id: string, reason: string) => Promise<boolean>;
  saveMintResult: (id: string, txHash: string, attesterAddress: string) => Promise<boolean>;
  markAsFailed: (id: string, errorMessage: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAdminMintRequest(): UseAdminMintRequestReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<MintRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  /**
   * Fetch pending requests count
   */
  const fetchPendingCount = useCallback(async () => {
    try {
      const { count } = await (supabase as any)
        .from('mint_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      setPendingCount(count || 0);
    } catch {
      // Silently fail for count
    }
  }, []);

  /**
   * Fetch all pending requests
   */
  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('mint_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw new Error(fetchError.message);
      
      setRequests((data || []) as unknown as MintRequest[]);
      setPendingCount(data?.length || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all requests with optional filter
   */
  const fetchAllRequests = useCallback(async (status?: string, limit: number = 50) => {
    setLoading(true);
    setError(null);

    try {
      let query = (supabase as any)
        .from('mint_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw new Error(fetchError.message);
      
      setRequests((data || []) as unknown as MintRequest[]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Approve a request (status: pending → approved)
   */
  const approveRequest = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await (supabase as any)
        .from('mint_requests')
        .update({
          status: 'approved',
          decision_reason: reason || 'Approved by admin',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('status', 'pending'); // Only update if still pending

      if (updateError) throw new Error(updateError.message);

      // Update local state
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'approved' as const } : r
      ));
      setPendingCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reject a request (status: pending → rejected)
   */
  const rejectRequest = useCallback(async (id: string, reason: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await (supabase as any)
        .from('mint_requests')
        .update({
          status: 'rejected',
          decision_reason: reason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('status', 'pending');

      if (updateError) throw new Error(updateError.message);

      // Update local state
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'rejected' as const } : r
      ));
      setPendingCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save mint transaction result (status: approved → minted)
   */
  const saveMintResult = useCallback(async (
    id: string, 
    txHash: string, 
    attesterAddress: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await (supabase as any)
        .from('mint_requests')
        .update({
          status: 'minted',
          tx_hash: txHash,
          attester_address: attesterAddress,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          minted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      // Update local state
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'minted' as const, tx_hash: txHash } : r
      ));

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to save mint result');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark request as failed (status: approved → failed)
   */
  const markAsFailed = useCallback(async (id: string, errorMessage: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await (supabase as any)
        .from('mint_requests')
        .update({
          status: 'failed',
          decision_reason: errorMessage,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      // Update local state
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'failed' as const } : r
      ));

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to mark as failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetch current data
   */
  const refetch = useCallback(async () => {
    await fetchPendingRequests();
  }, [fetchPendingRequests]);

  // Initial fetch
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  return {
    loading,
    error,
    requests,
    pendingCount,
    fetchPendingRequests,
    fetchAllRequests,
    approveRequest,
    rejectRequest,
    saveMintResult,
    markAsFailed,
    refetch
  };
}
