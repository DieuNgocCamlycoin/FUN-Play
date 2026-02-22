import { useState, useEffect } from "react";
import { Shield, Ban, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminChannelActionsProps {
  targetUserId: string;
  targetUsername: string;
  targetDisplayName: string | null;
}

export const AdminChannelActions = ({
  targetUserId,
  targetUsername,
  targetDisplayName,
}: AdminChannelActionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    // Don't show on own profile
    if (user.id === targetUserId) {
      setLoading(false);
      return;
    }
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      const { data: ownerData } = await supabase.rpc("is_owner", {
        _user_id: user.id,
      });
      setIsAdmin(data === true || ownerData === true);
      setLoading(false);
    };
    checkAdmin();
  }, [user, targetUserId]);

  if (loading || !isAdmin) return null;

  const displayLabel = targetDisplayName || targetUsername;

  const handleSuspend = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("ban_user_permanently", {
        p_admin_id: user.id,
        p_user_id: targetUserId,
        p_reason: suspendReason || "Vi phạm quy định nền tảng",
      });
      if (error) throw error;
      toast({
        title: "Đã đình chỉ tài khoản",
        description: `Tài khoản @${targetUsername} đã bị đình chỉ.`,
      });
      setSuspendOpen(false);
      setSuspendReason("");
      // Reload page to reflect banned state
      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể đình chỉ tài khoản",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWarning = async () => {
    if (!user || !warningMessage.trim()) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "warning",
        title: "⚠️ Cảnh báo từ quản trị viên",
        message: warningMessage.trim(),
        actor_id: user.id,
      });
      if (error) throw error;
      toast({
        title: "Đã gửi cảnh báo",
        description: `Cảnh báo đã được gửi đến @${targetUsername}.`,
      });
      setWarningOpen(false);
      setWarningMessage("");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể gửi cảnh báo",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Shield className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setSuspendOpen(true)}
          >
            <Ban className="w-4 h-4 mr-2" />
            Suspend tài khoản
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setWarningOpen(true)}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Gửi cảnh báo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend AlertDialog */}
      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đình chỉ tài khoản @{targetUsername}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản của <strong>{displayLabel}</strong> sẽ bị đình chỉ vĩnh viễn.
              Thưởng sẽ bị xóa, ví sẽ bị đưa vào danh sách đen. Hành động này không thể hoàn tác dễ dàng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Lý do đình chỉ (tùy chọn)..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            className="min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Đang xử lý..." : "Xác nhận đình chỉ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warning Dialog */}
      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi cảnh báo đến @{targetUsername}</DialogTitle>
            <DialogDescription>
              Nội dung cảnh báo sẽ được gửi dưới dạng thông báo đến <strong>{displayLabel}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Nhập nội dung cảnh báo..."
            value={warningMessage}
            onChange={(e) => setWarningMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningOpen(false)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleWarning}
              disabled={actionLoading || !warningMessage.trim()}
            >
              {actionLoading ? "Đang gửi..." : "Gửi cảnh báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
