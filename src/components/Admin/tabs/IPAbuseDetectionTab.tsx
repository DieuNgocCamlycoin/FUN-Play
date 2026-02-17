import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, Wallet, Ban, RefreshCw, Loader2, UserCheck, RotateCcw, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface IPUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  pending_rewards: number;
  banned: boolean;
}

interface IPGroup {
  ip_hash: string;
  users: IPUser[];
  account_count: number;
  total_pending: number;
  distinct_wallets: number;
}

interface IPAbuseDetectionTabProps {
  onBan: (userId: string, reason: string) => Promise<boolean>;
  onUnban: (userId: string) => Promise<boolean>;
  onUnbanWithRestore: (userId: string, restoreRewards: boolean) => Promise<boolean>;
  loading: boolean;
}

// Unban dialog with restore checkbox
const UnbanDialogInner = ({ user, onUnbanWithRestore, loading, onSuccess }: {
  user: IPUser;
  onUnbanWithRestore: (userId: string, restoreRewards: boolean) => Promise<boolean>;
  loading: boolean;
  onSuccess: () => void;
}) => {
  const [restoreRewards, setRestoreRewards] = useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-green-500 border-green-500/30" disabled={loading}>
          <UserCheck className="w-3 h-3 mr-1" />
          Unban
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bỏ ban user này?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>User: <strong>{user.display_name || user.username}</strong> sẽ được bỏ ban và có thể sử dụng hệ thống bình thường.</p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
                <Checkbox
                  id={`restore-${user.id}`}
                  checked={restoreRewards}
                  onCheckedChange={(checked) => setRestoreRewards(checked === true)}
                />
                <div className="grid gap-1">
                  <label htmlFor={`restore-${user.id}`} className="text-sm font-medium cursor-pointer flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Khôi phục thưởng
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Tính lại pending & approved từ lịch sử giao dịch (reward_transactions)
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={async () => {
            const success = await onUnbanWithRestore(user.id, restoreRewards);
            if (success) {
              toast.success(`Đã bỏ ban ${user.display_name || user.username}${restoreRewards ? ' + khôi phục thưởng' : ''}`);
              onSuccess();
            }
          }}>
            Xác nhận Unban
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const IPAbuseDetectionTab = ({ onBan, onUnban, onUnbanWithRestore, loading }: IPAbuseDetectionTabProps) => {
  const [ipGroups, setIpGroups] = useState<IPGroup[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchIPGroups = useCallback(async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.rpc("get_ip_abuse_clusters", { min_accounts: 2 });

      if (error) throw error;

      const groups: IPGroup[] = (data || []).map((row: any) => ({
        ip_hash: row.ip_hash,
        account_count: Number(row.account_count),
        total_pending: Number(row.total_pending),
        distinct_wallets: Number(row.distinct_wallets),
        users: (row.users as IPUser[]) || [],
      }));

      setIpGroups(groups);
    } catch (error) {
      console.error("Error fetching IP groups:", error);
      toast.error("Lỗi khi tải dữ liệu IP tracking");
    } finally {
      setFetching(false);
    }
  }, []);

  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchIPGroups();
    }, 1500);
  }, [fetchIPGroups]);

  useEffect(() => {
    fetchIPGroups();

    const channel = supabase
      .channel('ip-abuse-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        debouncedRefetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ip_tracking' }, () => {
        debouncedRefetch();
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchIPGroups, debouncedRefetch]);

  const handleBanAll = async (users: IPUser[], reason: string) => {
    const unbannedUsers = users.filter((u) => !u.banned);
    for (const user of unbannedUsers) {
      await onBan(user.id, reason);
    }
    toast.success(`Đã ban ${unbannedUsers.length} users`);
    fetchIPGroups();
  };

  const totalSuspiciousIPs = ipGroups.length;
  const totalAccountsInvolved = ipGroups.reduce((sum, g) => sum + g.account_count, 0);
  const totalRiskCAMLY = ipGroups.reduce((sum, g) => sum + g.total_pending, 0);

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Đang phân tích IP...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Globe className="w-7 h-7 mx-auto text-blue-500 mb-1" />
            <div className="text-2xl font-bold">{totalSuspiciousIPs}</div>
            <div className="text-xs text-muted-foreground">IP nghi ngờ</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
          <CardContent className="p-4 text-center">
            <Users className="w-7 h-7 mx-auto text-red-500 mb-1" />
            <div className="text-2xl font-bold">{totalAccountsInvolved}</div>
            <div className="text-xs text-muted-foreground">Accounts liên quan</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Wallet className="w-7 h-7 mx-auto text-purple-500 mb-1" />
            <div className="text-2xl font-bold">
              {ipGroups.reduce((sum, g) => sum + g.distinct_wallets, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Ví liên quan</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {totalRiskCAMLY.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">CAMLY rủi ro</div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh */}
      <div className="flex items-center justify-between">
        {isLive && (
          <Badge variant="outline" className="text-xs border-green-500/50 text-green-500 gap-1">
            <Radio className="w-3 h-3 animate-pulse" />
            Live
          </Badge>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={fetchIPGroups} disabled={fetching}>
          <RefreshCw className={`w-4 h-4 mr-1 ${fetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* IP Groups */}
      <div className="space-y-4">
        {ipGroups.map((group) => {
          const unbannedCount = group.users.filter((u) => !u.banned).length;
          return (
            <Card key={group.ip_hash} className="border-blue-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 flex-wrap">
                    <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-mono text-xs">
                      IP: {group.ip_hash.slice(0, 8)}...{group.ip_hash.slice(-6)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {group.account_count} accounts
                    </Badge>
                    {group.distinct_wallets > 0 && (
                      <Badge variant="outline" className="text-xs text-purple-500">
                        {group.distinct_wallets} ví
                      </Badge>
                    )}
                  </span>
                  {unbannedCount > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" disabled={loading}>
                          <Ban className="w-4 h-4 mr-1" />
                          Ban tất cả ({unbannedCount})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ban tất cả users cùng IP?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {unbannedCount} users chưa bị ban sẽ bị ban.
                            <br />
                            Tổng pending: {group.total_pending.toLocaleString()} CAMLY
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleBanAll(group.users, "IP chung - Multi-account abuse")}
                          >
                            Xác nhận Ban
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.users.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-2 rounded ${
                        user.banned ? "bg-red-500/10 opacity-60" : "bg-muted/30"
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {(user.display_name || user.username)?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {user.display_name || user.username}
                          {user.banned && (
                            <Badge variant="destructive" className="ml-2 text-[10px]">
                              Đã ban
                            </Badge>
                          )}
                        </div>
                        {user.wallet_address && (
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-amber-500 text-xs">
                        {(user.pending_rewards || 0).toLocaleString()}
                      </Badge>
                      {user.banned && (
                        <UnbanDialogInner
                          user={user}
                          onUnbanWithRestore={onUnbanWithRestore}
                          loading={loading}
                          onSuccess={() => fetchIPGroups()}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tổng pending: {group.total_pending.toLocaleString()} CAMLY</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {ipGroups.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có dữ liệu IP tracking</p>
            <p className="text-xs mt-1">
              Dữ liệu sẽ được thu thập khi người dùng đăng ký, đăng nhập hoặc kết nối ví
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IPAbuseDetectionTab;
