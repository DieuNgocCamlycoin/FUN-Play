import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Ban, Search, UserCheck, Calendar } from "lucide-react";
import { AdminUser } from "@/hooks/useAdminManage";
import { toast } from "sonner";
import { getProfileUrl } from "@/lib/adminUtils";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminPagination, PAGE_SIZE, paginate } from "@/components/Admin/AdminPagination";

interface BannedUsersTabProps {
  users: AdminUser[];
  onUnban: (userId: string) => Promise<boolean>;
  loading: boolean;
}

const BannedUsersTab = ({ users, onUnban, loading }: BannedUsersTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

  const bannedUsers = useMemo(() => users.filter((u) => u.banned), [users]);

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch.trim()) return bannedUsers;
    const term = debouncedSearch.toLowerCase();
    return bannedUsers.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.ban_reason?.toLowerCase().includes(term)
    );
  }, [bannedUsers, debouncedSearch]);

  const { paged, totalPages } = paginate(filteredUsers, currentPage);

  const handleUnban = async (user: AdminUser) => {
    const success = await onUnban(user.id);
    if (success) toast.success(`Đã mở khóa ${user.display_name || user.username}`);
    else toast.error("Lỗi khi mở khóa user");
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
        <CardContent className="p-4 flex items-center gap-4">
          <Ban className="w-10 h-10 text-red-500" />
          <div>
            <div className="text-3xl font-bold text-red-500">{bannedUsers.length}</div>
            <div className="text-xs text-muted-foreground">Users đã bị ban</div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Tìm theo tên hoặc lý do ban..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            Danh sách đã ban ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paged.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                {(() => {
                  const profileUrl = getProfileUrl(user.username, user.id);
                  return profileUrl ? (
                    <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                      <Avatar className="w-12 h-12 opacity-60 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                      </Avatar>
                    </a>
                  ) : (
                    <Avatar className="w-12 h-12 opacity-50">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                    </Avatar>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate line-through opacity-70">{user.display_name || user.username}</div>
                  <div className="text-xs text-red-400 mt-1">{user.ban_reason || "Lạm dụng hệ thống"}</div>
                  {user.banned_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(user.banned_at), "dd/MM/yyyy HH:mm")}
                    </div>
                  )}
                </div>
                <Badge variant="destructive">Level {user.violation_level || 3}</Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1" disabled={loading}>
                      <UserCheck className="w-4 h-4" />Unban
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mở khóa user này?</AlertDialogTitle>
                      <AlertDialogDescription>
                        User: {user.display_name || user.username}<br />
                        Lý do ban: {user.ban_reason || "Lạm dụng hệ thống"}<br /><br />
                        Hành động này sẽ:<br />• Bỏ trạng thái banned<br />• Xóa khỏi reward_bans<br />• Xóa ví khỏi blacklist
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleUnban(user)}>Xác nhận Unban</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Không có user bị ban</div>
            )}
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
    </div>
  );
};

export default BannedUsersTab;
