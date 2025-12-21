import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Cloud, 
  CloudUpload, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play, 
  RefreshCw,
  Database,
  HardDrive
} from "lucide-react";

interface MigrationStats {
  pending: number;
  migrating: number;
  completed: number;
  failed: number;
  supabaseStorageCount: number;
  r2Count: number;
}

interface PendingVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  user_id: string;
}

interface MigrationResult {
  videoId: string;
  success: boolean;
  newVideoUrl?: string;
  error?: string;
}

const VideoMigrationPanel = () => {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [currentStatus, setCurrentStatus] = useState<string>('');

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('migrate-to-r2', {
        body: { action: 'get-stats' }
      });
      
      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Không thể tải thống kê migration');
    }
  };

  const fetchPendingVideos = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('migrate-to-r2', {
        body: { action: 'get-pending' }
      });
      
      if (error) throw error;
      setPendingVideos(data.videos || []);
    } catch (error: any) {
      console.error('Error fetching pending videos:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchPendingVideos()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Client-side migration: download file and upload directly to R2
  const migrateVideoClientSide = async (video: PendingVideo): Promise<{ success: boolean; newVideoUrl?: string; newThumbnailUrl?: string; error?: string }> => {
    try {
      setCurrentStatus('Đang tải video...');
      
      // Download the video file
      const videoResponse = await fetch(video.video_url);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.status}`);
      }
      
      const videoBlob = await videoResponse.blob();
      const videoSize = videoBlob.size;
      setCurrentStatus(`Video: ${(videoSize / 1024 / 1024).toFixed(1)}MB - Đang lấy presigned URL...`);
      
      // Get presigned URL from edge function
      const timestamp = Date.now();
      const originalFileName = video.video_url.split('/').pop()?.split('?')[0] || 'video.mp4';
      const videoFileName = `${video.user_id}/videos/migrated-${timestamp}-${originalFileName}`;
      
      const { data: presignedData, error: presignedError } = await supabase.functions.invoke('migrate-to-r2', {
        body: { 
          action: 'get-presigned-url', 
          fileName: videoFileName,
          contentType: videoBlob.type || 'video/mp4'
        }
      });
      
      if (presignedError) throw presignedError;
      
      setCurrentStatus(`Đang upload lên R2... (${(videoSize / 1024 / 1024).toFixed(1)}MB)`);
      
      // Upload directly to R2 using presigned URL
      const uploadResponse = await fetch(presignedData.presignedUrl, {
        method: 'PUT',
        body: videoBlob,
        headers: {
          'Content-Type': videoBlob.type || 'video/mp4',
        }
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }
      
      const newVideoUrl = presignedData.publicUrl;
      let newThumbnailUrl: string | undefined;
      
      // Migrate thumbnail if exists
      if (video.thumbnail_url && !video.thumbnail_url.includes('r2.dev')) {
        setCurrentStatus('Đang migrate thumbnail...');
        
        try {
          const thumbResponse = await fetch(video.thumbnail_url);
          if (thumbResponse.ok) {
            const thumbBlob = await thumbResponse.blob();
            const thumbFileName = video.thumbnail_url.split('/').pop()?.split('?')[0] || 'thumb.jpg';
            const newThumbFileName = `${video.user_id}/thumbnails/migrated-${timestamp}-${thumbFileName}`;
            
            const { data: thumbPresignedData } = await supabase.functions.invoke('migrate-to-r2', {
              body: { 
                action: 'get-presigned-url', 
                fileName: newThumbFileName,
                contentType: thumbBlob.type || 'image/jpeg'
              }
            });
            
            if (thumbPresignedData?.presignedUrl) {
              const thumbUploadResponse = await fetch(thumbPresignedData.presignedUrl, {
                method: 'PUT',
                body: thumbBlob,
                headers: {
                  'Content-Type': thumbBlob.type || 'image/jpeg',
                }
              });
              
              if (thumbUploadResponse.ok) {
                newThumbnailUrl = thumbPresignedData.publicUrl;
              }
            }
          }
        } catch (thumbError) {
          console.warn('Thumbnail migration failed:', thumbError);
        }
      }
      
      // Update video URLs in database
      setCurrentStatus('Đang cập nhật database...');
      const { error: updateError } = await supabase.functions.invoke('migrate-to-r2', {
        body: { 
          action: 'update-video-urls', 
          videoId: video.id,
          videoUrl: newVideoUrl,
          thumbnailUrl: newThumbnailUrl
        }
      });
      
      if (updateError) throw updateError;
      
      return { success: true, newVideoUrl, newThumbnailUrl };
      
    } catch (error: any) {
      console.error('Client-side migration error:', error);
      return { success: false, error: error.message };
    }
  };

  const migrateSingleVideo = async (videoId: string) => {
    const video = pendingVideos.find(v => v.id === videoId);
    if (!video) return;
    
    setCurrentVideoId(videoId);
    setCurrentStatus('Bắt đầu migrate...');
    
    const result = await migrateVideoClientSide(video);
    
    if (result.success) {
      toast.success(`Video migrated successfully`);
      setMigrationResults(prev => [...prev, { videoId, success: true, newVideoUrl: result.newVideoUrl }]);
    } else {
      toast.error(`Migration failed: ${result.error}`);
      setMigrationResults(prev => [...prev, { videoId, success: false, error: result.error }]);
    }
    
    setCurrentVideoId(null);
    setCurrentStatus('');
    await refreshData();
  };

  const migrateAllVideos = async () => {
    if (pendingVideos.length === 0) {
      toast.info('Không có video nào cần migrate');
      return;
    }

    setMigrating(true);
    setBatchProgress({ current: 0, total: pendingVideos.length });
    setMigrationResults([]);

    let migratedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < pendingVideos.length; i++) {
      const video = pendingVideos[i];
      setCurrentVideoId(video.id);
      setBatchProgress({ current: i, total: pendingVideos.length });
      
      const result = await migrateVideoClientSide(video);
      
      if (result.success) {
        migratedCount++;
        setMigrationResults(prev => [...prev, { videoId: video.id, success: true, newVideoUrl: result.newVideoUrl }]);
        toast.success(`Video ${i + 1}/${pendingVideos.length} migrated`);
      } else {
        failedCount++;
        setMigrationResults(prev => [...prev, { videoId: video.id, success: false, error: result.error }]);
        toast.error(`Video ${i + 1} failed: ${result.error}`);
      }
      
      setBatchProgress({ current: i + 1, total: pendingVideos.length });
      
      // Small delay between videos to prevent browser memory issues
      if (i < pendingVideos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setMigrating(false);
    setCurrentVideoId(null);
    setCurrentStatus('');
    
    toast.success(`Migration hoàn tất: ${migratedCount} thành công, ${failedCount} thất bại`);
    await refreshData();
  };

  const getStatusBadge = (videoId: string) => {
    const result = migrationResults.find(r => r.videoId === videoId);
    
    if (currentVideoId === videoId) {
      return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Đang migrate</Badge>;
    }
    
    if (result) {
      return result.success 
        ? <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Thành công</Badge>
        : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Thất bại</Badge>;
    }
    
    return <Badge variant="secondary">Chờ xử lý</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const progressPercent = batchProgress.total > 0 
    ? (batchProgress.current / batchProgress.total) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <Database className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.supabaseStorageCount || 0}</div>
            <div className="text-xs text-muted-foreground">Supabase Storage</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Cloud className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.r2Count || 0}</div>
            <div className="text-xs text-muted-foreground">Cloudflare R2</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <div className="text-xs text-muted-foreground">Đã migrate</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
          <CardContent className="p-4 text-center">
            <XCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.failed || 0}</div>
            <div className="text-xs text-muted-foreground">Thất bại</div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Control */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CloudUpload className="w-5 h-5" />
            Migrate Videos sang Cloudflare R2
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={migrating}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button 
              onClick={migrateAllVideos}
              disabled={migrating || pendingVideos.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {migrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang migrate...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Migrate tất cả ({pendingVideos.length})
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {migrating && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tiến trình: {batchProgress.current}/{batchProgress.total}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              {currentStatus && (
                <div className="text-xs text-muted-foreground animate-pulse">
                  {currentStatus}
                </div>
              )}
            </div>
          )}

          {pendingVideos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>Tất cả videos đã được migrate sang R2!</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {pendingVideos.map((video) => (
                  <div 
                    key={video.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      {video.thumbnail_url && (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{video.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {video.video_url.includes('supabase') ? 'Supabase Storage' : 'External'}
                      </div>
                    </div>
                    {getStatusBadge(video.id)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => migrateSingleVideo(video.id)}
                      disabled={migrating || currentVideoId === video.id}
                    >
                      {currentVideoId === video.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CloudUpload className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Migration Results */}
      {migrationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {migrationResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded text-sm ${
                      result.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {result.success ? (
                      <span>✓ Video {result.videoId.slice(0, 8)}... → {result.newVideoUrl?.slice(0, 50)}...</span>
                    ) : (
                      <span>✗ Video {result.videoId.slice(0, 8)}... - {result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoMigrationPanel;
