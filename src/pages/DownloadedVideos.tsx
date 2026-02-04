import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Play, Download, HardDrive } from "lucide-react";
import { useOfflineVideos } from "@/hooks/useOfflineVideos";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MobileBottomNav } from "@/components/Layout/MobileBottomNav";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const MAX_STORAGE = 500 * 1024 * 1024; // 500 MB limit for display purposes

const DownloadedVideos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { videos, loading, storageUsed, deleteVideo, createBlobUrl, formatStorageSize, refetch } = useOfflineVideos();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    const success = await deleteVideo(id);
    if (success) {
      toast({
        title: "Đã xóa",
        description: `"${title}" đã được xóa khỏi bộ nhớ`,
      });
    } else {
      toast({
        title: "Lỗi",
        description: "Không thể xóa video",
        variant: "destructive",
      });
    }
  };

  const handlePlay = (video: { id: string; blob: Blob }) => {
    const url = createBlobUrl(video.blob);
    setPlayingVideo(url);
  };

  const storagePercentage = Math.min((storageUsed / MAX_STORAGE) * 100, 100);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">Nội dung tải xuống</span>
        </div>
      </div>

      {/* Storage Indicator */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Đã sử dụng: {formatStorageSize(storageUsed)} / {formatStorageSize(MAX_STORAGE)}
          </span>
        </div>
        <Progress value={storagePercentage} className="h-2" />
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => {
            URL.revokeObjectURL(playingVideo);
            setPlayingVideo(null);
          }}
        >
          <video
            src={playingVideo}
            controls
            autoPlay
            className="max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => {
              URL.revokeObjectURL(playingVideo);
              setPlayingVideo(null);
            }}
          >
            ✕
          </Button>
        </div>
      )}

      {/* Video List */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-32 aspect-video bg-muted rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="flex gap-3">
                <div
                  className="relative w-32 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                  onClick={() => handlePlay(video)}
                >
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Play className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-10 w-10 text-white" fill="white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium line-clamp-2 mb-1">{video.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Tải xuống: {formatDistanceToNow(new Date(video.downloadedAt), { addSuffix: true, locale: vi })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatStorageSize(video.size)}
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xóa video đã tải?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Video "{video.title}" sẽ bị xóa khỏi bộ nhớ thiết bị. Bạn có thể tải lại sau.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDelete(video.id, video.title)}
                      >
                        Xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Download className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có video đã tải</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tải video để xem khi không có mạng
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Khám phá video
            </Button>
          </Card>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default DownloadedVideos;
