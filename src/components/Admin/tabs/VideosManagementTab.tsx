import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Video, Clock, CheckCircle, XCircle, Eye, Search, Download, 
  HardDrive, Upload, Users, ExternalLink, Play, User, Check, X, Image, CloudUpload, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAdminVideoStats, formatFileSize, formatDuration } from "@/hooks/useAdminVideoStats";
import { getCategoryLabel, getCategoryIcon } from "@/lib/videoCategories";
import { toast } from "sonner";
import VideoMigrationPanel from "../VideoMigrationPanel";
import ThumbnailRegenerationPanel from "../ThumbnailRegenerationPanel";
import BannedVideoCleanupPanel from "../BannedVideoCleanupPanel";

interface VideoForApproval {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  sub_category: string | null;
  approval_status: string | null;
  created_at: string;
  user_id: string;
  channels: { name: string } | null;
  profiles: { display_name: string | null; username: string } | null;
}

export function VideosManagementTab() {
  return (
    <Tabs defaultValue="approval" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 mb-4">
        <TabsTrigger value="approval" className="gap-1 text-xs">
          <Clock className="w-3 h-3" /> Duyệt Video
        </TabsTrigger>
        <TabsTrigger value="stats" className="gap-1 text-xs">
          <Video className="w-3 h-3" /> Thống Kê
        </TabsTrigger>
        <TabsTrigger value="thumbnails" className="gap-1 text-xs">
          <Image className="w-3 h-3" /> Thumbnails
        </TabsTrigger>
        <TabsTrigger value="migration" className="gap-1 text-xs">
          <CloudUpload className="w-3 h-3" /> Migration
        </TabsTrigger>
        <TabsTrigger value="cleanup" className="gap-1 text-xs">
          <Trash2 className="w-3 h-3" /> Cleanup
        </TabsTrigger>
      </TabsList>

      <TabsContent value="approval">
        <VideoApprovalContent />
      </TabsContent>

      <TabsContent value="stats">
        <VideoStatsContent />
      </TabsContent>

      <TabsContent value="thumbnails">
        <ThumbnailRegenerationPanel />
      </TabsContent>

      <TabsContent value="migration">
        <VideoMigrationPanel />
      </TabsContent>

      <TabsContent value="cleanup">
        <BannedVideoCleanupPanel />
      </TabsContent>
    </Tabs>
  );
}

// Video Approval Content
function VideoApprovalContent() {
  const [videos, setVideos] = useState<VideoForApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedVideo, setSelectedVideo] = useState<VideoForApproval | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select(`id, title, description, thumbnail_url, video_url, sub_category, approval_status, created_at, user_id, channels (name)`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.map(v => v.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const videosWithProfiles = data.map(video => ({
        ...video,
        profiles: profilesMap.get(video.user_id) || null,
      }));
      setVideos(videosWithProfiles);
    }
    setLoading(false);
  };

  const handleApprove = async (video: VideoForApproval) => {
    setProcessing(true);
    const { error } = await supabase
      .from("videos")
      .update({ approval_status: "approved" })
      .eq("id", video.id);

    if (!error) {
      toast.success(`Video "${video.title}" đã được duyệt`);
      fetchVideos();
    }
    setProcessing(false);
    setPreviewOpen(false);
  };

  const handleReject = async () => {
    if (!selectedVideo) return;
    setProcessing(true);
    const { error } = await supabase
      .from("videos")
      .update({ 
        approval_status: "rejected",
        description: selectedVideo.description 
          ? `${selectedVideo.description}\n\n[Lý do từ chối: ${rejectReason}]`
          : `[Lý do từ chối: ${rejectReason}]`
      })
      .eq("id", selectedVideo.id);

    if (!error) {
      toast.success(`Video "${selectedVideo.title}" đã bị từ chối`);
      fetchVideos();
    }
    setProcessing(false);
    setRejectDialogOpen(false);
    setPreviewOpen(false);
    setRejectReason("");
  };

  const filteredVideos = videos.filter(v => {
    if (activeTab === "pending") return v.approval_status === "pending";
    if (activeTab === "approved") return v.approval_status === "approved";
    if (activeTab === "rejected") return v.approval_status === "rejected";
    return true;
  });

  const counts = {
    pending: videos.filter(v => v.approval_status === "pending").length,
    approved: videos.filter(v => v.approval_status === "approved").length,
    rejected: videos.filter(v => v.approval_status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{counts.pending}</p>
              <p className="text-sm text-amber-600 dark:text-amber-500">Chờ duyệt</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{counts.approved}</p>
              <p className="text-sm text-green-600 dark:text-green-500">Đã duyệt</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{counts.rejected}</p>
              <p className="text-sm text-red-600 dark:text-red-500">Đã từ chối</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video List Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Chờ duyệt ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Đã duyệt ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="w-4 h-4" />
            Đã từ chối ({counts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredVideos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Không có video nào trong danh sách này
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredVideos.slice(0, 20).map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{video.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{video.profiles?.display_name || video.profiles?.username || "Không xác định"}</span>
                          <span>•</span>
                          <span>{new Date(video.created_at).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedVideo(video); setPreviewOpen(true); }}>
                          <Eye className="w-4 h-4 mr-1" /> Xem
                        </Button>
                        {video.approval_status === "pending" && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(video)} disabled={processing}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setSelectedVideo(video); setRejectDialogOpen(true); }} disabled={processing}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video src={selectedVideo.video_url} controls className="w-full h-full" />
              </div>
              <p className="text-sm text-muted-foreground">{selectedVideo.description || "Không có mô tả"}</p>
              {selectedVideo.approval_status === "pending" && (
                <DialogFooter>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedVideo)} disabled={processing}>
                    <Check className="w-4 h-4 mr-1" /> Duyệt
                  </Button>
                  <Button variant="destructive" onClick={() => { setPreviewOpen(false); setRejectDialogOpen(true); }} disabled={processing}>
                    <X className="w-4 h-4 mr-1" /> Từ chối
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối video</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || processing}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Video Stats Content
function VideoStatsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { videos, dailyStats, summary, totalCount, loading, totalPages } = useAdminVideoStats(
    debouncedSearch, null, null, currentPage, 20
  );

  const handleExportCSV = () => {
    const headers = ["Tiêu đề", "Người tải lên", "Kích thước", "Thời lượng", "Lượt xem", "Thể loại", "Ngày tải lên"];
    const rows = videos.map((v) => [
      v.title,
      v.uploader.displayName || v.uploader.username,
      formatFileSize(v.fileSize),
      formatDuration(v.duration),
      v.viewCount,
      v.category || "Không có",
      format(new Date(v.createdAt), "yyyy-MM-dd HH:mm"),
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `video-stats-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Đã xuất CSV thành công");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[250px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Daily Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uploads theo ngày (30 ngày)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "dd/MM")} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy", { locale: vi })} />
                <Bar dataKey="uploadCount" fill="#7A2BFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Search & Export */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm video..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> CSV
        </Button>
      </div>

      {/* Videos Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Người tải</TableHead>
                <TableHead>Dung lượng</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded bg-muted overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium truncate max-w-[200px]">{video.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={video.uploader.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">{video.uploader.displayName?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate max-w-[100px]">{video.uploader.displayName || video.uploader.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatFileSize(video.fileSize)}</TableCell>
                  <TableCell>{video.viewCount.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{format(new Date(video.createdAt), "dd/MM/yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
