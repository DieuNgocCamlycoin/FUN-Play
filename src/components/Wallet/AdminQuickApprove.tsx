import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
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

export const AdminQuickApprove = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
      if (data) fetchPendingStats();
      else setLoading(false);
    };

    checkAdmin();
  }, [user?.id]);

  const fetchPendingStats = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, pending_rewards")
        .gt("pending_rewards", 0);

      if (error) throw error;

      setPendingCount(data?.length || 0);
      setPendingTotal(
        data?.reduce((sum, p) => sum + Number(p.pending_rewards || 0), 0) || 0
      );
    } catch (err) {
      console.error("Error fetching pending stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (!user?.id) return;
    setApproving(true);
    try {
      const { data, error } = await supabase.rpc("bulk_approve_all_rewards", {
        p_admin_id: user.id,
      });

      if (error) throw error;

      const result = data as { affected_users: number; total_amount: number };
      toast({
        title: "✅ Đã duyệt tất cả!",
        description: `${result.affected_users} người dùng, tổng ${Number(result.total_amount).toLocaleString()} CAMLY`,
      });

      await fetchPendingStats();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể duyệt",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  if (!isAdmin || loading) return null;

  return (
    <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Admin Quick Actions</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{pendingCount} người chờ duyệt</span>
                {pendingTotal > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {pendingTotal.toLocaleString()} CAMLY
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {pendingCount > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={approving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0"
                >
                  {approving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Duyệt Tất Cả
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận duyệt tất cả?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn sắp duyệt thưởng cho <strong>{pendingCount}</strong> người dùng
                    với tổng cộng <strong>{pendingTotal.toLocaleString()} CAMLY</strong>.
                    Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkApprove}>
                    Xác nhận duyệt
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
              Không có pending
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
