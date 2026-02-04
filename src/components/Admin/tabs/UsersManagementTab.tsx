import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminManage } from "@/hooks/useAdminManage";
import { Users, Ban, Trash2, Search } from "lucide-react";

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
  } = useAdminManage();

  return (
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
  );
}
