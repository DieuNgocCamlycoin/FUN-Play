import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Video, Users, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";

export function ReportsManagementTab() {
  const { toast } = useToast();
  const [videoReports, setVideoReports] = useState<any[]>([]);
  const [channelReports, setChannelReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const [videoRes, channelRes] = await Promise.all([
      supabase
        .from("video_reports")
        .select("*, videos(title, thumbnail_url, user_id), profiles:reporter_id(username, display_name)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("channel_reports" as any)
        .select("*, channels:channel_id(name, user_id), profiles:reporter_id(username, display_name)")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    setVideoReports(videoRes.data || []);
    setChannelReports((channelRes.data as any[]) || []);
    setLoading(false);
  };

  const updateVideoReportStatus = async (reportId: string, status: string) => {
    const { error } = await supabase
      .from("video_reports")
      .update({ status })
      .eq("id", reportId);

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Đã cập nhật trạng thái báo cáo" });
      fetchReports();
    }
  };

  const updateChannelReportStatus = async (reportId: string, status: string) => {
    const { error } = await supabase
      .from("channel_reports" as any)
      .update({ status } as any)
      .eq("id", reportId);

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Đã cập nhật trạng thái báo cáo" });
      fetchReports();
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Đang chờ", variant: "secondary" },
      reviewed: { label: "Đã xem xét", variant: "default" },
      dismissed: { label: "Đã bỏ qua", variant: "outline" },
      resolved: { label: "Đã xử lý", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const pendingVideoCount = videoReports.filter(r => r.status === "pending").length;
  const pendingChannelCount = channelReports.filter((r: any) => r.status === "pending").length;

  return (
    <div>
      <Tabs defaultValue="videos">
        <TabsList className="mb-4">
          <TabsTrigger value="videos" className="gap-2">
            <Video className="w-4 h-4" />
            Video bị báo cáo {pendingVideoCount > 0 && `(${pendingVideoCount})`}
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2">
            <Users className="w-4 h-4" />
            Kênh bị báo cáo {pendingChannelCount > 0 && `(${pendingChannelCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : videoReports.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Chưa có báo cáo video nào</Card>
          ) : (
            <div className="space-y-3">
              {videoReports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {statusBadge(report.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(report.created_at), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="font-medium text-foreground truncate">
                        Video: {(report as any).videos?.title || "Đã xóa"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Người báo cáo: {(report as any).profiles?.display_name || (report as any).profiles?.username || report.reporter_id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">Lý do: <span className="text-foreground">{report.reason}</span></p>
                      {report.detail && <p className="text-sm text-muted-foreground mt-1">Chi tiết: {report.detail}</p>}
                    </div>
                    {report.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => updateVideoReportStatus(report.id, "reviewed")}>
                          <Eye className="w-3 h-3 mr-1" /> Xem xét
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateVideoReportStatus(report.id, "dismissed")}>
                          <XCircle className="w-3 h-3 mr-1" /> Bỏ qua
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateVideoReportStatus(report.id, "resolved")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Xử lý
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="channels">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : channelReports.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Chưa có báo cáo kênh nào</Card>
          ) : (
            <div className="space-y-3">
              {channelReports.map((report: any) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {statusBadge(report.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(report.created_at), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="font-medium text-foreground truncate">
                        Kênh: {report.channels?.name || report.channel_id?.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Người báo cáo: {report.profiles?.display_name || report.profiles?.username || report.reporter_id?.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">Lý do: <span className="text-foreground">{report.reason}</span></p>
                      {report.detail && <p className="text-sm text-muted-foreground mt-1">Chi tiết: {report.detail}</p>}
                    </div>
                    {report.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => updateChannelReportStatus(report.id, "reviewed")}>
                          <Eye className="w-3 h-3 mr-1" /> Xem xét
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateChannelReportStatus(report.id, "dismissed")}>
                          <XCircle className="w-3 h-3 mr-1" /> Bỏ qua
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateChannelReportStatus(report.id, "resolved")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Xử lý
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
