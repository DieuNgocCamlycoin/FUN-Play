import { useNavigate } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { VideoPlaceholder } from './VideoPlaceholder';
import { formatDuration } from '@/lib/formatters';

export const ContinueWatching = () => {
  const { continueWatching, removeFromHistory } = useWatchHistory();
  const navigate = useNavigate();

  if (continueWatching.length === 0) return null;

  // formatDuration imported from @/lib/formatters

  const getProgressPercentage = (position: number, duration: number | null) => {
    if (!duration || duration === 0) return 0;
    return Math.min((position / duration) * 100, 100);
  };

  const handlePlay = (videoId: string, position: number) => {
    navigate(`/watch/${videoId}?t=${position}`);
  };

  const handleRemove = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    await removeFromHistory(videoId);
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-[#0066FF]">
        Tiếp tục xem
      </h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {continueWatching.map((item) => (
            <div
              key={item.id}
              className="relative group w-72 flex-shrink-0 cursor-pointer"
              onClick={() => handlePlay(item.video_id, item.last_position_seconds)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                {item.video.thumbnail_url ? (
                  <img
                    src={item.video.thumbnail_url}
                    alt={item.video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <VideoPlaceholder className="transition-transform duration-300 group-hover:scale-105" />
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

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(item.last_position_seconds)} / {formatDuration(item.video.duration)}
                </div>

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleRemove(e, item.video_id)}
                >
                  <X className="w-4 h-4 text-white" />
                </Button>
              </div>

              {/* Info */}
              <div className="mt-2">
                <h3 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {item.video.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.video.channels?.name || 'Kênh chưa xác định'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};
