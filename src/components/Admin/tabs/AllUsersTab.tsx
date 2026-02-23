import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Users, Search, FileSpreadsheet, AlertTriangle, Clock, MoreHorizontal,
  ExternalLink, ShieldCheck, ShieldOff, Snowflake, Trash2, Ban, UserCheck,
  ChevronDown, ChevronRight, Eye, ThumbsUp, MessageSquare, Share2, Video, Coins
} from "lucide-react";
import { AdminUser, getAnomalyFlags, getProfileStatus } from "@/hooks/useAdminManage";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { AdminPagination, PAGE_SIZE, paginate } from "@/components/Admin/AdminPagination";
import { getProfileUrl } from "@/lib/adminUtils";

interface AllUsersTabProps {
  users: AdminUser[];
  onBan: (userId: string, reason?: string) => Promise<boolean>;
  onUnban: (userId: string) => Promise<boolean>;
  onToggleVerified: (userId: string) => Promise<boolean | false>;
  onFreezeRewards: (userId: string) => Promise<boolean>;
  onWipeRewards: (userId: string) => Promise<boolean>;
  onDeleteUser?: (userId: string) => Promise<boolean>;
  actionLoading: boolean;
}

const AllUsersTab = ({
  users, onBan, onUnban, onToggleVerified, onFreezeRewards, onWipeRewards, onDeleteUser, actionLoading,
}: AllUsersTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnomalyOnly, setShowAnomalyOnly] = useState(false);
  const [showStaleOnly, setShowStaleOnly] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; userId: string; userName: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, showAnomalyOnly, showStaleOnly]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(term) ||
          u.username?.toLowerCase().includes(term) ||
          u.id.includes(term) ||
          u.wallet_address?.toLowerCase().includes(term)
      );
    }
    if (showAnomalyOnly) {
      result = result.filter((u) => {
        const flags = getAnomalyFlags(u);
        return flags.isHighPending || flags.isNoActivity || flags.isSuspicious;
      });
    }
    if (showStaleOnly) {
      result = result.filter((u) => getProfileStatus(u) === "stale");
    }
    return result;
  }, [users, debouncedSearch, showAnomalyOnly, showStaleOnly]);

  const { paged, totalPages } = paginate(filteredUsers, currentPage);

  const exportCSV = () => {
    const headers = ["ID","Username","Display Name","Views","Likes","Comments","Shares","Videos","Total CAMLY","Pending","Approved","Wallet","Banned","Verified"];
    const rows = filteredUsers.map((u) => [u.id,u.username,u.display_name||"",u.views_count||0,u.likes_count||0,u.comments_count||0,u.shares_count||0,u.videos_count||0,u.total_camly_rewards,u.pending_rewards||0,u.approved_reward||0,u.wallet_address||"",u.banned?"Yes":"No",u.avatar_verified?"Yes":"No"]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất file CSV!");
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, userId, userName } = confirmAction;
    let success = false;
    switch (type) {
      case "ban":
        success = await onBan(userId, "Lạm dụng hệ thống");
        if (success) toast.success(`Đã ban ${userName}`);
        break;
      case "unban":
        success = await onUnban(userId);
        if (success) toast.success(`Đã unban ${userName}`);
        break;
      case "freeze":
        success = await onFreezeRewards(userId);
        if (success) toast.success(`Đã treo thưởng ${userName}`);
        break;
      case "wipe":
        success = await onWipeRewards(userId);
        if (success) toast.success(`Đã xóa tất cả phần thưởng của ${userName}`);
        break;
      case "delete":
        if (onDeleteUser) {
          success = await onDeleteUser(userId);
          if (success) toast.success(`Đã xóa vĩnh viễn tài khoản ${userName}`);
        }
        break;
    }
    setConfirmAction(null);
  };

  const handleToggleVerified = async (userId: string, userName: string, currentVerified: boolean) => {
    const result = await onToggleVerified(userId);
    if (result !== false) {
      toast.success(currentVerified ? `Đã gỡ tick xanh ${userName}` : `Đã cấp tick xanh ${userName}`);
    }
  };

  const fmt = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : n.toString();

  return (
    <div className="space-y-4">
      {/* Stats & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 w-full sm:w-auto">
          <CardContent className="p-4 flex items-center gap-4">
            <Users className="w-10 h-10 text-blue-500" />
            <div>
              <div className="text-3xl font-bold">{users.length}</div>
              <div className="text-xs text-muted-foreground">Tổng Users</div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch checked={showAnomalyOnly} onCheckedChange={setShowAnomalyOnly} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> Bất thường
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={showStaleOnly} onCheckedChange={setShowStaleOnly} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500" /> Quá hạn
            </span>
          </div>
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, ID hoặc wallet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Users Directory ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center hidden md:table-cell">
                    <Eye className="w-3.5 h-3.5 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center hidden md:table-cell">
                    <ThumbsUp className="w-3.5 h-3.5 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center hidden md:table-cell">
                    <MessageSquare className="w-3.5 h-3.5 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center hidden md:table-cell">
                    <Share2 className="w-3.5 h-3.5 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center hidden md:table-cell">
                    <Video className="w-3.5 h-3.5 mx-auto" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Coins className="w-3.5 h-3.5 ml-auto" />
                  </TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((user, idx) => {
                  const flags = getAnomalyFlags(user);
                  const isAnomaly = flags.isHighPending || flags.isNoActivity || flags.isSuspicious;
                  const isExpanded = expandedUserId === user.id;
                  const rowIndex = (currentPage - 1) * PAGE_SIZE + idx + 1;

                  return (
                    <Collapsible key={user.id} open={isExpanded} onOpenChange={() => setExpandedUserId(isExpanded ? null : user.id)} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <TableRow
                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                              user.banned ? "opacity-50" :
                              isAnomaly ? "bg-amber-500/10 border-l-4 border-amber-500" : ""
                            }`}
                          >
                            <TableCell className="text-muted-foreground text-xs">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isAnomaly && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-medium truncate max-w-[140px] flex items-center gap-1">
                                    {user.display_name || user.username}
                                    {user.avatar_verified && (
                                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[140px]">@{user.username}</div>
                                  {/* Mobile stats */}
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground md:hidden mt-0.5">
                                    <span>👁 {fmt(user.views_count || 0)}</span>
                                    <span>👍 {fmt(user.likes_count || 0)}</span>
                                    <span>💬 {fmt(user.comments_count || 0)}</span>
                                    <span>🔗 {fmt(user.shares_count || 0)}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell text-sm">{fmt(user.views_count || 0)}</TableCell>
                            <TableCell className="text-center hidden md:table-cell text-sm">{fmt(user.likes_count || 0)}</TableCell>
                            <TableCell className="text-center hidden md:table-cell text-sm">{fmt(user.comments_count || 0)}</TableCell>
                            <TableCell className="text-center hidden md:table-cell text-sm">{fmt(user.shares_count || 0)}</TableCell>
                            <TableCell className="text-center hidden md:table-cell text-sm">{user.videos_count || 0}</TableCell>
                            <TableCell className="text-right font-bold text-sm">{fmt(user.total_camly_rewards || 0)}</TableCell>
                            <TableCell className="text-center">
                              {user.banned ? (
                                <Badge variant="destructive" className="text-[10px]">Banned</Badge>
                              ) : user.avatar_verified ? (
                                <Badge className="bg-blue-500 text-[10px]">Verified</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">Normal</Badge>
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
                                  <DropdownMenuItem onClick={() => {
                                    const url = getProfileUrl(user.username, user.id);
                                    if (url) window.open(url, "_blank");
                                  }}>
                                    <ExternalLink className="w-4 h-4 mr-2" /> Xem Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={actionLoading}
                                    onClick={() => handleToggleVerified(user.id, user.display_name || user.username, user.avatar_verified)}
                                  >
                                    {user.avatar_verified ? (
                                      <><ShieldOff className="w-4 h-4 mr-2" /> Gỡ tick xanh</>
                                    ) : (
                                      <><ShieldCheck className="w-4 h-4 mr-2 text-blue-500" /> Cấp tick xanh</>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={actionLoading}
                                    onClick={() => setConfirmAction({ type: "freeze", userId: user.id, userName: user.display_name || user.username })}
                                  >
                                    <Snowflake className="w-4 h-4 mr-2 text-cyan-500" /> Treo thưởng
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={actionLoading}
                                    className="text-destructive"
                                    onClick={() => setConfirmAction({ type: "wipe", userId: user.id, userName: user.display_name || user.username })}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Xóa tất cả phần thưởng
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {user.banned ? (
                                    <DropdownMenuItem
                                      disabled={actionLoading}
                                      onClick={() => setConfirmAction({ type: "unban", userId: user.id, userName: user.display_name || user.username })}
                                    >
                                      <UserCheck className="w-4 h-4 mr-2 text-green-500" /> Unban
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      disabled={actionLoading}
                                      className="text-destructive"
                                      onClick={() => setConfirmAction({ type: "ban", userId: user.id, userName: user.display_name || user.username })}
                                    >
                                      <Ban className="w-4 h-4 mr-2" /> Ban user
                                    </DropdownMenuItem>
                                  )}
                                  {onDeleteUser && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        disabled={actionLoading}
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => setConfirmAction({ type: "delete", userId: user.id, userName: user.display_name || user.username })}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" /> Xóa tài khoản vĩnh viễn
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={10} className="p-4">
                              <UserDetailPanel user={user} />
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredUsers.length}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "ban" && "Xác nhận Ban User"}
              {confirmAction?.type === "unban" && "Xác nhận Unban User"}
              {confirmAction?.type === "freeze" && "Xác nhận Treo Thưởng"}
              {confirmAction?.type === "wipe" && "Xác nhận Xóa Tất Cả Phần Thưởng"}
              {confirmAction?.type === "delete" && "🗑️ Xóa Vĩnh Viễn Tài Khoản"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "ban" && `Bạn có chắc muốn ban "${confirmAction.userName}"? User sẽ không thể truy cập nền tảng.`}
              {confirmAction?.type === "unban" && `Bạn có chắc muốn unban "${confirmAction?.userName}"?`}
              {confirmAction?.type === "freeze" && `Treo thưởng sẽ đặt pending rewards của "${confirmAction?.userName}" về 0.`}
              {confirmAction?.type === "wipe" && `Hành động này sẽ XÓA TẤT CẢ phần thưởng (total, pending, approved) của "${confirmAction?.userName}". Không thể hoàn tác!`}
              {confirmAction?.type === "delete" && `⚠️ CẢNH BÁO: Tất cả dữ liệu của "${confirmAction?.userName}" sẽ bị XÓA VĨNH VIỄN (videos, comments, rewards, wallet...). Email sẽ được giải phóng. KHÔNG THỂ HOÀN TÁC!`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction?.type === "wipe" || confirmAction?.type === "ban" || confirmAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ─── User Detail Panel (Collapsible) ─── */
function UserDetailPanel({ user }: { user: AdminUser }) {
  const rewardBreakdown = [
    { label: "Xem video", value: user.view_rewards || 0, icon: "👁" },
    { label: "Like", value: user.like_rewards || 0, icon: "👍" },
    { label: "Comment", value: user.comment_rewards || 0, icon: "💬" },
    { label: "Share", value: user.share_rewards || 0, icon: "🔗" },
    { label: "Upload", value: user.upload_rewards || 0, icon: "📤" },
    { label: "Đăng ký", value: user.signup_rewards || 0, icon: "🎁" },
    { label: "Bounty", value: user.bounty_rewards || 0, icon: "🏆" },
    { label: "Manual", value: user.manual_rewards || 0, icon: "✍️" },
  ];

  const total = user.total_camly_rewards || 0;
  const pending = user.pending_rewards || 0;
  const approved = user.approved_reward || 0;
  const claimed = Math.max(0, total - pending - approved);

  const segments = total > 0 ? [
    { pct: (claimed / total) * 100, color: "bg-green-500", label: `Đã nhận: ${claimed.toLocaleString()}` },
    { pct: (approved / total) * 100, color: "bg-blue-500", label: `Có thể claim: ${approved.toLocaleString()}` },
    { pct: (pending / total) * 100, color: "bg-amber-500", label: `Chờ duyệt: ${pending.toLocaleString()}` },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tổng CAMLY: {total.toLocaleString()}</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
            {segments.map((s, i) => (
              <div key={i} className={`${s.color} h-full transition-all`} style={{ width: `${s.pct}%` }} title={s.label} />
            ))}
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap">
            {segments.map((s, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${s.color}`} /> {s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reward breakdown grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {rewardBreakdown.map((r) => (
          <div key={r.label} className="bg-background rounded-lg p-2 text-center border">
            <div className="text-lg">{r.icon}</div>
            <div className="text-xs text-muted-foreground">{r.label}</div>
            <div className="font-semibold text-sm">{r.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Extra info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Ví:</span>
          <div className="font-mono truncate">{user.wallet_address || "Chưa kết nối"}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Tham gia:</span>
          <div>{new Date(user.created_at).toLocaleDateString("vi-VN")}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Donations gửi:</span>
          <div>{user.donations_sent_count || 0} ({(user.donations_sent_total || 0).toLocaleString()})</div>
        </div>
        <div>
          <span className="text-muted-foreground">Donations nhận:</span>
          <div>{user.donations_received_count || 0} ({(user.donations_received_total || 0).toLocaleString()})</div>
        </div>
        <div>
          <span className="text-muted-foreground">Mint requests:</span>
          <div>{user.mint_requests_count || 0}</div>
        </div>
        <div>
          <span className="text-muted-foreground">FUN đã mint:</span>
          <div>{(user.minted_fun_total || 0).toLocaleString()}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Bài viết:</span>
          <div>{user.posts_count || 0}</div>
        </div>
      </div>
    </div>
  );
}

export default AllUsersTab;
