import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Bug, Lightbulb, FileText, Languages, HelpCircle, Send, Gift, Clock, CheckCircle, XCircle, Award } from "lucide-react";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";

const BOUNTY_CATEGORIES = [
  { value: "bug_report", label: "Báo Lỗi", icon: Bug, color: "text-red-500" },
  { value: "feature_request", label: "Đề Xuất Tính Năng", icon: Lightbulb, color: "text-yellow-500" },
  { value: "content", label: "Đóng Góp Nội Dung", icon: FileText, color: "text-blue-500" },
  { value: "translation", label: "Dịch Thuật", icon: Languages, color: "text-green-500" },
  { value: "other", label: "Khác", icon: HelpCircle, color: "text-muted-foreground" },
];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Đang chờ", icon: Clock, variant: "secondary" },
  approved: { label: "Đã duyệt", icon: CheckCircle, variant: "default" },
  rejected: { label: "Từ chối", icon: XCircle, variant: "destructive" },
  rewarded: { label: "Đã thưởng", icon: Award, variant: "default" },
};

export default function Bounty() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("bug_report");

  // Fetch user's submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["bounty-submissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bounty_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("bounty_submissions").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Gửi thành công! 🎉", description: "Đóng góp của bạn đã được ghi nhận. Admin sẽ xem xét sớm." });
      setTitle("");
      setDescription("");
      setCategory("bug_report");
      queryClient.invalidateQueries({ queryKey: ["bounty-submissions"] });
    },
    onError: (err: any) => {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      toast({ title: "Vui lòng điền đầy đủ", description: "Tiêu đề và mô tả không được bỏ trống.", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const getCategoryInfo = (cat: string) => BOUNTY_CATEGORIES.find((c) => c.value === cat) || BOUNTY_CATEGORIES[4];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
            Build & Bounty 🏗️
          </h1>
          <p className="text-muted-foreground mt-1">
            Đóng góp cho FUN Play và nhận thưởng CAMLY! Báo lỗi, đề xuất tính năng, dịch thuật, và nhiều hơn nữa.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {BOUNTY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card
                key={cat.value}
                className={`cursor-pointer transition-all hover:scale-105 ${category === cat.value ? "ring-2 ring-primary border-primary" : ""}`}
                onClick={() => setCategory(cat.value)}
              >
                <CardContent className="p-3 text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-1 ${cat.color}`} />
                  <p className="text-xs font-medium">{cat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="w-5 h-5 text-primary" />
              Gửi Đóng Góp Mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tiêu đề</label>
              <Input
                placeholder="VD: Phát hiện lỗi khi upload video..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mô tả chi tiết</label>
              <Textarea
                placeholder="Mô tả chi tiết đóng góp của bạn... Càng chi tiết càng dễ được duyệt thưởng!"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Danh mục</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOUNTY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending || !title.trim() || !description.trim()}
              className="w-full bg-gradient-to-r from-primary to-primary/80"
            >
              {submitMutation.isPending ? "Đang gửi..." : "Gửi Đóng Góp"}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Past Submissions */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Đóng góp của bạn ({submissions.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : submissions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Bạn chưa có đóng góp nào. Hãy bắt đầu ngay! 🚀
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub: any) => {
                const catInfo = getCategoryInfo(sub.category);
                const statusInfo = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusInfo.icon;
                const CatIcon = catInfo.icon;

                return (
                  <Card key={sub.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="gap-1 text-xs">
                              <CatIcon className={`w-3 h-3 ${catInfo.color}`} />
                              {catInfo.label}
                            </Badge>
                            <Badge variant={statusInfo.variant} className="gap-1 text-xs">
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </Badge>
                            {sub.reward_amount > 0 && (
                              <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1 text-xs">
                                🪙 {sub.reward_amount} CAMLY
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold truncate">{sub.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{sub.description}</p>
                          {sub.admin_note && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded text-muted-foreground">
                              💬 Admin: {sub.admin_note}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(sub.created_at), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
