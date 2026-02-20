import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Video, Search, MoreHorizontal, ExternalLink, Eye, EyeOff, Check, X, Trash2,
  ChevronDown, ChevronRight, Play, Snowflake, RefreshCw, User, FileSpreadsheet,
  ThumbsUp, MessageSquare, Clock, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminPagination, PAGE_SIZE } from "@/components/Admin/AdminPagination";
import { getProfileUrl } from "@/lib/adminUtils";
import { format } from "date-fns";

interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  category: string | null;
  sub_category: string | null;
  approval_status: string | null;
  is_hidden: boolean | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  report_count: number | null;
  duration: number | null;
  file_size: number | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  channel_id: string;
  profile_display_name: string | null;
  profile_username: string;
  profile_avatar_url: string | null;
  channel_name: string | null;
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const fmt = (n: number | null) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
};

const statusBadge = (status: string | null, isHidden: boolean | null) => {
  if (isHidden) return <Badge variant="outline" className="text-[10px] border-orange-500 text-orange-500">Ẩn</Badge>;
  switch (status) {
    case "approved": return <Badge className="bg-green-600 text-[10px]">Đã duyệt</Badge>;
    case "pending": return <Badge className="bg-amber-500 text-[10px]">Chờ duyệt</Badge>;
    case "rejected": return <Badge variant="destructive" className="text-[10px]">Từ chối</Badge>;
    default: return <Badge variant="outline" className="text-[10px]">{status || "N/A"}</Badge>;
  }
};

export default function AllVideosTab() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; video: VideoRow } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, sortBy]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("videos")
        .select("id, title, description, thumbnail_url, video_url, category, sub_category, approval_status, is_hidden, view_count, like_count, comment_count, report_count, duration, file_size, slug, created_at, updated_at, user_id, channel_id", { count: "exact" });

      // Status filter
      if (statusFilter === "approved") query = query.eq("approval_status", "approved");
      else if (statusFilter === "pending") query = query.eq("approval_status", "pending");
      else if (statusFilter === "rejected") query = query.eq("approval_status", "rejected");
      else if (statusFilter === "hidden") query = query.eq("is_hidden", true);

      // Search
      if (debouncedSearch.trim()) {
        query = query.ilike("title", `%${debouncedSearch.trim()}%`);
      }

      // Sort
      if (sortBy === "views") query = query.order("view_count", { ascending: false, nullsFirst: false });
      else if (sortBy === "reports") query = query.order("report_count", { ascending: false, nullsFirst: false });
      else query = query.order("created_at", { ascending: false });

      // Pagination
      const from = (currentPage - 1) * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      // Fetch profiles for user_ids
      const userIds = [...new Set((data || []).map(v => v.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", userIds)
        : { data: [] };

      const { data: channels } = userIds.length > 0
        ? await supabase.from("channels").select("id, name").in("user_id", userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const channelMap = new Map((channels || []).map(c => [c.id, c]));

      const rows: VideoRow[] = (data || []).map(v => {
        const p = profileMap.get(v.user_id);
        const ch = channelMap.get(v.channel_id);
        return {
          ...v,
          profile_display_name: p?.display_name || null,
          profile_username: p?.username || "unknown",
          profile_avatar_url: p?.avatar_url || null,
          channel_name: ch?.name || null,
        };
      });

      setVideos(rows);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("AllVideosTab fetch error:", err);
      toast.error("Lỗi tải danh sách video");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, sortBy]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Admin actions
  const handleAction = async (type: string, video: VideoRow) => {
    setActionLoading(true);
    try {
      switch (type) {
        case "approve":
          await supabase.from("videos").update({ approval_status: "approved" }).eq("id", video.id);
          toast.success(`Đã duyệt "${video.title}"`);
          break;
        case "reject":
          await supabase.from("videos").update({ approval_status: "rejected" }).eq("id", video.id);
          toast.success(`Đã từ chối "${video.title}"`);
          break;
        case "hide":
          await supabase.from("videos").update({ is_hidden: true }).eq("id", video.id);
          toast.success(`Đã ẩn "${video.title}"`);
          break;
        case "show":
          await supabase.from("videos").update({ is_hidden: false }).eq("id", video.id);
          toast.success(`Đã hiện "${video.title}"`);
          break;
        case "freeze":
          await supabase.from("videos").update({ approval_status: "rejected" }).eq("id", video.id);
          toast.success(`Đã treo thưởng "${video.title}"`);
          break;
        case "delete":
          await supabase.from("videos").delete().eq("id", video.id);
          toast.success(`Đã xóa "${video.title}"`);
          break;
      }
      fetchVideos();
    } catch {
      toast.error("Lỗi thực hiện hành động");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const exportCSV = () => {
    const headers = ["Tiêu đề", "Người tải", "Views", "Likes", "Comments", "Trạng thái", "Ngày tạo"];
    const rows = videos.map(v => [
      v.title, v.profile_display_name || v.profile_username, v.view_count || 0,
      v.like_count || 0, v.comment_count || 0, v.approval_status || "", format(new Date(v.created_at), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `videos_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Đã xuất CSV!");
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 w-full sm:w-auto">
          <CardContent className="p-4 flex items-center gap-4">
            <Video className="w-10 h-10 text-purple-500" />
            <div>
              <div className="text-3xl font-bold">{totalCount}</div>
              <div className="text-xs text-muted-foreground">Tổng Video</div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchVideos} className="gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm theo tiêu đề video..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
            <SelectItem value="hidden">Đã ẩn</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="views">Views cao nhất</SelectItem>
            <SelectItem value="reports">Reports nhiều nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" /> Videos ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải...
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Không có video nào</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead className="hidden md:table-cell">Người tải</TableHead>
                    <TableHead className="text-center hidden md:table-cell"><Eye className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-center hidden md:table-cell"><ThumbsUp className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-center hidden md:table-cell"><MessageSquare className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-center hidden lg:table-cell"><Clock className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video, idx) => {
                    const isExpanded = expandedId === video.id;
                    const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;

                    return (
                      <Collapsible key={video.id} open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : video.id)} asChild>
                        <>
                          <CollapsibleTrigger asChild>
                            <TableRow className={`cursor-pointer transition-colors hover:bg-muted/50 ${video.is_hidden ? "opacity-50" : ""} ${(video.report_count || 0) > 0 ? "bg-red-500/5 border-l-4 border-red-500" : ""}`}>
                              <TableCell className="text-muted-foreground text-xs">
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative w-16 h-10 flex-shrink-0 rounded overflow-hidden bg-muted">
                                    {video.thumbnail_url ? (
                                      <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center"><Play className="w-4 h-4 text-muted-foreground" /></div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium truncate max-w-[200px] text-sm">{video.title}</div>
                                    <div className="text-[10px] text-muted-foreground">{format(new Date(video.created_at), "dd/MM/yyyy")}</div>
                                    {/* Mobile stats */}
                                    <div className="flex gap-2 text-[10px] text-muted-foreground md:hidden">
                                      <span>👁 {fmt(video.view_count)}</span>
                                      <span>👍 {fmt(video.like_count)}</span>
                                      <span>💬 {fmt(video.comment_count)}</span>
                                    </div>
                                  </div>
                                  {(video.report_count || 0) > 0 && (
                                    <Badge variant="destructive" className="text-[10px] shrink-0">
                                      <AlertTriangle className="w-3 h-3 mr-0.5" />{video.report_count}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="text-sm truncate max-w-[120px]">{video.profile_display_name || video.profile_username}</div>
                              </TableCell>
                              <TableCell className="text-center hidden md:table-cell text-sm">{fmt(video.view_count)}</TableCell>
                              <TableCell className="text-center hidden md:table-cell text-sm">{fmt(video.like_count)}</TableCell>
                              <TableCell className="text-center hidden md:table-cell text-sm">{fmt(video.comment_count)}</TableCell>
                              <TableCell className="text-center hidden lg:table-cell text-sm">{formatDuration(video.duration)}</TableCell>
                              <TableCell className="text-center">{statusBadge(video.approval_status, video.is_hidden)}</TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
                                    <DropdownMenuItem onClick={() => setPreviewVideo(video)}>
                                      <Play className="w-4 h-4 mr-2" /> Xem video
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(`/video/${video.slug || video.id}`, "_blank")}>
                                      <ExternalLink className="w-4 h-4 mr-2" /> Mở trang video
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      const url = getProfileUrl(video.profile_username, video.user_id);
                                      if (url) window.open(url, "_blank");
                                    }}>
                                      <User className="w-4 h-4 mr-2" /> Xem profile người tải
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {video.approval_status !== "approved" && (
                                      <DropdownMenuItem disabled={actionLoading} onClick={() => handleAction("approve", video)}>
                                        <Check className="w-4 h-4 mr-2 text-green-500" /> Duyệt thưởng
                                      </DropdownMenuItem>
                                    )}
                                    {video.approval_status !== "rejected" && (
                                      <DropdownMenuItem disabled={actionLoading} onClick={() => handleAction("reject", video)}>
                                        <X className="w-4 h-4 mr-2 text-red-500" /> Từ chối thưởng
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem disabled={actionLoading} onClick={() => handleAction("freeze", video)}>
                                      <Snowflake className="w-4 h-4 mr-2 text-cyan-500" /> Treo thưởng
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {video.is_hidden ? (
                                      <DropdownMenuItem disabled={actionLoading} onClick={() => handleAction("show", video)}>
                                        <Eye className="w-4 h-4 mr-2" /> Hiện video
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem disabled={actionLoading} onClick={() => handleAction("hide", video)}>
                                        <EyeOff className="w-4 h-4 mr-2" /> Ẩn video
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" disabled={actionLoading} onClick={() => setConfirmAction({ type: "delete", video })}>
                                      <Trash2 className="w-4 h-4 mr-2" /> Xóa video
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={9} className="p-4">
                                <VideoDetailPanel video={video} />
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalCount} pageSize={PAGE_SIZE} />
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{previewVideo?.title}</DialogTitle></DialogHeader>
          {previewVideo && (
            <div className="space-y-3">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video src={previewVideo.video_url} controls className="w-full h-full" />
              </div>
              <p className="text-sm text-muted-foreground">{previewVideo.description || "Không có mô tả"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa video</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa video "{confirmAction?.video.title}"? Hành động này không thể hoàn tác. Tất cả likes, comments, rewards liên quan sẽ bị xóa theo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => confirmAction && handleAction("delete", confirmAction.video)}>
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VideoDetailPanel({ video }: { video: VideoRow }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: Video player + Info */}
      <div className="space-y-3">
        <div className="aspect-video bg-black rounded-lg overflow-hidden max-w-sm">
          <video src={video.video_url} controls className="w-full h-full" poster={video.thumbnail_url || undefined} />
        </div>
        {video.description && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Mô tả</div>
            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">{video.description}</p>
          </div>
        )}
      </div>

      {/* Right: Metadata */}
      <div className="space-y-2 text-sm">
        <DetailRow label="ID" value={video.id} mono />
        <DetailRow label="Slug" value={video.slug || "—"} />
        <DetailRow label="Category" value={video.category || "—"} />
        <DetailRow label="Sub Category" value={video.sub_category || "—"} />
        <DetailRow label="Thời lượng" value={formatDuration(video.duration)} />
        <DetailRow label="Dung lượng" value={formatFileSize(video.file_size)} />
        <DetailRow label="Views" value={fmt(video.view_count)} />
        <DetailRow label="Likes" value={fmt(video.like_count)} />
        <DetailRow label="Comments" value={fmt(video.comment_count)} />
        <DetailRow label="Reports" value={String(video.report_count || 0)} highlight={(video.report_count || 0) > 0} />
        <DetailRow label="Trạng thái" value={video.approval_status || "N/A"} />
        <DetailRow label="Ẩn" value={video.is_hidden ? "Có" : "Không"} />
        <DetailRow label="Người tải" value={video.profile_display_name || video.profile_username} />
        <DetailRow label="Channel" value={video.channel_name || "—"} />
        <DetailRow label="Ngày tạo" value={format(new Date(video.created_at), "dd/MM/yyyy HH:mm")} />
        <DetailRow label="Cập nhật" value={format(new Date(video.updated_at), "dd/MM/yyyy HH:mm")} />
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs w-24 shrink-0">{label}</span>
      <span className={`text-xs truncate ${mono ? "font-mono" : ""} ${highlight ? "text-red-500 font-bold" : ""}`}>{value}</span>
    </div>
  );
}
