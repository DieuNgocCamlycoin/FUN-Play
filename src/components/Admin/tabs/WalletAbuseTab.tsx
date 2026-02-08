import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, UserX, AlertCircle, Ban, ExternalLink, Globe } from "lucide-react";
import { AdminUser, WalletGroup } from "@/hooks/useAdminManage";
import { toast } from "sonner";
import IPAbuseDetectionTab from "./IPAbuseDetectionTab";
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

interface WalletAbuseTabProps {
  users: AdminUser[];
  walletGroups: WalletGroup[];
  onBan: (userId: string, reason: string) => Promise<boolean>;
  isFakeName: (name: string | null) => boolean;
  loading: boolean;
}

const WalletAbuseTab = ({ users, walletGroups, onBan, isFakeName, loading }: WalletAbuseTabProps) => {
  // Missing profile users (no avatar + no name + has pending)
  const missingProfileUsers = useMemo(() => {
    return users.filter(
      (u) => !u.banned && !u.avatar_url && (!u.display_name || u.display_name.length < 3) && (u.pending_rewards || 0) > 0
    );
  }, [users]);

  // Fake name users
  const fakeNameUsers = useMemo(() => {
    return users.filter((u) => !u.banned && isFakeName(u.display_name) && (u.pending_rewards || 0) > 0);
  }, [users, isFakeName]);

  const handleBan = async (user: AdminUser, reason: string) => {
    const success = await onBan(user.id, reason);
    if (success) {
      toast.success(`Đã ban ${user.display_name || user.username}`);
    } else {
      toast.error("Lỗi khi ban user");
    }
  };

  const handleBanAll = async (usersToban: AdminUser[], reason: string) => {
    for (const user of usersToban) {
      await onBan(user.id, reason);
    }
    toast.success(`Đã ban ${usersToban.length} users`);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Wallet className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">{walletGroups.length}</div>
            <div className="text-xs text-muted-foreground">Ví chung</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
          <CardContent className="p-4 text-center">
            <UserX className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold">{missingProfileUsers.length}</div>
            <div className="text-xs text-muted-foreground">Profile thiếu</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">{fakeNameUsers.length}</div>
            <div className="text-xs text-muted-foreground">Tên ảo</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {(
                walletGroups.reduce((sum, g) => sum + g.total_pending, 0) +
                missingProfileUsers.reduce((sum, u) => sum + (u.pending_rewards || 0), 0)
              ).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">CAMLY rủi ro</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="ip-tracking" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ip-tracking" className="gap-1 text-xs">
            <Globe className="w-3 h-3" /> IP Tracking
          </TabsTrigger>
          <TabsTrigger value="shared-wallet" className="text-xs">Ví chung ({walletGroups.length})</TabsTrigger>
          <TabsTrigger value="missing-profile" className="text-xs">Profile thiếu ({missingProfileUsers.length})</TabsTrigger>
          <TabsTrigger value="fake-name" className="text-xs">Tên ảo ({fakeNameUsers.length})</TabsTrigger>
        </TabsList>

        {/* IP Tracking */}
        <TabsContent value="ip-tracking">
          <IPAbuseDetectionTab onBan={onBan} loading={loading} />
        </TabsContent>

        {/* Shared Wallet */}
        <TabsContent value="shared-wallet">
          <div className="space-y-4">
            {walletGroups.map((group) => (
              <Card key={group.wallet_address} className="border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <Wallet className="w-4 h-4 text-purple-500" />
                      {group.wallet_address.slice(0, 10)}...{group.wallet_address.slice(-8)}
                      <a
                        href={`https://bscscan.com/address/${group.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" disabled={loading}>
                          <Ban className="w-4 h-4 mr-1" />
                          Ban tất cả ({group.users.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ban tất cả users dùng chung ví?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {group.users.length} users sẽ bị ban
                            <br />
                            Tổng pending: {group.total_pending.toLocaleString()} CAMLY
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleBanAll(group.users, "Ví chung - Multi-account")}
                          >
                            Xác nhận Ban tất cả
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded bg-muted/30"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {user.display_name || user.username}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-amber-500">
                          {(user.pending_rewards || 0).toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground text-right">
                    Tổng pending: {group.total_pending.toLocaleString()} CAMLY
                  </div>
                </CardContent>
              </Card>
            ))}

            {walletGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Không phát hiện ví chung
              </div>
            )}
          </div>
        </TabsContent>

        {/* Missing Profile */}
        <TabsContent value="missing-profile">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {missingProfileUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {user.display_name || user.username || "Chưa có tên"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{user.id}</div>
                    </div>
                    <Badge variant="outline" className="text-amber-500">
                      {(user.pending_rewards || 0).toLocaleString()} CAMLY
                    </Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBan(user, "Profile thiếu thông tin")}
                      disabled={loading}
                    >
                      Ban
                    </Button>
                  </div>
                ))}

                {missingProfileUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Không có profile thiếu thông tin
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fake Name */}
        <TabsContent value="fake-name">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {fakeNameUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{(user.display_name || "?")?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-orange-500">
                        {user.display_name || "Chưa có tên"}
                      </div>
                      <div className="text-xs text-muted-foreground">@{user.username}</div>
                    </div>
                    <Badge variant="outline" className="text-amber-500">
                      {(user.pending_rewards || 0).toLocaleString()} CAMLY
                    </Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBan(user, "Tên ảo / spam")}
                      disabled={loading}
                    >
                      Ban
                    </Button>
                  </div>
                ))}

                {fakeNameUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Không phát hiện tên ảo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletAbuseTab;
