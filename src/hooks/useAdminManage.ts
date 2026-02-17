import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AdminUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  total_camly_rewards: number;
  pending_rewards: number;
  approved_reward: number;
  banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  violation_level: number;
  avatar_verified: boolean;
  created_at: string;
  // Computed stats
  posts_count?: number;
  comments_count?: number;
  likes_received?: number;
  videos_count?: number;
}

export interface WalletGroup {
  wallet_address: string;
  users: AdminUser[];
  total_pending: number;
  total_approved: number;
}

export const useAdminManage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_users_directory_stats" as any);
      if (error) throw error;

      const enrichedUsers = ((data as any[]) || []).map((p: any) => ({
        id: p.user_id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        wallet_address: p.wallet_address,
        total_camly_rewards: p.total_camly_rewards || 0,
        pending_rewards: p.pending_rewards || 0,
        approved_reward: p.approved_reward || 0,
        banned: p.banned || false,
        banned_at: null,
        ban_reason: null,
        violation_level: 0,
        avatar_verified: p.avatar_verified || false,
        created_at: p.created_at,
        videos_count: p.videos_count || 0,
        comments_count: p.comments_count || 0,
      })) as AdminUser[];

      setUsers(enrichedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers();
    }, 1000);
  }, []);

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('admin-manage-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        debouncedRefetch();
      })
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedRefetch]);

  // Computed statistics
  const stats = useMemo(() => {
    const pending = users.filter((u) => (u.pending_rewards || 0) > 0);
    const banned = users.filter((u) => u.banned);
    const approved = users.filter((u) => (u.approved_reward || 0) > 0);

    return {
      totalUsers: users.length,
      pendingCount: pending.length,
      bannedCount: banned.length,
      approvedCount: approved.length,
      totalPending: pending.reduce((sum, u) => sum + (u.pending_rewards || 0), 0),
      totalApproved: approved.reduce((sum, u) => sum + (u.approved_reward || 0), 0),
    };
  }, [users]);

  // Shared wallet detection
  const walletGroups = useMemo((): WalletGroup[] => {
    const groups: Record<string, AdminUser[]> = {};

    users.forEach((user) => {
      if (user.wallet_address) {
        const wallet = user.wallet_address.toLowerCase();
        if (!groups[wallet]) groups[wallet] = [];
        groups[wallet].push(user);
      }
    });

    return Object.entries(groups)
      .filter(([_, users]) => users.length > 1)
      .map(([wallet, users]) => ({
        wallet_address: wallet,
        users,
        total_pending: users.reduce((sum, u) => sum + (u.pending_rewards || 0), 0),
        total_approved: users.reduce((sum, u) => sum + (u.approved_reward || 0), 0),
      }));
  }, [users]);

  // Suspicion score calculation
  const getSuspicionScore = (u: AdminUser): number => {
    let score = 0;

    if ((u.pending_rewards || 0) > 5000000) score += 40;
    else if ((u.pending_rewards || 0) > 2000000) score += 20;

    if (!u.avatar_url) score += 15;
    if (!u.display_name || u.display_name.length < 3) score += 15;
    if ((u.violation_level || 0) > 0) score += 25;
    if ((u.videos_count || 0) === 0 && (u.pending_rewards || 0) > 100000) score += 20;
    if (!u.avatar_verified) score += 10;

    return Math.min(score, 100);
  };

  // Fake name detection
  const isFakeName = (name: string | null): boolean => {
    if (!name) return true;
    const trimmed = name.trim();
    if (trimmed.length < 3) return true;
    if (/^\d+$/.test(trimmed)) return true;
    if (/^[a-z]{1,4}\d{5,}$/i.test(trimmed)) return true;
    if (/^(test|user|admin|guest|demo)\d*$/i.test(trimmed)) return true;
    return false;
  };

  // Actions
  const banUser = async (userId: string, reason: string = "Lạm dụng hệ thống") => {
    if (!user) return false;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("ban_user_permanently", {
        p_admin_id: user.id,
        p_user_id: userId,
        p_reason: reason,
      });
      if (error) throw error;
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error banning user:", error);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const unbanUser = async (userId: string) => {
    if (!user) return false;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("unban_user", {
        p_admin_id: user.id,
        p_user_id: userId,
      });
      if (error) throw error;
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error unbanning user:", error);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const unbanUserWithRestore = async (userId: string, restoreRewards: boolean) => {
    if (!user) return false;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("unban_user", {
        p_admin_id: user.id,
        p_user_id: userId,
      });
      if (error) throw error;

      if (restoreRewards) {
        const { data, error: restoreError } = await supabase.rpc("restore_user_rewards" as any, {
          p_user_id: userId,
          p_admin_id: user.id,
        });
        if (restoreError) {
          console.error("Error restoring rewards:", restoreError);
        }
      }

      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error unbanning user with restore:", error);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const approveReward = async (userId: string, note?: string) => {
    if (!user) return false;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("approve_user_reward", {
        p_user_id: userId,
        p_admin_id: user.id,
        p_note: note || null,
      });
      if (error) throw error;
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error approving reward:", error);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const rejectReward = async (userId: string, note?: string) => {
    if (!user) return false;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("reject_user_reward", {
        p_user_id: userId,
        p_admin_id: user.id,
        p_note: note || null,
      });
      if (error) throw error;
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error rejecting reward:", error);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const unapproveReward = async (userId: string, note?: string) => {
    if (!user) return false;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("unapprove_user_reward", {
        p_user_id: userId,
        p_admin_id: user.id,
        p_note: note || null,
      });
      if (error) throw error;
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error unapproving reward:", error);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const bulkApproveAll = async () => {
    if (!user) return null;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc("bulk_approve_all_rewards", {
        p_admin_id: user.id,
      });
      if (error) throw error;
      await fetchUsers();
      return data as { affected_users: number; total_amount: number };
    } catch (error) {
      console.error("Error bulk approving:", error);
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    users,
    loading,
    actionLoading,
    stats,
    walletGroups,
    getSuspicionScore,
    isFakeName,
    banUser,
    unbanUser,
    unbanUserWithRestore,
    approveReward,
    rejectReward,
    unapproveReward,
    bulkApproveAll,
    refetch: fetchUsers,
  };
};
