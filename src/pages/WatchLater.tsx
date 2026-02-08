import { useNavigate } from 'react-router-dom';
import { Clock, Play, Trash2, ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useWatchLater } from '@/hooks/useWatchLater';
import { useVideoPlayback } from '@/contexts/VideoPlaybackContext';
import { VideoPlaceholder } from '@/components/Video/VideoPlaceholder';

const WatchLater = () => {
  const { watchLaterList, loading, removeFromWatchLater } = useWatchLater();
  const { createSession } = useVideoPlayback();
  const navigate = useNavigate();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number | null) => {
    if (!views) return '0 lượt xem';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M lượt xem`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K lượt xem`;
    return `${views} lượt xem`;
  };

  const handlePlayAll = async () => {
    if (watchLaterList.length === 0) return;
    const videos = watchLaterList.map(item => item.video);
    await createSession(videos[0].id, 'HOME_FEED', undefined, videos);
    navigate(`/watch/${videos[0].id}`);
  };

  const handlePlayVideo = (videoId: string) => {
    navigate(`/watch/${videoId}`);
  };

  const totalDuration = watchLaterList.reduce((acc, item) => acc + (item.video?.duration || 0), 0);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cosmic-sapphire to-cosmic-cyan flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta">
                Watch Later
              </h1>
              <p className="text-sm text-muted-foreground">
                {watchLaterList.length} video • {formatDuration(totalDuration)} tổng thời lượng
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {watchLaterList.length > 0 && (
          <div className="flex gap-3 mb-6">
            <Button onClick={handlePlayAll} className="gap-2 bg-gradient-to-r from-cosmic-sapphire to-cosmic-cyan hover:opacity-90">
              <Play className="w-4 h-4 fill-white" />
              Phát tất cả
            </Button>
          </div>
        )}

        {/* Video List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-40 aspect-video bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : watchLaterList.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Chưa có video nào</h2>
            <p className="text-muted-foreground mb-4">Thêm video vào Watch Later để xem sau</p>
            <Button onClick={() => navigate('/')}>Khám phá video</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {watchLaterList.map((item, index) => (
              <div
                key={item.id}
                className="flex gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
                onClick={() => handlePlayVideo(item.video.id)}
              >
                <div className="w-6 flex items-center justify-center text-sm text-muted-foreground">{index + 1}</div>
                <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
                  {item.video.thumbnail_url ? (
                    <img src={item.video.thumbnail_url} alt={item.video.title} className="w-full h-full object-cover" />
                  ) : (
                    <VideoPlaceholder />
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">{formatDuration(item.video.duration)}</div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{item.video.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.video.channels?.name || 'Unknown Channel'}</p>
                  <p className="text-xs text-muted-foreground">{formatViews(item.video.view_count)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); removeFromWatchLater(item.video_id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default WatchLater;
