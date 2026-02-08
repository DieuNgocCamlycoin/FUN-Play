import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Download, FileSpreadsheet } from "lucide-react";
import { AdminUser } from "@/hooks/useAdminManage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface AllUsersTabProps {
  users: AdminUser[];
}

const AllUsersTab = ({ users }: AllUsersTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.id.includes(term) ||
        u.wallet_address?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const exportCSV = () => {
    const headers = [
      "ID",
      "Tên đăng nhập",
      "Tên hiển thị",
      "Tổng CAMLY",
      "Chờ duyệt",
      "Đã duyệt",
      "Video",
      "Bình luận",
      "Ví",
      "Bị cấm",
    ];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.username,
      u.display_name || "",
      u.total_camly_rewards,
      u.pending_rewards || 0,
      u.approved_reward || 0,
      u.videos_count || 0,
      u.comments_count || 0,
      u.wallet_address || "",
      u.banned ? "Yes" : "No",
    ]);

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

  const getStatusBadge = (user: AdminUser) => {
    if (user.banned) return <Badge variant="destructive">Banned</Badge>;
    if (user.avatar_verified) return <Badge className="bg-green-500">Verified</Badge>;
    return <Badge variant="outline">Normal</Badge>;
  };

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

        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV
        </Button>
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
            <Users className="w-5 h-5" />
            Tất cả Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Tổng CAMLY</TableHead>
                  <TableHead className="text-right">Chờ</TableHead>
                  <TableHead className="text-right">Trong ví</TableHead>
                  <TableHead className="text-center">Videos</TableHead>
                  <TableHead className="text-center">BL</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.slice(0, 100).map((user) => (
                  <TableRow key={user.id} className={user.banned ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {(user.display_name || user.username)?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[120px]">
                            {user.display_name || user.username}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {(user.total_camly_rewards || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(user.pending_rewards || 0) > 0 ? (
                        <Badge variant="outline" className="text-amber-500">
                          {(user.pending_rewards || 0).toLocaleString()}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {(user.approved_reward || 0) > 0 ? (
                        <Badge className="bg-green-500">
                          {(user.approved_reward || 0).toLocaleString()}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{user.videos_count || 0}</TableCell>
                    <TableCell className="text-center">{user.comments_count || 0}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length > 100 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Đang hiển thị 100/{filteredUsers.length} users. Sử dụng tìm kiếm để lọc.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllUsersTab;
