import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { extractVideoThumbnailFromUrl } from "@/lib/videoThumbnail";
import { toast } from "sonner";
import { Image, RefreshCw, CheckCircle, XCircle, Play, Pause, AlertTriangle, Youtube, Cloud, Globe, SkipForward, Home, ExternalLink } from "lucide-react";

type VideoSource = 'r2' | 'youtube' | 'supabase' | 'external';

interface VideoItem {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  status: 'pending' | 'processing' | 'success' | 'error' | 'skipped';
  errorMessage?: string;
  newThumbnailUrl?: string;
  source: VideoSource;
}

// Detect video source from URL
const detectVideoSource = (url: string): VideoSource => {
  if (!url) return 'external';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('r2.dev') || url.includes('pub-')) return 'r2';
  if (url.includes('supabase.co/storage')) return 'supabase';
  return 'external';
};

// Get source label and icon info
const getSourceInfo = (source: VideoSource) => {
  switch (source) {
    case 'r2':
      return { label: 'R2', color: 'bg-orange-500', canProcess: true };
    case 'youtube':
      return { label: 'YouTube', color: 'bg-red-500', canProcess: false };
    case 'supabase':
      return { label: 'Supabase', color: 'bg-green-500', canProcess: true };
    case 'external':
      return { label: 'External', color: 'bg-gray-500', canProcess: false };
  }
};

const SourceIcon = ({ source }: { source: VideoSource }) => {
  switch (source) {
    case 'r2':
      return <Cloud className="w-3 h-3" />;
    case 'youtube':
      return <Youtube className="w-3 h-3" />;
    default:
      return <Globe className="w-3 h-3" />;
  }
};

const ThumbnailRegenerationPanel = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0, remaining: 0, skipped: 0 });
  const [showSuccessActions, setShowSuccessActions] = useState(false);
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

      const videoItems: VideoItem[] = (data || []).map(v => {
        const source = detectVideoSource(v.video_url);
        const sourceInfo = getSourceInfo(source);
        return {
          ...v,
          source,
          status: sourceInfo.canProcess ? 'pending' as const : 'skipped' as const,
          errorMessage: sourceInfo.canProcess ? undefined : `${sourceInfo.label} không hỗ trợ trích xuất thumbnail`
        };
      });

      // Count by source
      const r2Count = videoItems.filter(v => v.source === 'r2').length;
      const youtubeCount = videoItems.filter(v => v.source === 'youtube').length;
      const externalCount = videoItems.filter(v => v.source === 'external' || v.source === 'supabase').length;
      const processableCount = videoItems.filter(v => v.status === 'pending').length;
      const skippedCount = videoItems.filter(v => v.status === 'skipped').length;

      console.log(`📊 Video sources: R2=${r2Count}, YouTube=${youtubeCount}, External=${externalCount}`);
      console.log(`✅ Processable videos: ${processableCount}`);

      setVideos(videoItems);
      setStats({
        total: videoItems.length,
        success: 0,
        error: 0,
        remaining: processableCount,
        skipped: skippedCount
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
    const sourceInfo = getSourceInfo(video.source);
    
    // Skip non-processable sources
    if (!sourceInfo.canProcess) {
      return { 
        success: false, 
        error: `${sourceInfo.label} không hỗ trợ trích xuất thumbnail (CORS restriction)` 
      };
    }

    try {
      console.log(`🎬 Processing video: ${video.title} (${video.source})`);
      console.log(`📎 URL: ${video.video_url}`);

      // Extract thumbnail from video URL
      console.log(`⏳ Extracting frame at 25% position...`);
      const thumbnailBlob = await extractVideoThumbnailFromUrl(video.video_url);
      
      if (!thumbnailBlob) {
        console.error(`❌ Frame extraction failed for: ${video.title}`);
        return { 
          success: false, 
          error: 'Không thể trích xuất frame từ video (có thể do CORS hoặc video format không hỗ trợ)' 
        };
      }

      console.log(`✅ Frame extracted, size: ${(thumbnailBlob.size / 1024).toFixed(2)} KB`);

      // Upload thumbnail to R2
      const thumbnailFileName = `thumbnails/${Date.now()}-${video.id}-auto.jpg`;
      console.log(`📤 Uploading to R2: ${thumbnailFileName}`);
      
      const { data: presignData, error: presignError } = await supabase.functions.invoke('r2-upload', {
        body: {
          action: 'getPresignedUrl',
          fileName: thumbnailFileName,
          contentType: 'image/jpeg',
          fileSize: thumbnailBlob.size,
        },
      });

      if (presignError || !presignData?.presignedUrl) {
        console.error(`❌ Presign URL error:`, presignError);
        return { 
          success: false, 
          error: 'Lỗi khi tạo presigned URL cho R2' 
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
        console.error(`❌ R2 upload failed: ${uploadResponse.status}`);
        return { 
          success: false, 
          error: `Lỗi khi upload thumbnail lên R2 (${uploadResponse.status})` 
        };
      }

      console.log(`✅ Uploaded to R2: ${presignData.publicUrl}`);

      // Update video record in database
      const { error: updateError } = await supabase
        .from('videos')
        .update({ thumbnail_url: presignData.publicUrl })
        .eq('id', video.id);

      if (updateError) {
        console.error(`❌ Database update error:`, updateError);
        return { 
          success: false, 
          error: 'Lỗi khi cập nhật database' 
        };
      }

      console.log(`🎉 Successfully processed: ${video.title}`);
      return { 
        success: true, 
        thumbnailUrl: presignData.publicUrl 
      };

    } catch (error) {
      console.error('❌ Process video error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      return { 
        success: false, 
        error: errorMsg.includes('CORS') ? 'CORS error - Video không cho phép truy cập cross-origin' : errorMsg 
      };
    }
  };

  // Start batch processing
  const startBatchProcessing = async () => {
    setProcessing(true);
    abortRef.current = false;

    // Only process videos that can be processed (not skipped)
    const pendingVideos = videos.filter(v => v.status === 'pending');
    const skippedCount = videos.filter(v => v.status === 'skipped').length;
    
    console.log(`🚀 Starting batch processing: ${pendingVideos.length} videos (${skippedCount} skipped)`);
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < pendingVideos.length; i++) {
      if (abortRef.current) break;

      const video = pendingVideos[i];
      
      console.log(`\n📹 [${i + 1}/${pendingVideos.length}] Processing: ${video.title}`);
      
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
        console.log(`✅ [${i + 1}/${pendingVideos.length}] Success: ${video.title}`);
      } else {
        errorCount++;
        console.log(`❌ [${i + 1}/${pendingVideos.length}] Error: ${video.title} - ${result.error}`);
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
    
    console.log(`\n📊 Batch processing complete: Success=${successCount}, Error=${errorCount}`);
    
    if (abortRef.current) {
      toast.info('Đã dừng xử lý batch');
    } else {
      toast.success(`Hoàn thành! Thành công: ${successCount}, Lỗi: ${errorCount}, Bỏ qua: ${skippedCount}`);
      // Show success actions if any thumbnails were created
      if (successCount > 0) {
        setShowSuccessActions(true);
      }
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

  const pendingCount = videos.filter(v => v.status === 'pending').length;
  const skippedCount = videos.filter(v => v.status === 'skipped').length;

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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <Card className="p-4 text-center bg-gray-500/10 border-gray-500/30">
            <div className="text-2xl font-bold text-gray-400">{stats.skipped}</div>
            <div className="text-xs text-muted-foreground">Bỏ qua</div>
          </Card>
        </div>

        {/* Source Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Badge className="bg-orange-500 gap-1"><Cloud className="w-3 h-3" /> R2</Badge>
            <span className="text-muted-foreground">Có thể xử lý</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-red-500 gap-1"><Youtube className="w-3 h-3" /> YouTube</Badge>
            <span className="text-muted-foreground">Không hỗ trợ (CORS)</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-gray-500 gap-1"><Globe className="w-3 h-3" /> External</Badge>
            <span className="text-muted-foreground">Không hỗ trợ</span>
          </div>
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
              disabled={loading || pendingCount === 0}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Play className="w-4 h-4" />
              Bắt đầu xử lý ({pendingCount} video)
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

        {/* Success Actions - Show after batch processing completes */}
        {showSuccessActions && stats.success > 0 && !processing && (
          <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="w-full mb-2">
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <CheckCircle className="w-5 h-5" />
                Đã tạo thành công {stats.success} thumbnail!
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Thumbnail đã được lưu vào database và sẽ hiển thị ngay trên trang chủ.
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500"
            >
              <Home className="w-4 h-4" />
              Xem trang chủ
            </Button>
            <Button
              onClick={() => {
                setShowSuccessActions(false);
                fetchVideosWithoutThumbnails();
              }}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Kiểm tra video còn lại
            </Button>
            <Button
              onClick={() => window.open('/', '_blank')}
              variant="outline"
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Mở tab mới
            </Button>
          </div>
        )}

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
                    video.status === 'skipped' ? 'bg-gray-500/10 border border-gray-500/30' :
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

                  {/* Source Badge */}
                  <Badge className={`${getSourceInfo(video.source).color} gap-1 flex-shrink-0`}>
                    <SourceIcon source={video.source} />
                    {getSourceInfo(video.source).label}
                  </Badge>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{video.title}</div>
                    {video.errorMessage && (
                      <div className="text-xs text-red-400 mt-1 truncate">{video.errorMessage}</div>
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
                  {video.status === 'skipped' && (
                    <Badge variant="secondary" className="bg-gray-500/20">
                      <SkipForward className="w-3 h-3 mr-1" />
                      Bỏ qua
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
            Video từ YouTube hoặc nguồn bên ngoài sẽ bị bỏ qua do hạn chế CORS.
            {skippedCount > 0 && (
              <span className="text-yellow-400 ml-1">
                ({skippedCount} video sẽ bị bỏ qua)
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThumbnailRegenerationPanel;
