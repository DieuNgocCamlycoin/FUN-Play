import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAdminManage } from "@/hooks/useAdminManage";
import { useAuth } from "@/hooks/useAuth";
import { Users, Ban, Trash2, RefreshCw } from "lucide-react";
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 mb-4">
          <TabsTrigger value="all" className="gap-1 text-xs">
            <Users className="w-3 h-3" /> Tất Cả ({stats.totalUsers})
          </TabsTrigger>
          <TabsTrigger value="banned" className="gap-1 text-xs">
            <Ban className="w-3 h-3" /> Đang Ban ({stats.bannedCount})
          </TabsTrigger>
          <TabsTrigger value="quick-delete" className="gap-1 text-xs">
            <Trash2 className="w-3 h-3" /> Xóa Nhanh
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AllUsersTab users={users} />
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
      </Tabs>
    </div>
  );
}
