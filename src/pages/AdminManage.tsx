import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminManage } from "@/hooks/useAdminManage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Gift, Trash2, AlertTriangle, Search, CheckCircle, Download, Blocks, Users, Ban, ShieldX, ArrowLeft, Coins, Crown } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import RewardApprovalTab from "@/components/Admin/tabs/RewardApprovalTab";
import QuickDeleteTab from "@/components/Admin/tabs/QuickDeleteTab";
import WalletAbuseTab from "@/components/Admin/tabs/WalletAbuseTab";
import UserReviewTab from "@/components/Admin/tabs/UserReviewTab";
import ApprovedListTab from "@/components/Admin/tabs/ApprovedListTab";
import ClaimedListTab from "@/components/Admin/tabs/ClaimedListTab";
import BlockchainTab from "@/components/Admin/tabs/BlockchainTab";
import AllUsersTab from "@/components/Admin/tabs/AllUsersTab";
import BannedUsersTab from "@/components/Admin/tabs/BannedUsersTab";
import RewardPoolTab from "@/components/Admin/tabs/RewardPoolTab";
import AdminManagementTab from "@/components/Admin/tabs/AdminManagementTab";

const AdminManage = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const navigate = useNavigate();

  const {
    users,
    loading,
    actionLoading,
    stats,
    walletGroups,
    getSuspicionScore,
    isFakeName,
    banUser,
    unbanUser,
    approveReward,
    rejectReward,
    unapproveReward,
  } = useAdminManage();

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }
      
      // Check admin role
      const { data: adminData } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      
      // Check owner role
      const { data: ownerData } = await supabase.rpc("is_owner", {
        _user_id: user.id,
      });
      
      setIsAdmin(adminData === true || ownerData === true);
      setIsOwner(ownerData === true);
      setCheckingRole(false);
    };
    checkRoles();
  }, [user]);

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <ShieldX className="w-16 h-16 mx-auto text-destructive mb-4" />
          <p className="text-lg font-semibold">Truy cập bị từ chối</p>
          <p className="text-muted-foreground mt-2">Bạn không có quyền truy cập trang này</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Quản lý Users & Rewards
              </h1>
              <p className="text-muted-foreground text-sm">FUN Play Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <Gift className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <div className="text-2xl font-bold">{stats.pendingCount}</div>
              <div className="text-xs text-muted-foreground">Chờ duyệt</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
            <CardContent className="p-4 text-center">
              <Ban className="w-8 h-8 mx-auto text-red-500 mb-2" />
              <div className="text-2xl font-bold">{stats.bannedCount}</div>
              <div className="text-xs text-muted-foreground">Đang ban</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.totalPending.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">CAMLY chờ duyệt</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/30">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-cyan-500 mb-2" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-xs text-muted-foreground">Tổng Users</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="reward-pool" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="reward-pool" className="gap-1 text-xs">
              <Coins className="w-3 h-3" /> Reward Pool
            </TabsTrigger>
            <TabsTrigger value="quick-delete" className="gap-1 text-xs">
              <Search className="w-3 h-3" /> Xóa nhanh
            </TabsTrigger>
            <TabsTrigger value="approval" className="gap-1 text-xs">
              <Gift className="w-3 h-3" /> Duyệt ({stats.pendingCount})
            </TabsTrigger>
            <TabsTrigger value="abuse" className="gap-1 text-xs">
              <AlertTriangle className="w-3 h-3" /> Lạm dụng
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-1 text-xs">
              <Search className="w-3 h-3" /> Rà soát
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1 text-xs">
              <CheckCircle className="w-3 h-3" /> Đã Duyệt
            </TabsTrigger>
            <TabsTrigger value="claimed" className="gap-1 text-xs">
              <Download className="w-3 h-3" /> Đã Claim
            </TabsTrigger>
            <TabsTrigger value="blockchain" className="gap-1 text-xs">
              <Blocks className="w-3 h-3" /> BSC
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1 text-xs">
              <Users className="w-3 h-3" /> Tất cả ({stats.totalUsers})
            </TabsTrigger>
            <TabsTrigger value="banned" className="gap-1 text-xs">
              <Ban className="w-3 h-3" /> Ban ({stats.bannedCount})
            </TabsTrigger>
            <TabsTrigger value="admin-management" className="gap-1 text-xs">
              <Crown className="w-3 h-3" /> Quản lý Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reward-pool" className="mt-4">
            <RewardPoolTab />
          </TabsContent>
          <TabsContent value="quick-delete" className="mt-4">
            <QuickDeleteTab users={users} onBan={banUser} getSuspicionScore={getSuspicionScore} loading={actionLoading} />
          </TabsContent>
          <TabsContent value="approval" className="mt-4">
            <RewardApprovalTab users={users} onApprove={approveReward} onReject={rejectReward} loading={actionLoading} />
          </TabsContent>
          <TabsContent value="abuse" className="mt-4">
            <WalletAbuseTab users={users} walletGroups={walletGroups} onBan={banUser} isFakeName={isFakeName} loading={actionLoading} />
          </TabsContent>
          <TabsContent value="review" className="mt-4">
            <UserReviewTab users={users} onBan={banUser} getSuspicionScore={getSuspicionScore} loading={actionLoading} />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <ApprovedListTab users={users} onUnapprove={unapproveReward} loading={actionLoading} />
          </TabsContent>
          <TabsContent value="claimed" className="mt-4">
            <ClaimedListTab />
          </TabsContent>
          <TabsContent value="blockchain" className="mt-4">
            <BlockchainTab />
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            <AllUsersTab users={users} />
          </TabsContent>
          <TabsContent value="banned" className="mt-4">
            <BannedUsersTab users={users} onUnban={unbanUser} loading={actionLoading} />
          </TabsContent>
          <TabsContent value="admin-management" className="mt-4">
            <AdminManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminManage;
