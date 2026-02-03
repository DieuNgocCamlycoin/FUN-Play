import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { extractVideoThumbnailFromUrl } from "@/lib/videoThumbnail";
import { toast } from "sonner";
import { Image, RefreshCw, CheckCircle, XCircle, Play, Pause, AlertTriangle } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  newThumbnailUrl?: string;
}

const ThumbnailRegenerationPanel = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0, remaining: 0 });
  const abortRef = useRef(false);

  // Fetch videos with NULL thumbnails
  const fetchVideosWithoutThumbnails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, video_url, thumbnail_url')
        .is('thumbnail_url', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const videoItems: VideoItem[] = (data || []).map(v => ({
        ...v,
        status: 'pending' as const
      }));

      setVideos(videoItems);
      setStats({
        total: videoItems.length,
        success: 0,
        error: 0,
        remaining: videoItems.length
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Lỗi khi tải danh sách video');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideosWithoutThumbnails();
  }, []);

  // Process single video - extract thumbnail and upload
  const processVideo = async (video: VideoItem): Promise<{ success: boolean; thumbnailUrl?: string; error?: string }> => {
    try {
      // Check if video URL is from R2 (can process) or external (cannot process)
      const isR2Video = video.video_url?.includes('r2.dev') || video.video_url?.includes('pub-');
      
      if (!isR2Video) {
        return { 
          success: false, 
          error: 'Video không phải từ R2, không thể trích xuất thumbnail' 
        };
      }

      // Extract thumbnail from video URL
      const thumbnailBlob = await extractVideoThumbnailFromUrl(video.video_url);
      
      if (!thumbnailBlob) {
        return { 
          success: false, 
          error: 'Không thể trích xuất frame từ video' 
        };
      }

      // Upload thumbnail to R2
      const thumbnailFileName = `thumbnails/${Date.now()}-${video.id}-auto.jpg`;
      
      const { data: presignData, error: presignError } = await supabase.functions.invoke('r2-upload', {
        body: {
          action: 'getPresignedUrl',
          fileName: thumbnailFileName,
          contentType: 'image/jpeg',
          fileSize: thumbnailBlob.size,
        },
      });

      if (presignError || !presignData?.presignedUrl) {
        return { 
          success: false, 
          error: 'Lỗi khi tạo presigned URL' 
        };
      }

      // Upload blob to R2
      const uploadResponse = await fetch(presignData.presignedUrl, {
        method: 'PUT',
        body: thumbnailBlob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResponse.ok) {
        return { 
          success: false, 
          error: 'Lỗi khi upload thumbnail lên R2' 
        };
      }

      // Update video record in database
      const { error: updateError } = await supabase
        .from('videos')
        .update({ thumbnail_url: presignData.publicUrl })
        .eq('id', video.id);

      if (updateError) {
        return { 
          success: false, 
          error: 'Lỗi khi cập nhật database' 
        };
      }

      return { 
        success: true, 
        thumbnailUrl: presignData.publicUrl 
      };

    } catch (error) {
      console.error('Process video error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Lỗi không xác định' 
      };
    }
  };

  // Start batch processing
  const startBatchProcessing = async () => {
    setProcessing(true);
    abortRef.current = false;

    const pendingVideos = videos.filter(v => v.status === 'pending');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < pendingVideos.length; i++) {
      if (abortRef.current) break;

      const video = pendingVideos[i];
      
      // Update status to processing
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, status: 'processing' as const } : v
      ));

      const result = await processVideo(video);

      // Update status based on result
      setVideos(prev => prev.map(v => 
        v.id === video.id 
          ? { 
              ...v, 
              status: result.success ? 'success' as const : 'error' as const,
              errorMessage: result.error,
              newThumbnailUrl: result.thumbnailUrl
            } 
          : v
      ));

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }

      // Update progress
      const processed = i + 1;
      setProgress((processed / pendingVideos.length) * 100);
      setStats(prev => ({
        ...prev,
        success: successCount,
        error: errorCount,
        remaining: pendingVideos.length - processed
      }));

      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setProcessing(false);
    
    if (abortRef.current) {
      toast.info('Đã dừng xử lý batch');
    } else {
      toast.success(`Hoàn thành! Thành công: ${successCount}, Lỗi: ${errorCount}`);
    }
  };

  // Stop batch processing
  const stopBatchProcessing = () => {
    abortRef.current = true;
    toast.info('Đang dừng xử lý...');
  };

  // Retry failed videos
  const retryFailed = async () => {
    setVideos(prev => prev.map(v => 
      v.status === 'error' ? { ...v, status: 'pending' as const, errorMessage: undefined } : v
    ));
    startBatchProcessing();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5 text-purple-500" />
          Tái Tạo Thumbnail Từ Video
        </CardTitle>
        <CardDescription>
          Tự động trích xuất thumbnail từ video cho các video chưa có thumbnail
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center bg-muted/30">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Tổng số</div>
          </Card>
          <Card className="p-4 text-center bg-green-500/10 border-green-500/30">
            <div className="text-2xl font-bold text-green-500">{stats.success}</div>
            <div className="text-xs text-muted-foreground">Thành công</div>
          </Card>
          <Card className="p-4 text-center bg-red-500/10 border-red-500/30">
            <div className="text-2xl font-bold text-red-500">{stats.error}</div>
            <div className="text-xs text-muted-foreground">Lỗi</div>
          </Card>
          <Card className="p-4 text-center bg-yellow-500/10 border-yellow-500/30">
            <div className="text-2xl font-bold text-yellow-500">{stats.remaining}</div>
            <div className="text-xs text-muted-foreground">Còn lại</div>
          </Card>
        </div>

        {/* Progress */}
        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Đang xử lý...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={fetchVideosWithoutThumbnails}
            disabled={loading || processing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới danh sách
          </Button>

          {!processing ? (
            <Button
              onClick={startBatchProcessing}
              disabled={loading || videos.filter(v => v.status === 'pending').length === 0}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Play className="w-4 h-4" />
              Bắt đầu xử lý ({videos.filter(v => v.status === 'pending').length} video)
            </Button>
          ) : (
            <Button
              onClick={stopBatchProcessing}
              variant="destructive"
              className="gap-2"
            >
              <Pause className="w-4 h-4" />
              Dừng xử lý
            </Button>
          )}

          {stats.error > 0 && !processing && (
            <Button
              onClick={retryFailed}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại lỗi ({stats.error})
            </Button>
          )}
        </div>

        {/* Video List */}
        <ScrollArea className="h-[400px] border rounded-lg">
          <div className="p-4 space-y-2">
            {videos.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {loading ? 'Đang tải...' : 'Không có video nào cần xử lý thumbnail'}
              </div>
            ) : (
              videos.map(video => (
                <div
                  key={video.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    video.status === 'processing' ? 'bg-blue-500/10 border border-blue-500/30' :
                    video.status === 'success' ? 'bg-green-500/10 border border-green-500/30' :
                    video.status === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                    'bg-muted/30'
                  }`}
                >
                  {/* Thumbnail preview */}
                  <div className="w-16 h-9 rounded overflow-hidden bg-muted flex-shrink-0">
                    {video.newThumbnailUrl ? (
                      <img 
                        src={video.newThumbnailUrl} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Image className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{video.title}</div>
                    {video.errorMessage && (
                      <div className="text-xs text-red-400 mt-1">{video.errorMessage}</div>
                    )}
                  </div>

                  {/* Status Badge */}
                  {video.status === 'pending' && (
                    <Badge variant="outline">Chờ xử lý</Badge>
                  )}
                  {video.status === 'processing' && (
                    <Badge className="bg-blue-500 animate-pulse">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Đang xử lý
                    </Badge>
                  )}
                  {video.status === 'success' && (
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Thành công
                    </Badge>
                  )}
                  {video.status === 'error' && (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Lỗi
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Lưu ý:</strong> Chỉ các video được host trên R2 mới có thể trích xuất thumbnail.
            Video từ YouTube hoặc nguồn bên ngoài sẽ không được xử lý.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThumbnailRegenerationPanel;
