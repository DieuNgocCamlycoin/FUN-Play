import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MoreVertical, Edit, Trash2, EyeOff, Video, Globe, Lock, Zap, Radio, FileText, ListVideo, Podcast, Megaphone } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadWizard } from "@/components/Upload/UploadWizard";
import { MobileUploadFlow } from "@/components/Upload/Mobile/MobileUploadFlow";
import { useIsMobile } from "@/hooks/use-mobile";

interface VideoItem {
  id: string; title: string; description: string | null; thumbnail_url: string | null;
  view_count: number | null; created_at: string; is_public: boolean | null;
  like_count: number | null; comment_count: number | null;
}

type ContentTab = "video" | "shorts" | "live" | "posts" | "playlists" | "podcast" | "promo";

const TABS: { key: ContentTab; label: string; icon: React.ElementType }[] = [
  { key: "video", label: "Video", icon: Video },
  { key: "shorts", label: "Shorts", icon: Zap },
  { key: "live", label: "Sự kiện phát trực tiếp", icon: Radio },
  { key: "posts", label: "Bài đăng", icon: FileText },
  { key: "playlists", label: "Danh sách phát", icon: ListVideo },
  { key: "podcast", label: "Podcast", icon: Podcast },
  { key: "promo", label: "Quảng bá", icon: Megaphone },
];

const YourVideos = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>("video");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => { if (!user) { navigate("/auth"); return; } if (activeTab === "video" || activeTab === "shorts") fetchVideos(); }, [user, navigate, activeTab]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      let query = supabase.from("videos")
        .select("id, title, description, thumbnail_url, view_count, created_at, is_public, like_count, comment_count, duration")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (activeTab === "video") {
        query = query.or("duration.gt.180,and(duration.is.null,category.neq.shorts)");
      } else if (activeTab === "shorts") {
        query = query.or("duration.lte.180,and(duration.is.null,category.eq.shorts)");
      }

      const { data, error } = await query;
      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) { console.error("Error fetching videos:", error); toast({ title: "Lỗi", description: "Không thể tải video", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleDelete = async (videoId: string) => {
    try {
      const { error } = await supabase.from("videos").delete().eq("id", videoId);
      if (error) throw error;
      toast({ title: "Thành công", description: "Video đã được xóa" });
      setVideos(videos.filter(v => v.id !== videoId)); setDeleteVideoId(null);
    } catch (error: any) { console.error("Error deleting video:", error); toast({ title: "Lỗi", description: "Không thể xóa video", variant: "destructive" }); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Đang tải...</div>;

  return (
    <MainLayout>
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-2">Nội dung của kênh</h1>
          <div className="flex gap-4 border-b border-border overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "border-b-2 border-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab !== "video" && activeTab !== "shorts" ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            {(() => {
              const tab = TABS.find(t => t.key === activeTab);
              const TabIcon = tab?.icon || Video;
              return (
                <>
                  <TabIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2 text-lg">{tab?.label}</p>
                  <p className="text-sm text-muted-foreground">Sắp có</p>
                </>
              );
            })()}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            {activeTab === "shorts" ? (
              <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            ) : (
              <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            )}
            <p className="text-muted-foreground mb-4 text-lg">
              {activeTab === "shorts" ? "Bạn chưa có Shorts nào" : "Bạn chưa có video nào"}
            </p>
            <Button onClick={() => setUploadModalOpen(true)} size="lg">
              {activeTab === "shorts" ? "Tải Shorts đầu tiên" : "Tải video đầu tiên"}
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12"><input type="checkbox" className="rounded border-border" /></TableHead>
                  <TableHead className="w-[400px]">{activeTab === "shorts" ? "Shorts" : "Video"}</TableHead>
                  <TableHead className="text-center">Chế độ hiển thị</TableHead>
                  <TableHead className="text-center">Hạn chế</TableHead>
                  <TableHead className="text-center">Ngày</TableHead>
                  <TableHead className="text-center">Lượt xem</TableHead>
                  <TableHead className="text-center">Số bình luận</TableHead>
                  <TableHead className="text-center">Lượt thích (%)</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id} className="hover:bg-muted/30">
                    <TableCell><input type="checkbox" className="rounded border-border" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {video.thumbnail_url && <img src={video.thumbnail_url} alt={video.title} className="w-32 h-18 object-cover rounded" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-2">{video.title}</p>
                          {video.description && <p className="text-sm text-muted-foreground line-clamp-1">{video.description}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {video.is_public !== false ? (<><Globe className="h-4 w-4" /><span>Công khai</span></>) : (<><Lock className="h-4 w-4" /><span>Riêng tư</span></>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">Không có</TableCell>
                    <TableCell className="text-center"><div className="text-sm"><div>{formatDate(video.created_at)}</div><div className="text-muted-foreground">Đã xuất bản</div></div></TableCell>
                    <TableCell className="text-center">{video.view_count || 0}</TableCell>
                    <TableCell className="text-center">{video.comment_count || 0}</TableCell>
                    <TableCell className="text-center">
                      {video.like_count ? (<div><div className="font-medium">100.0%</div><div className="w-full bg-muted rounded-full h-1 mt-1"><div className="bg-primary h-1 rounded-full" style={{ width: '100%' }} /></div></div>) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => navigate(`/edit-video/${video.id}`)}><Edit className="mr-2 h-4 w-4" />Chỉnh sửa</DropdownMenuItem>
                          <DropdownMenuItem><EyeOff className="mr-2 h-4 w-4" />Ẩn video</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteVideoId(video.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc chắn muốn xóa video này? Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => deleteVideoId && handleDelete(deleteVideoId)}>Xóa</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isMobile ? <MobileUploadFlow open={uploadModalOpen} onOpenChange={setUploadModalOpen} /> : <UploadWizard open={uploadModalOpen} onOpenChange={setUploadModalOpen} />}
    </MainLayout>
  );
};

export default YourVideos;
