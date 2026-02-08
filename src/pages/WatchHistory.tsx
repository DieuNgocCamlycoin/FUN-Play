import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Play, Trash2, ArrowLeft, AlertCircle, Search, X, MoreVertical, Bookmark, Share2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { VideoPlaceholder } from '@/components/Video/VideoPlaceholder';
import { ShareModal } from '@/components/Video/ShareModal';
import { AddToPlaylistModal } from '@/components/Playlist/AddToPlaylistModal';
import { formatDuration, formatViews, formatTimestamp } from '@/lib/formatters';

const WatchHistory = () => {
  const { watchHistory, loading, removeFromHistory, clearAllHistory } = useWatchHistory();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [shareVideoId, setShareVideoId] = useState<string | null>(null);
  const [shareVideoTitle, setShareVideoTitle] = useState('');
  const [playlistVideoId, setPlaylistVideoId] = useState<string | null>(null);
  const [playlistVideoTitle, setPlaylistVideoTitle] = useState('');

  const handlePlayVideo = (videoId: string, position: number) => {
    navigate(`/watch/${videoId}?t=${position}`);
  };

  const getProgressPercentage = (position: number, duration: number | null) => {
    if (!duration || duration === 0) return 0;
    return Math.min((position / duration) * 100, 100);
  };

  // Filter by search query
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return watchHistory;
    const q = searchQuery.toLowerCase();
    return watchHistory.filter(item =>
      item.video.title.toLowerCase().includes(q) ||
      (item.video.channels?.name || '').toLowerCase().includes(q)
    );
  }, [watchHistory, searchQuery]);

  // Group by date
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.watched_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Hôm qua';
    } else {
      groupKey = date.toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, typeof watchHistory>);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cosmic-magenta to-cosmic-cyan flex items-center justify-center">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0066FF]">
                  Lịch sử xem
                </h1>
                <p className="text-sm text-muted-foreground">
                  {watchHistory.length} video đã xem
                </p>
              </div>
            </div>
          </div>

          {/* Clear history */}
          {watchHistory.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Xóa lịch sử
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    Xóa toàn bộ lịch sử?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Toàn bộ lịch sử xem video của bạn sẽ bị xóa vĩnh viễn.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const success = await clearAllHistory();
                      if (success) {
                        toast({ title: 'Đã xóa toàn bộ lịch sử', description: 'Lịch sử xem video đã được xóa thành công' });
                      }
                    }}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Xóa tất cả
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm trong lịch sử xem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

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
        ) : watchHistory.length === 0 ? (
          <div className="text-center py-20">
            <History className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Chưa có lịch sử xem</h2>
            <p className="text-muted-foreground mb-4">
              Video bạn xem sẽ xuất hiện ở đây
            </p>
            <Button onClick={() => navigate('/')}>
              Khám phá video
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedHistory).map(([date, videos]) => (
              <div key={date}>
                <h2 className="text-lg font-semibold mb-4 text-foreground/80">{date}</h2>
                <div className="space-y-3">
                  {videos.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
                      onClick={() => handlePlayVideo(item.video_id, item.last_position_seconds)}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
                        {item.video.thumbnail_url ? (
                          <img
                            src={item.video.thumbnail_url}
                            alt={item.video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <VideoPlaceholder />
                        )}
                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${getProgressPercentage(item.last_position_seconds, item.video.duration)}%`,
                            }}
                          />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {formatDuration(item.video.duration)}
                        </div>
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {item.video.title}
                        </h3>
                        <p
                          className="text-sm text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.video.channels?.id) navigate(`/channel/${item.video.channels.id}`);
                          }}
                        >
                          <span className="flex items-center gap-1">
                            {item.video.channels?.name || 'Kênh chưa xác định'}
                            {item.video.channels?.is_verified && (
                              <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            )}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatViews(item.video.view_count)} • {formatTimestamp(item.watched_at)}
                        </p>
                        {item.completed && (
                          <span className="inline-block mt-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            Đã xem xong
                          </span>
                        )}
                      </div>

                      {/* Kebab menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            removeFromHistory(item.video_id);
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa khỏi lịch sử
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setPlaylistVideoId(item.video.id);
                            setPlaylistVideoTitle(item.video.title);
                          }}>
                            <Bookmark className="mr-2 h-4 w-4" />
                            Lưu vào danh sách phát
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setShareVideoId(item.video.id);
                            setShareVideoTitle(item.video.title);
                          }}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Chia sẻ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={!!shareVideoId}
        onClose={() => setShareVideoId(null)}
        contentType="video"
        contentId={shareVideoId || ''}
        contentTitle={shareVideoTitle}
        userId={user?.id}
      />

      {/* Add to Playlist Modal */}
      {playlistVideoId && (
        <AddToPlaylistModal
          open={!!playlistVideoId}
          onOpenChange={(open) => { if (!open) setPlaylistVideoId(null); }}
          videoId={playlistVideoId}
          videoTitle={playlistVideoTitle}
        />
      )}
    </MainLayout>
  );
};

export default WatchHistory;
