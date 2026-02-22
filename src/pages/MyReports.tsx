import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { Video, Users, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Đang chờ", variant: "secondary" },
  reviewed: { label: "Đã xem xét", variant: "default" },
  dismissed: { label: "Đã bỏ qua", variant: "outline" },
  resolved: { label: "Đã xử lý", variant: "destructive" },
};

export default function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videoReports, setVideoReports] = useState<any[]>([]);
  const [channelReports, setChannelReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);

    const [videoRes, channelRes] = await Promise.all([
      supabase
        .from("video_reports")
        .select("*, videos(title, thumbnail_url)")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("channel_reports" as any)
        .select("*")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setVideoReports(videoRes.data || []);
    setChannelReports((channelRes.data as any[]) || []);
    setLoading(false);
  };

  const renderStatus = (status: string) => {
    const s = statusLabels[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold text-foreground">Báo cáo của tôi</h1>
        </div>

        <Tabs defaultValue="videos">
          <TabsList className="mb-4">
            <TabsTrigger value="videos" className="gap-2">
              <Video className="w-4 h-4" />
              Video đã báo cáo ({videoReports.length})
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2">
              <Users className="w-4 h-4" />
              Kênh đã báo cáo ({channelReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : videoReports.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Bạn chưa báo cáo video nào</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {videoReports.map((report) => (
                  <Card key={report.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {(report as any).videos?.title || "Video đã bị xóa"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Lý do: <span className="text-foreground">{report.reason}</span>
                        </p>
                        {report.detail && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Chi tiết: {report.detail}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(report.created_at), "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                      {renderStatus(report.status)}
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
              <Card className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Bạn chưa báo cáo kênh nào</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {channelReports.map((report: any) => (
                  <Card key={report.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          Kênh ID: {report.channel_id?.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Lý do: <span className="text-foreground">{report.reason}</span>
                        </p>
                        {report.detail && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Chi tiết: {report.detail}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(report.created_at), "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                      {renderStatus(report.status)}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
