import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminVideoStats, formatFileSize, formatDuration } from "@/hooks/useAdminVideoStats";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Video,
  HardDrive,
  Upload,
  Users,
  Search,
  Calendar,
  ArrowLeft,
  Eye,
  ExternalLink,
  Download,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Navigate } from "react-router-dom";

const AdminVideoStats = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { videos, dailyStats, summary, totalCount, loading, totalPages } = useAdminVideoStats(
    debouncedSearch,
    dateFrom,
    dateTo,
    currentPage,
    pageSize
  );

  // Check admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(data === true);
      setCheckingRole(false);
    };
    checkAdminRole();
  }, [user]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Title", "Uploader", "File Size", "Duration", "Views", "Category", "Upload Date"];
    const rows = videos.map((v) => [
      v.title,
      v.uploader.displayName || v.uploader.username,
      formatFileSize(v.fileSize),
      formatDuration(v.duration),
      v.viewCount,
      v.category || "N/A",
      format(new Date(v.createdAt), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `video-stats-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <ShieldX className="w-16 h-16 mx-auto text-destructive mb-4" />
          <p className="text-lg font-semibold">Truy cập bị từ chối</p>
          <p className="text-muted-foreground mt-2">Bạn không có quyền truy cập trang này</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Về trang chủ
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
                📊 Thống Kê Video Uploads
              </h1>
              <p className="text-muted-foreground mt-1">Quản lý và theo dõi tất cả video được tải lên</p>
            </div>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Xuất CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#7A2BFF]/10 to-[#7A2BFF]/5 border-[#7A2BFF]/30">
            <CardContent className="p-4 text-center">
              <Video className="w-8 h-8 mx-auto text-[#7A2BFF] mb-2" />
              <div className="text-2xl font-bold">{summary.totalVideos.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Tổng số video</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#00E7FF]/10 to-[#00E7FF]/5 border-[#00E7FF]/30">
            <CardContent className="p-4 text-center">
              <Upload className="w-8 h-8 mx-auto text-[#00E7FF] mb-2" />
              <div className="text-2xl font-bold">{summary.todayUploads.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Hôm nay</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#FF00E5]/10 to-[#FF00E5]/5 border-[#FF00E5]/30">
            <CardContent className="p-4 text-center">
              <HardDrive className="w-8 h-8 mx-auto text-[#FF00E5] mb-2" />
              <div className="text-2xl font-bold">{formatFileSize(summary.totalFileSize)}</div>
              <div className="text-xs text-muted-foreground">Tổng dung lượng</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#00FF7F]/10 to-[#00FF7F]/5 border-[#00FF7F]/30">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-[#00FF7F] mb-2" />
              <div className="text-2xl font-bold">{summary.totalUploaders.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Người tải lên</div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Uploads Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Uploads theo ngày (30 ngày gần nhất)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "dd/MM")}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy", { locale: vi })}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "uploadCount") return [value, "Số video"];
                        if (name === "uniqueUploaders") return [value, "Người upload"];
                        return [value, name];
                      }}
                    />
                    <Bar
                      dataKey="uploadCount"
                      fill="#7A2BFF"
                      radius={[4, 4, 0, 0]}
                      name="uploadCount"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề video..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom || ""}
                  onChange={(e) => {
                    setDateFrom(e.target.value || null);
                    setCurrentPage(1);
                  }}
                  className="w-36"
                  placeholder="Từ ngày"
                />
                <Input
                  type="date"
                  value={dateTo || ""}
                  onChange={(e) => {
                    setDateTo(e.target.value || null);
                    setCurrentPage(1);
                  }}
                  className="w-36"
                  placeholder="Đến ngày"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Danh sách Video ({totalCount.toLocaleString()} video)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy video nào</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Thumbnail</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Người tải</TableHead>
                        <TableHead>Dung lượng</TableHead>
                        <TableHead>Thời lượng</TableHead>
                        <TableHead>Lượt xem</TableHead>
                        <TableHead>Ngày tải</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videos.map((video) => (
                        <TableRow key={video.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="w-16 h-10 rounded overflow-hidden bg-muted">
                              {video.thumbnailUrl ? (
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="font-medium truncate" title={video.title}>
                                {video.title}
                              </p>
                              {video.category && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {video.category}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={video.uploader.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(video.uploader.displayName || video.uploader.username)?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate max-w-[100px]">
                                {video.uploader.displayName || video.uploader.username}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono">
                              {formatFileSize(video.fileSize)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <Clock className="w-3 h-3" />
                              {formatDuration(video.duration)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <Eye className="w-3 h-3" />
                              {video.viewCount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(video.createdAt), "dd/MM/yyyy")}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(video.createdAt), "HH:mm")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/watch/${video.id}`)}
                              title="Xem video"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Trang {currentPage} / {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Sau
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminVideoStats;
