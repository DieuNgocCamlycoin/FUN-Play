import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminManage } from "@/hooks/useAdminManage";
import { Gift, CheckCircle, Download, Blocks, Coins, AlertTriangle, Search, Award } from "lucide-react";

import RewardPoolTab from "./RewardPoolTab";
import RewardApprovalTab from "./RewardApprovalTab";
import ApprovedListTab from "./ApprovedListTab";
import ClaimedListTab from "./ClaimedListTab";
import BlockchainTab from "./BlockchainTab";
import WalletAbuseTab from "./WalletAbuseTab";
import UserReviewTab from "./UserReviewTab";
import BountyApprovalTab from "./BountyApprovalTab";

export function RewardsManagementTab() {
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
    unbanUserWithRestore,
    approveReward,
    rejectReward,
    unapproveReward,
    bulkApproveAll,
  } = useAdminManage();

  return (
    <Tabs defaultValue="pool" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 mb-4">
        <TabsTrigger value="pool" className="gap-1 text-xs">
          <Coins className="w-3 h-3" /> Reward Pool
        </TabsTrigger>
        <TabsTrigger value="pending" className="gap-1 text-xs">
          <Gift className="w-3 h-3" /> Chờ Duyệt ({stats.pendingCount})
        </TabsTrigger>
        <TabsTrigger value="abuse" className="gap-1 text-xs">
          <AlertTriangle className="w-3 h-3" /> Lạm Dụng
        </TabsTrigger>
        <TabsTrigger value="review" className="gap-1 text-xs">
          <Search className="w-3 h-3" /> Rà Soát
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
        <TabsTrigger value="bounty" className="gap-1 text-xs">
          <Award className="w-3 h-3" /> Bounty
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pool">
        <RewardPoolTab />
      </TabsContent>

      <TabsContent value="pending">
        <RewardApprovalTab 
          users={users} 
          onApprove={approveReward} 
          onReject={rejectReward} 
          onBulkApproveAll={bulkApproveAll}
          loading={actionLoading} 
        />
      </TabsContent>

      <TabsContent value="abuse">
        <WalletAbuseTab 
          users={users} 
          walletGroups={walletGroups} 
          onBan={banUser} 
          onUnbanWithRestore={unbanUserWithRestore}
          isFakeName={isFakeName} 
          loading={actionLoading} 
        />
      </TabsContent>

      <TabsContent value="review">
        <UserReviewTab 
          users={users} 
          onBan={banUser} 
          getSuspicionScore={getSuspicionScore} 
          loading={actionLoading} 
        />
      </TabsContent>

      <TabsContent value="approved">
        <ApprovedListTab 
          users={users} 
          onUnapprove={unapproveReward} 
          loading={actionLoading} 
        />
      </TabsContent>

      <TabsContent value="claimed">
        <ClaimedListTab />
      </TabsContent>

      <TabsContent value="blockchain">
        <BlockchainTab />
      </TabsContent>

      <TabsContent value="bounty">
        <BountyApprovalTab />
      </TabsContent>
    </Tabs>
  );
}
