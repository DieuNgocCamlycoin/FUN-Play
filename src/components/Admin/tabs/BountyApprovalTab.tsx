import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Bug, Lightbulb, FileText, Languages, HelpCircle,
  Search, Gift, Clock, CheckCircle, XCircle, Award,
  AlertTriangle, Coins, Users, TrendingUp, MessageSquare, Sparkles,
  ChevronUp, ExternalLink, ImageIcon,
} from "lucide-react";
import { format } from "date-fns";

const CATEGORIES: Record<string, { label: string; icon: typeof Bug; color: string }> = {
  idea: { label: "Ý tưởng", icon: Lightbulb, color: "text-yellow-500" },
  bug: { label: "Báo lỗi", icon: Bug, color: "text-red-500" },
  feedback: { label: "Phản hồi", icon: MessageSquare, color: "text-blue-500" },
  feature: { label: "Tính năng", icon: Sparkles, color: "text-purple-500" },
  // Legacy categories
  bug_report: { label: "Báo Lỗi", icon: Bug, color: "text-red-500" },
  feature_request: { label: "Đề Xuất", icon: Lightbulb, color: "text-yellow-500" },
  content: { label: "Nội Dung", icon: FileText, color: "text-blue-500" },
  translation: { label: "Dịch Thuật", icon: Languages, color: "text-green-500" },
  other: { label: "Khác", icon: HelpCircle, color: "text-muted-foreground" },
};

export default function BountyApprovalTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [rewardDialog, setRewardDialog] = useState<any>(null);
  const [rewardAmount, setRewardAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");

  // Fetch all submissions (admin)
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["admin-bounty-submissions", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("bounty_submissions")
        .select("*, profiles:user_id(username, display_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["admin-bounty-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bounty_submissions")
        .select("status, reward_amount");
      if (error) throw error;

      const total = data.length;
      const pending = data.filter((s) => s.status === "pending").length;
      const rewarded = data.filter((s) => s.status === "rewarded").length;
      const totalCamly = data
        .filter((s) => s.status === "rewarded")
        .reduce((sum, s) => sum + (s.reward_amount || 0), 0);

      return { total, pending, rewarded, totalCamly };
    },
  });

  // Update submission status
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      const { error } = await supabase
        .from("bounty_submissions")
        .update({
          status,
          admin_note: note || null,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bounty-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bounty-stats"] });
    },
  });

  // Reward mutation
  const rewardMutation = useMutation({
    mutationFn: async ({ submission, amount, note }: { submission: any; amount: number; note: string }) => {
      if (!submission.user_id) {
        throw new Error("Submission ẩn danh - không thể tự động thưởng. Gửi thủ công qua contact_info.");
      }

      // 1. Update submission
      const { error: subError } = await supabase
        .from("bounty_submissions")
        .update({
          status: "rewarded",
          reward_amount: amount,
          admin_note: note || null,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", submission.id);
      if (subError) throw subError;

      // 2. Get current profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("total_camly_rewards, pending_rewards")
        .eq("id", submission.user_id)
        .single();
      if (profileError) throw profileError;

      // 3. Update profile rewards
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          total_camly_rewards: (profile.total_camly_rewards || 0) + amount,
          pending_rewards: (profile.pending_rewards || 0) + amount,
        })
        .eq("id", submission.user_id);
      if (updateError) throw updateError;

      // 4. Insert reward transaction
      const { error: txError } = await supabase
        .from("reward_transactions")
        .insert({
          user_id: submission.user_id,
          amount,
          reward_type: "BOUNTY",
          status: "success",
          approved: false,
          tx_hash: `BOUNTY_${Date.now()}_${submission.id.slice(0, 8)}`,
        });
      if (txError) throw txError;
    },
    onSuccess: () => {
      toast({ title: "Thưởng thành công! 🎉", description: `Đã thưởng ${rewardAmount} CAMLY` });
      setRewardDialog(null);
      setRewardAmount("");
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-bounty-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bounty-stats"] });
    },
    onError: (err: any) => {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    },
  });

  const handleApprove = (sub: any) => {
    updateMutation.mutate({ id: sub.id, status: "approved" });
    toast({ title: "Đã duyệt", description: sub.title });
  };

  const handleReject = (sub: any) => {
    updateMutation.mutate({ id: sub.id, status: "rejected" });
    toast({ title: "Đã từ chối", description: sub.title });
  };

  const handleReward = () => {
    const amount = parseFloat(rewardAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Số lượng không hợp lệ", variant: "destructive" });
      return;
    }
    rewardMutation.mutate({ submission: rewardDialog, amount, note: adminNote });
  };

  const filtered = submissions.filter((s: any) =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Tổng submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Đang chờ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.rewarded || 0}</p>
            <p className="text-xs text-muted-foreground">Đã thưởng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Coins className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.totalCamly?.toFixed(1) || 0}</p>
            <p className="text-xs text-muted-foreground">CAMLY đã thưởng</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
            <SelectItem value="rewarded">Đã thưởng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Không có submissions nào.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub: any) => {
            const typeKey = sub.contribution_type || sub.category;
            const catInfo = CATEGORIES[typeKey] || CATEGORIES.other;
            const CatIcon = catInfo.icon;
            const profileData = sub.profiles;

            return (
              <Card key={sub.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* User info */}
                      <div className="flex items-center gap-2 mb-2">
                        {profileData?.avatar_url ? (
                          <img src={profileData.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {profileData?.username?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="text-sm font-medium">
                          {sub.name || profileData?.display_name || profileData?.username || "Ẩn danh"}
                        </span>
                        {sub.upvote_count > 0 && (
                          <Badge variant="outline" className="gap-1 text-xs ml-auto">
                            <ChevronUp className="w-3 h-3" />
                            {sub.upvote_count}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          · {format(new Date(sub.created_at), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <CatIcon className={`w-3 h-3 ${catInfo.color}`} />
                          {catInfo.label}
                        </Badge>
                        <Badge
                          variant={sub.status === "rewarded" ? "default" : sub.status === "rejected" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {sub.status}
                        </Badge>
                        {sub.reward_amount > 0 && (
                          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                            🪙 {sub.reward_amount} CAMLY
                          </Badge>
                        )}
                        {!sub.user_id && (
                          <Badge variant="outline" className="text-orange-500 border-orange-500/30 gap-1 text-xs">
                            <AlertTriangle className="w-3 h-3" /> Ẩn danh
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold">{sub.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{sub.description}</p>

                      {sub.image_url && (
                        <a
                          href={sub.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                        >
                          <ImageIcon className="w-3 h-3" /> Xem ảnh đính kèm
                        </a>
                      )}

                      {sub.admin_note && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">💬 {sub.admin_note}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions - only for pending/approved */}
                  {(sub.status === "pending" || sub.status === "approved") && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {sub.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleApprove(sub)} disabled={updateMutation.isPending}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReject(sub)} disabled={updateMutation.isPending}>
                            <XCircle className="w-4 h-4 mr-1" /> Từ chối
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white ml-auto"
                        onClick={() => {
                          setRewardDialog(sub);
                          setRewardAmount("");
                          setAdminNote("");
                        }}
                      >
                        <Gift className="w-4 h-4 mr-1" /> Thưởng CAMLY
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reward Dialog */}
      <Dialog open={!!rewardDialog} onOpenChange={() => setRewardDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-500" />
              Thưởng CAMLY cho đóng góp
            </DialogTitle>
          </DialogHeader>

          {rewardDialog && !rewardDialog.user_id && (
            <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded border border-orange-500/30 text-sm">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
              <span>Submission ẩn danh! Không thể tự động thưởng. Liên hệ qua: {rewardDialog.contact_info || "N/A"}</span>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Tiêu đề</label>
              <p className="text-sm bg-muted p-2 rounded">{rewardDialog?.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Số CAMLY thưởng</label>
              <Input
                type="number"
                placeholder="VD: 100"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ghi chú (tùy chọn)</label>
              <Textarea
                placeholder="Cảm ơn đóng góp..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialog(null)}>Hủy</Button>
            <Button
              onClick={handleReward}
              disabled={rewardMutation.isPending || !rewardAmount || (rewardDialog && !rewardDialog.user_id)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
            >
              {rewardMutation.isPending ? "Đang xử lý..." : `Thưởng ${rewardAmount || 0} CAMLY`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
