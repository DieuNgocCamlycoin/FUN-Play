import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAdminManage } from "@/hooks/useAdminManage";
import { useAuth } from "@/hooks/useAuth";
import { Users, UserCheck, Ban, Trash2, RefreshCw, ShieldCheck } from "lucide-react";
import { checkAdminRateLimit } from "@/lib/adminRateLimit";

import AllUsersTab from "./AllUsersTab";
import BannedUsersTab from "./BannedUsersTab";
import QuickDeleteTab from "./QuickDeleteTab";

export function UsersManagementTab() {
  const {
    users,
    loading,
    actionLoading,
    stats,
    getSuspicionScore,
    banUser,
    unbanUser,
    toggleVerified,
    freezeRewards,
    wipeAllRewards,
    refetch,
  } = useAdminManage();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (user && !(await checkAdminRateLimit(user.id, "refresh_users"))) return;
    setRefreshing(true);
    await refetch(true);
    setRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 mb-4">
          <TabsTrigger value="all" className="gap-1 text-xs">
            <Users className="w-3 h-3" /> Tất Cả ({stats.totalUsers})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1 text-xs">
            <UserCheck className="w-3 h-3" /> Đang Hoạt Động ({users.filter(u => !u.banned).length})
          </TabsTrigger>
          <TabsTrigger value="banned" className="gap-1 text-xs">
            <Ban className="w-3 h-3" /> Đang Ban ({stats.bannedCount})
          </TabsTrigger>
          <TabsTrigger value="quick-delete" className="gap-1 text-xs">
            <Trash2 className="w-3 h-3" /> Xóa Nhanh
          </TabsTrigger>
          <TabsTrigger value="verified" className="gap-1 text-xs">
            <ShieldCheck className="w-3 h-3" /> Đã Xác Minh ({users.filter(u => u.avatar_verified).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AllUsersTab
            users={users}
            onBan={banUser}
            onUnban={unbanUser}
            onToggleVerified={toggleVerified}
            onFreezeRewards={freezeRewards}
            onWipeRewards={wipeAllRewards}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="active">
          <AllUsersTab
            users={users.filter(u => !u.banned)}
            onBan={banUser}
            onUnban={unbanUser}
            onToggleVerified={toggleVerified}
            onFreezeRewards={freezeRewards}
            onWipeRewards={wipeAllRewards}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="banned">
          <BannedUsersTab
            users={users}
            onUnban={unbanUser}
            loading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="quick-delete">
          <QuickDeleteTab
            users={users}
            onBan={banUser}
            getSuspicionScore={getSuspicionScore}
            loading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="verified">
          <AllUsersTab
            users={users.filter(u => u.avatar_verified)}
            onBan={banUser}
            onUnban={unbanUser}
            onToggleVerified={toggleVerified}
            onFreezeRewards={freezeRewards}
            onWipeRewards={wipeAllRewards}
            actionLoading={actionLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
