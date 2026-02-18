import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Gift, Check, X, Search, Calendar, CheckCheck, Loader2 } from "lucide-react";
import { AdminUser } from "@/hooks/useAdminManage";
import { toast } from "sonner";
import { format } from "date-fns";

interface RewardApprovalTabProps {
  users: AdminUser[];
  onApprove: (userId: string) => Promise<boolean>;
  onReject: (userId: string) => Promise<boolean>;
  onBulkApproveAll: () => Promise<{ affected_users: number; total_amount: number } | null>;
  loading: boolean;
}

const RewardApprovalTab = ({ users, onApprove, onReject, onBulkApproveAll, loading }: RewardApprovalTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [bulkLoading, setBulkLoading] = useState(false);

  const pendingUsers = users.filter((u) => (u.pending_rewards || 0) > 0);

  const filteredUsers = pendingUsers.filter((u) => {
    const matchSearch =
      u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.includes(searchTerm);
    return matchSearch;
  });

  const totalPending = pendingUsers.reduce((sum, u) => sum + (u.pending_rewards || 0), 0);

  const handleApprove = async (userId: string, name: string) => {
    const success = await onApprove(userId);
    if (success) {
      toast.success(`Đã duyệt thưởng cho ${name}`);
    } else {
      toast.error("Lỗi khi duyệt thưởng");
    }
  };

  const handleReject = async (userId: string, name: string) => {
    const success = await onReject(userId);
    if (success) {
      toast.success(`Đã từ chối thưởng của ${name}`);
    } else {
      toast.error("Lỗi khi từ chối thưởng");
    }
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    const result = await onBulkApproveAll();
    setBulkLoading(false);
    if (result) {
      toast.success(
        `✅ Đã duyệt ${result.affected_users} users, tổng ${result.total_amount.toLocaleString()} CAMLY`
      );
    } else {
      toast.error("Lỗi khi duyệt hàng loạt");
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Approve Button */}
      {pendingUsers.length > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 text-base gap-2"
              disabled={loading || bulkLoading}
            >
              {bulkLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCheck className="w-5 h-5" />
              )}
              Duyệt Tất Cả ({pendingUsers.length} users • {totalPending.toLocaleString()} CAMLY)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận duyệt tất cả?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Bạn sắp duyệt thưởng cho <strong>{pendingUsers.length} users</strong> với tổng số <strong>{totalPending.toLocaleString()} CAMLY</strong>.</p>
                <p>Sau khi duyệt, users có thể claim CAMLY vào ví của họ.</p>
                <p className="text-amber-500 font-medium">⚠️ Hành động này không thể hoàn tác!</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkApprove}
                className="bg-green-500 hover:bg-green-600"
              >
                Xác nhận duyệt tất cả
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, username hoặc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{pendingUsers.length}</div>
            <div className="text-xs text-muted-foreground">Chờ duyệt</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {totalPending.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Tổng CAMLY chờ</div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            Danh sách chờ duyệt ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <a href={`https://official-funplay.lovable.app/${user.username}`} target="_blank" rel="noopener noreferrer">
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{(user.display_name || user.username)?.[0]}</AvatarFallback>
                  </Avatar>
                </a>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm sm:text-base">{user.display_name || user.username}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.videos_count || 0} videos • {user.comments_count || 0} comments
                  </div>
                  <Badge variant="outline" className="text-amber-500 border-amber-500 mt-1 text-xs">
                    {(user.pending_rewards || 0).toLocaleString()} CAMLY
                  </Badge>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-500 hover:text-green-600 hover:bg-green-500/10 h-9 w-9 p-0"
                    onClick={() => handleApprove(user.id, user.display_name || user.username)}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-9 w-9 p-0"
                    onClick={() => handleReject(user.id, user.display_name || user.username)}
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Không có user nào chờ duyệt
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardApprovalTab;
