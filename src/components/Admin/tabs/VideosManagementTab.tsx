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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Video, Clock, CheckCircle, XCircle, Eye, Search, Download, 
  HardDrive, Upload, Users, ExternalLink, Play, User, Check, X, Image, CloudUpload, Trash2,
  AlertTriangle, EyeOff, Loader2, ScanSearch, Shield
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAdminVideoStats, formatFileSize, formatDuration } from "@/hooks/useAdminVideoStats";
import { getCategoryLabel, getCategoryIcon } from "@/lib/videoCategories";
import { BLOCKED_FILENAME_PATTERNS } from "@/lib/videoUploadValidation";
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
        <TabsTrigger value="spam" className="gap-1 text-xs">
          <AlertTriangle className="w-3 h-3" /> Spam Filter
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

      <TabsContent value="spam">
        <SpamFilterContent />
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
    }, 500);
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
                <RechartsTooltip labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy", { locale: vi })} />
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

// Spam Filter Content
function SpamFilterContent() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"short" | "reported" | "repetitive" | "sample">("reported");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [deleteBanOpen, setDeleteBanOpen] = useState(false);
  const [deleteBanLoading, setDeleteBanLoading] = useState(false);
  const [deleteOnlyOpen, setDeleteOnlyOpen] = useState(false);
  const [deleteOnlyLoading, setDeleteOnlyLoading] = useState(false);
  const [userVideoCounts, setUserVideoCounts] = useState<Map<string, { short: number; total: number }>>(new Map());

  useEffect(() => { fetchSpamVideos(); }, [filter]);

  const fetchSpamVideos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("videos")
        .select("id, title, duration, report_count, is_hidden, thumbnail_url, thumbnail_scanned, thumbnail_scan_result, created_at, user_id, channels(name)")
        .order("created_at", { ascending: false });

      if (filter === "short") {
        query = query.not("duration", "is", null).lt("duration", 90);
      } else if (filter === "reported") {
        query = query.gt("report_count", 0).order("report_count", { ascending: false });
      }

      const { data } = await query.limit(filter === "sample" ? 200 : 100);
      
      let finalVideos = data || [];
      if (filter === "sample" && data) {
        finalVideos = data.filter(v => {
          const lowerTitle = v.title.toLowerCase();
          return BLOCKED_FILENAME_PATTERNS.some(pattern => lowerTitle.includes(pattern));
        });
      } else if (filter === "repetitive" && data) {
        const titleCounts = new Map<string, any[]>();
        data.forEach(v => {
          const key = v.title.toLowerCase().trim();
          const arr = titleCounts.get(key) || [];
          arr.push(v);
          titleCounts.set(key, arr);
        });
        finalVideos = Array.from(titleCounts.values())
          .filter(arr => arr.length >= 3)
          .flat();
      }

      // Fetch owner profiles
      const userIds = [...new Set(finalVideos.map(v => v.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        finalVideos = finalVideos.map(v => ({ ...v, profile: profileMap.get(v.user_id) || null }));

        // Fetch video counts per user for tooltip
        const { data: counts } = await supabase
          .from("videos")
          .select("user_id, duration")
          .in("user_id", userIds);
        const countMap = new Map<string, { short: number; total: number }>();
        counts?.forEach(v => {
          const c = countMap.get(v.user_id) || { short: 0, total: 0 };
          c.total++;
          if (v.duration && v.duration < 90) c.short++;
          countMap.set(v.user_id, c);
        });
        setUserVideoCounts(countMap);
      }

      setVideos(finalVideos);
    } catch (err) {
      console.error("Error fetching spam videos:", err);
    }
    setLoading(false);
  };

  const handleBulkHide = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("videos")
      .update({ is_hidden: true, approval_status: 'rejected' })
      .in("id", ids);
    if (!error) {
      toast.success(`Đã ẩn ${ids.length} video`);
      setSelected(new Set());
      fetchSpamVideos();
    } else {
      toast.error("Lỗi khi ẩn video");
    }
  };

  const handleBulkDeleteBan = async () => {
    setDeleteBanLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("bulk_delete_videos_and_ban_users", {
        p_admin_id: user.id,
        p_video_ids: Array.from(selected),
      });
      if (error) throw error;
      const result = data as any;
      toast.success(`Đã xóa ${result.deleted_videos} video và ban ${result.banned_users} users`);
      setSelected(new Set());
      setDeleteBanOpen(false);
      fetchSpamVideos();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa & ban");
    }
    setDeleteBanLoading(false);
  };

  const handleBulkDeleteOnly = async () => {
    setDeleteOnlyLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("bulk_delete_videos_only", {
        p_admin_id: user.id,
        p_video_ids: Array.from(selected),
      });
      if (error) throw error;
      const result = data as any;
      toast.success(`Đã xóa ${result.deleted_videos} video (không ban users)`);
      setSelected(new Set());
      setDeleteOnlyOpen(false);
      fetchSpamVideos();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa video");
    }
    setDeleteOnlyLoading(false);
  };

  const handleQuickBan = async (userId: string, username: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.rpc("ban_user_permanently", {
        p_admin_id: user.id,
        p_user_id: userId,
      });
      if (error) throw error;
      toast.success(`Đã ban user ${username}`);
      fetchSpamVideos();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi ban user");
    }
  };

  const handleScanThumbnails = async () => {
    setScanning(true);
    try {
      const res = await supabase.functions.invoke("scan-thumbnail");
      if (res.error) throw res.error;
      toast.success(`Đã quét ${res.data?.scanned || 0} thumbnails`);
      fetchSpamVideos();
    } catch (err: any) {
      toast.error(err.message || "Lỗi quét thumbnail");
    }
    setScanning(false);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === videos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(videos.map(v => v.id)));
    }
  };

  const selectedUserIds = new Set(videos.filter(v => selected.has(v.id)).map(v => v.user_id));

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Filter buttons & actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={filter === "reported" ? "default" : "outline"} size="sm" onClick={() => setFilter("reported")} className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Bị báo cáo
          </Button>
          <Button variant={filter === "short" ? "default" : "outline"} size="sm" onClick={() => setFilter("short")} className="gap-1">
            <Clock className="w-3 h-3" /> Ngắn (&lt;90s)
          </Button>
          <Button variant={filter === "repetitive" ? "default" : "outline"} size="sm" onClick={() => setFilter("repetitive")} className="gap-1">
            <Video className="w-3 h-3" /> Trùng lặp
          </Button>
          <Button variant={filter === "sample" ? "default" : "outline"} size="sm" onClick={() => setFilter("sample")} className="gap-1">
            <ExternalLink className="w-3 h-3" /> Video Mẫu
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleScanThumbnails} disabled={scanning} className="gap-1">
              {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanSearch className="w-3 h-3" />}
              Scan Thumbnails
            </Button>
            {selected.size > 0 && (
              <>
                <Button variant="destructive" size="sm" onClick={handleBulkHide} className="gap-1">
                  <EyeOff className="w-3 h-3" /> Ẩn {selected.size} video
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setDeleteOnlyOpen(true)} 
                  className="gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Trash2 className="w-3 h-3" /> Xóa {selected.size} video
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setDeleteBanOpen(true)} 
                  className="gap-1 bg-red-700 hover:bg-red-800 text-white"
                >
                  <Shield className="w-3 h-3" /> Xóa & Ban ({selected.size} video, {selectedUserIds.size} users)
                </Button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : videos.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Không tìm thấy video spam nào 🎉</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selected.size === videos.length && videos.length > 0} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Thời lượng</TableHead>
                    <TableHead>Báo cáo</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thumbnail AI</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map(video => {
                    const profile = video.profile;
                    const counts = userVideoCounts.get(video.user_id);
                    return (
                      <TableRow key={video.id} className={video.is_hidden ? "opacity-50" : ""}>
                        <TableCell>
                          <Checkbox checked={selected.has(video.id)} onCheckedChange={() => toggleSelect(video.id)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-10 rounded bg-muted overflow-hidden shrink-0">
                              {video.thumbnail_url ? (
                                <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Video className="w-4 h-4 text-muted-foreground" /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[200px]">{video.title}</p>
                              <p className="text-xs text-muted-foreground">{video.channels?.name || "N/A"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {profile ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-default">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={profile.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">{(profile.display_name || profile.username)?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm truncate max-w-[100px]">{profile.display_name || profile.username}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p>📹 Short (&lt;90s): <strong>{counts?.short || 0}</strong></p>
                                <p>🎬 Tổng video: <strong>{counts?.total || 0}</strong></p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{video.duration ? `${video.duration}s` : "N/A"}</TableCell>
                        <TableCell>
                          {(video.report_count || 0) > 0 ? (
                            <Badge variant="destructive">{video.report_count} báo cáo</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {video.is_hidden ? (
                            <Badge variant="outline" className="text-destructive border-destructive">Đã ẩn</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">Hiện</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">
                          {video.thumbnail_scanned ? (video.thumbnail_scan_result || "OK") : "Chưa quét"}
                        </TableCell>
                        <TableCell>
                          {profile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleQuickBan(video.user_id, profile.display_name || profile.username)}
                              title="Quick Ban"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Delete Only Confirmation Dialog */}
        <AlertDialog open={deleteOnlyOpen} onOpenChange={setDeleteOnlyOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>🗑️ Xóa Video (Không Ban)</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Bạn sắp <strong>xóa vĩnh viễn {selected.size} video</strong>.</p>
                <p>Hành động này sẽ:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Xóa video + likes, comments, rewards liên quan</li>
                  <li>Users sẽ <strong>KHÔNG bị ban</strong></li>
                </ul>
                <p className="text-amber-600 font-medium">⚠️ Không thể hoàn tác!</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteOnlyLoading}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeleteOnly}
                disabled={deleteOnlyLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {deleteOnlyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                Xác nhận Xóa Video
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete & Ban Confirmation Dialog */}
        <AlertDialog open={deleteBanOpen} onOpenChange={setDeleteBanOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Xóa Video & Ban Users</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Bạn sắp <strong>xóa vĩnh viễn {selected.size} video</strong> và <strong>ban {selectedUserIds.size} users</strong>.</p>
                <p>Hành động này sẽ:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Xóa video + likes, comments, rewards liên quan</li>
                  <li>Ban vĩnh viễn tất cả users đã đăng video</li>
                  <li>Đưa ví của users vào blacklist</li>
                </ul>
                <p className="text-destructive font-medium">⚠️ Không thể hoàn tác!</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteBanLoading}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeleteBan}
                disabled={deleteBanLoading}
                className="bg-red-700 hover:bg-red-800"
              >
                {deleteBanLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Shield className="w-4 h-4 mr-1" />}
                Xác nhận Xóa & Ban
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
