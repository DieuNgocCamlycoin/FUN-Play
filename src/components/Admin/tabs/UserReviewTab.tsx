import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, ShieldCheck, ShieldX, Eye } from "lucide-react";
import { AdminUser } from "@/hooks/useAdminManage";
import { toast } from "sonner";
import { getProfileUrl } from "@/lib/adminUtils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserReviewTabProps {
  users: AdminUser[];
  onBan: (userId: string, reason: string) => Promise<boolean>;
  getSuspicionScore: (user: AdminUser) => number;
  loading: boolean;
}

const UserReviewTab = ({ users, onBan, getSuspicionScore, loading }: UserReviewTabProps) => {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Categorize users
  const suspiciousUsers = useMemo(() => {
    return users
      .filter((u) => !u.banned)
      .map((u) => ({ ...u, score: getSuspicionScore(u) }))
      .filter((u) => u.score >= 30)
      .sort((a, b) => b.score - a.score);
  }, [users, getSuspicionScore]);

  const bannedUsers = useMemo(() => {
    return users.filter((u) => u.banned);
  }, [users]);

  const verifiedUsers = useMemo(() => {
    return users.filter((u) => !u.banned && u.avatar_verified && (u.videos_count || 0) > 0);
  }, [users]);

  const getSuspicionBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-red-500">🔴 Rất cao ({score}%)</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">🟠 Cao ({score}%)</Badge>;
    if (score >= 30) return <Badge className="bg-yellow-500 text-black">🟡 Trung bình ({score}%)</Badge>;
    return <Badge className="bg-green-500">🟢 Thấp ({score}%)</Badge>;
  };

  const handleBan = async (user: AdminUser) => {
    const success = await onBan(user.id, "Nghi ngờ lạm dụng - Rà soát");
    if (success) {
      toast.success(`Đã ban ${user.display_name || user.username}`);
    } else {
      toast.error("Lỗi khi ban user");
    }
  };

  const UserDetailDialog = ({ user }: { user: AdminUser & { score?: number } }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chi tiết User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold">{user.display_name || user.username}</div>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">ID</div>
              <div className="font-mono text-xs truncate">{user.id}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avatar verified</div>
              <div>{user.avatar_verified ? "✅ Có" : "❌ Không"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Pending CAMLY</div>
              <div className="font-bold text-amber-500">{(user.pending_rewards || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Approved CAMLY</div>
              <div className="font-bold text-green-500">{(user.approved_reward || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Videos</div>
              <div>{user.videos_count || 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Comments</div>
              <div>{user.comments_count || 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Violation Level</div>
              <div>{user.violation_level || 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Wallet</div>
              <div className="truncate text-xs">{user.wallet_address || "Chưa kết nối"}</div>
            </div>
          </div>

          {user.score !== undefined && (
            <div className="pt-2 border-t">
              <div className="text-muted-foreground text-sm mb-2">Suspicion Score</div>
              {getSuspicionBadge(user.score)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
          <CardContent className="p-4 text-center">
            <ShieldAlert className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <div className="text-2xl font-bold">{suspiciousUsers.length}</div>
            <div className="text-xs text-muted-foreground">Nghi ngờ</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
          <CardContent className="p-4 text-center">
            <ShieldX className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold">{bannedUsers.length}</div>
            <div className="text-xs text-muted-foreground">Đã ban</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="p-4 text-center">
            <ShieldCheck className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">{verifiedUsers.length}</div>
            <div className="text-xs text-muted-foreground">Bà con thật</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="suspicious" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suspicious">Nghi ngờ ({suspiciousUsers.length})</TabsTrigger>
          <TabsTrigger value="banned">Đã ban ({bannedUsers.length})</TabsTrigger>
          <TabsTrigger value="verified">Bà con thật ({verifiedUsers.length})</TabsTrigger>
        </TabsList>

        {/* Suspicious Users */}
        <TabsContent value="suspicious">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {suspiciousUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50"
                  >
                    {(() => {
                      const profileUrl = getProfileUrl(user.username, user.id);
                      return profileUrl ? (
                        <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                          <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                          </Avatar>
                        </a>
                      ) : (
                        <Avatar className="w-10 h-10 opacity-50">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                        </Avatar>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.display_name || user.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {(user.pending_rewards || 0).toLocaleString()} CAMLY pending
                      </div>
                    </div>
                    {getSuspicionBadge(user.score)}
                    <div className="flex gap-2">
                      <UserDetailDialog user={user} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={loading}>
                            Ban
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận ban user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              User: {user.display_name || user.username}
                              <br />
                              Score: {user.score}%
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleBan(user)}>
                              Xác nhận Ban
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                {suspiciousUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Không có user nghi ngờ
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banned Users */}
        <TabsContent value="banned">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {bannedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                  >
                    {(() => {
                      const profileUrl = getProfileUrl(user.username, user.id);
                      return profileUrl ? (
                        <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                          <Avatar className="w-10 h-10 opacity-50 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                          </Avatar>
                        </a>
                      ) : (
                        <Avatar className="w-10 h-10 opacity-50">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                        </Avatar>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate line-through opacity-70">
                        {user.display_name || user.username}
                      </div>
                      <div className="text-xs text-red-400">{user.ban_reason || "Lạm dụng hệ thống"}</div>
                    </div>
                    <Badge variant="destructive">Banned</Badge>
                  </div>
                ))}

                {bannedUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có user bị ban
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verified Users */}
        <TabsContent value="verified">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {verifiedUsers.slice(0, 20).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                  >
                    {(() => {
                      const profileUrl = getProfileUrl(user.username, user.id);
                      return profileUrl ? (
                        <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                          <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                          </Avatar>
                        </a>
                      ) : (
                        <Avatar className="w-10 h-10 opacity-50">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                        </Avatar>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.display_name || user.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.videos_count || 0} videos • {user.comments_count || 0} comments
                      </div>
                    </div>
                    <Badge className="bg-green-500">✅ Verified</Badge>
                  </div>
                ))}

                {verifiedUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có user verified
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

export default UserReviewTab;
