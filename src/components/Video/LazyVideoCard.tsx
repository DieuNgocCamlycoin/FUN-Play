import { memo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { VideoCard } from './VideoCard';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyVideoCardProps {
  videoId: string;
  thumbnail?: string;
  title: string;
  channel: string;
  avatarUrl?: string;
  channelId?: string;
  userId: string;
  views: string;
  timestamp: string;
  onPlay: (videoId: string) => void;
}

const VideoCardSkeleton = () => (
  <div className="glass-card overflow-hidden rounded-xl p-2">
    <Skeleton className="aspect-video w-full rounded-xl bg-gradient-to-r from-cosmic-cyan/20 via-cosmic-magenta/20 to-cosmic-gold/20" />
    <div className="pt-3 flex gap-3">
      <Skeleton className="w-9 h-9 rounded-full bg-gradient-to-br from-cosmic-sapphire/30 to-cosmic-cyan/30" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full bg-gradient-to-r from-cosmic-cyan/20 to-cosmic-magenta/20" />
        <Skeleton className="h-3 w-3/4 bg-cosmic-sapphire/20" />
        <Skeleton className="h-3 w-1/2 bg-cosmic-gold/20" />
      </div>
    </div>
  </div>
);

export const LazyVideoCard = memo(({
  videoId,
  thumbnail,
  title,
  channel,
  avatarUrl,
  channelId,
  userId,
  views,
  timestamp,
  onPlay,
}: LazyVideoCardProps) => {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px',
    freezeOnceVisible: true,
  });

  return (
    <div ref={ref}>
      {isVisible ? (
        <VideoCard
          videoId={videoId}
          thumbnail={thumbnail}
          title={title}
          channel={channel}
          avatarUrl={avatarUrl}
          channelId={channelId}
          userId={userId}
          views={views}
          timestamp={timestamp}
          onPlay={onPlay}
        />
      ) : (
        <VideoCardSkeleton />
      )}
    </div>
  );
});

LazyVideoCard.displayName = 'LazyVideoCard';
