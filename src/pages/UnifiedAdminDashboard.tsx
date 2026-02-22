import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldX } from "lucide-react";

import { UnifiedAdminLayout, AdminSection } from "@/components/Admin/UnifiedAdminLayout";
import { OverviewTab } from "@/components/Admin/tabs/OverviewTab";
import { RewardsManagementTab } from "@/components/Admin/tabs/RewardsManagementTab";
import { UsersManagementTab } from "@/components/Admin/tabs/UsersManagementTab";
import { VideosManagementTab } from "@/components/Admin/tabs/VideosManagementTab";
import { ConfigManagementTab } from "@/components/Admin/tabs/ConfigManagementTab";
import AdminManagementTab from "@/components/Admin/tabs/AdminManagementTab";
import { FunMoneyApprovalTab } from "@/components/Admin/tabs/FunMoneyApprovalTab";
import WalletAbuseTab from "@/components/Admin/tabs/WalletAbuseTab";
import { UserStatsTab } from "@/components/Admin/tabs/UserStatsTab";
import { WalletDetectiveTab } from "@/components/Admin/tabs/WalletDetectiveTab";
import { ReportsManagementTab } from "@/components/Admin/tabs/ReportsManagementTab";
import { useAdminManage } from "@/hooks/useAdminManage";

export default function UnifiedAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { stats, users, walletGroups, banUser, unbanUserWithRestore, isFakeName, actionLoading } = useAdminManage();

  // Get current section from URL or default to "overview"
  const currentSection = (searchParams.get("section") as AdminSection) || "overview";

  const handleSectionChange = (section: AdminSection) => {
    setSearchParams({ section });
  };

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

  // Loading state
  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <ShieldX className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Truy cập bị từ chối</h2>
          <p className="text-muted-foreground">
            Bạn không có quyền truy cập trang Admin Dashboard. 
            Vui lòng liên hệ Owner nếu bạn cần quyền truy cập.
          </p>
        </Card>
      </div>
    );
  }

  // Render content based on current section
  const renderContent = () => {
    switch (currentSection) {
      case "overview":
        return <OverviewTab />;
      case "rewards":
        return <RewardsManagementTab />;
      case "fun-money":
        return <FunMoneyApprovalTab />;
      case "abuse-detection":
        return (
          <WalletAbuseTab
            users={users}
            walletGroups={walletGroups}
            onBan={banUser}
            onUnbanWithRestore={unbanUserWithRestore}
            isFakeName={isFakeName}
            loading={actionLoading}
          />
        );
      case "users":
        return <UsersManagementTab />;
      case "videos":
        return <VideosManagementTab />;
      case "config":
        return <ConfigManagementTab />;
      case "admin-team":
        return <AdminManagementTab />;
      case "user-stats":
        return <UserStatsTab />;
      case "wallet-detective":
        return <WalletDetectiveTab />;
      case "reports":
        return <ReportsManagementTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <UnifiedAdminLayout
      currentSection={currentSection}
      onSectionChange={handleSectionChange}
      pendingCount={stats.pendingCount}
      isOwner={isOwner}
    >
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
              {currentSection === "overview" && "Tổng Quan Dashboard"}
              {currentSection === "rewards" && "Quản Lý CAMLY Rewards"}
              {currentSection === "fun-money" && "FUN Money Mint"}
              {currentSection === "users" && "Quản Lý Người Dùng"}
              {currentSection === "videos" && "Quản Lý Video"}
              {currentSection === "config" && "Cấu Hình Hệ Thống"}
              {currentSection === "admin-team" && "Quản Lý Admin Team"}
              {currentSection === "abuse-detection" && "Phát Hiện Lạm Dụng IP"}
              {currentSection === "user-stats" && "Thống Kê Users"}
              {currentSection === "wallet-detective" && "Wallet Detective"}
              {currentSection === "reports" && "Quản Lý Báo Cáo"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentSection === "overview" && "Thống kê toàn nền tảng FUN Play"}
              {currentSection === "rewards" && "Duyệt, theo dõi và quản lý phần thưởng CAMLY"}
              {currentSection === "fun-money" && "Duyệt và mint FUN tokens theo PPLP Protocol"}
              {currentSection === "users" && "Quản lý tài khoản và quyền người dùng"}
              {currentSection === "videos" && "Duyệt video và thống kê uploads"}
              {currentSection === "config" && "Điều chỉnh mức thưởng và giới hạn hệ thống"}
              {currentSection === "admin-team" && "Thêm/xóa quyền admin cho thành viên"}
              {currentSection === "abuse-detection" && "Phát hiện IP dùng chung để tạo nhiều tài khoản/ví nhận thưởng"}
              {currentSection === "user-stats" && "Danh sách users với đầy đủ thống kê hoạt động, CAMLY, FUN Money, Donations"}
              {currentSection === "wallet-detective" && "Truy vết ví: tìm tất cả users liên quan qua giao dịch on-chain"}
              {currentSection === "reports" && "Xem xét và xử lý báo cáo video, kênh từ cộng đồng"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </UnifiedAdminLayout>
  );
}
