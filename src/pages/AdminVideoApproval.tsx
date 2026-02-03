import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryLabel, getCategoryIcon } from "@/lib/videoCategories";
import { Check, X, Eye, Clock, CheckCircle, XCircle, Play, User } from "lucide-react";

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
  channels: {
    name: string;
  } | null;
  profiles: {
    display_name: string | null;
    username: string;
  } | null;
}

export default function AdminVideoApproval() {
  const [videos, setVideos] = useState<VideoForApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedVideo, setSelectedVideo] = useState<VideoForApproval | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      checkAdminRole();
    }
  }, [user, authLoading, navigate]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    // Check BOTH admin and owner roles using RPC functions
    const { data: adminData } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    const { data: ownerData } = await supabase.rpc('is_owner', {
      _user_id: user.id,
    });
    
    if (adminData === true || ownerData === true) {
      setIsAdmin(true);
      fetchVideos();
    } else {
      toast({
        title: "Không có quyền truy cập",
        description: "Chỉ Admin mới có thể truy cập trang này",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        video_url,
        sub_category,
        approval_status,
        created_at,
        user_id,
        channels (name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách video",
        variant: "destructive",
      });
    } else if (data) {
      // Fetch profiles for all users
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

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể duyệt video",
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Đã duyệt video",
        description: `Video "${video.title}" đã được phê duyệt`,
      });
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

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối video",
        variant: "destructive",
      });
    } else {
      toast({
        title: "❌ Đã từ chối video",
        description: `Video "${selectedVideo.title}" đã bị từ chối`,
      });
      fetchVideos();
    }
    setProcessing(false);
    setRejectDialogOpen(false);
    setPreviewOpen(false);
    setRejectReason("");
  };

  const openPreview = (video: VideoForApproval) => {
    setSelectedVideo(video);
    setPreviewOpen(true);
  };

  const openRejectDialog = (video: VideoForApproval) => {
    setSelectedVideo(video);
    setRejectDialogOpen(true);
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

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Duyệt Video</h1>
          <Button variant="outline" onClick={fetchVideos}>
            Làm mới
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{counts.pending}</p>
                <p className="text-sm text-amber-600">Chờ duyệt</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{counts.approved}</p>
                <p className="text-sm text-green-600">Đã duyệt</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-700">{counts.rejected}</p>
                <p className="text-sm text-red-600">Đã từ chối</p>
              </div>
            </CardContent>
          </Card>
        </div>

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
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{video.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{video.profiles?.display_name || video.profiles?.username || "Unknown"}</span>
                            <span>•</span>
                            <span>{video.channels?.name || "Unknown Channel"}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {video.sub_category && (
                              <Badge variant="secondary">
                                {getCategoryIcon(video.sub_category)} {getCategoryLabel(video.sub_category)}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(video.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPreview(video)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Xem
                          </Button>
                          {video.approval_status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(video)}
                                disabled={processing}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(video)}
                                disabled={processing}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Từ chối
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
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={selectedVideo.video_url}
                  controls
                  className="w-full h-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {getCategoryIcon(selectedVideo.sub_category)} {getCategoryLabel(selectedVideo.sub_category)}
                  </Badge>
                  <Badge 
                    variant={
                      selectedVideo.approval_status === "approved" ? "default" :
                      selectedVideo.approval_status === "rejected" ? "destructive" : "secondary"
                    }
                  >
                    {selectedVideo.approval_status === "approved" ? "Đã duyệt" :
                     selectedVideo.approval_status === "rejected" ? "Đã từ chối" : "Chờ duyệt"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedVideo.description || "Không có mô tả"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Đăng bởi: {selectedVideo.profiles?.display_name || selectedVideo.profiles?.username}
                  <br />
                  Ngày tạo: {new Date(selectedVideo.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
              {selectedVideo.approval_status === "pending" && (
                <DialogFooter>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedVideo)}
                    disabled={processing}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Duyệt video
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setPreviewOpen(false);
                      openRejectDialog(selectedVideo);
                    }}
                    disabled={processing}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Từ chối
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vui lòng nhập lý do từ chối video "{selectedVideo?.title}"
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Lý do từ chối..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || processing}
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
