import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, MoreVertical, ExternalLink, UserMinus } from 'lucide-react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VideoCard } from '@/components/Video/VideoCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatViews, formatViewsShort, formatTimestamp } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface SubscribedChannel {
  id: string;
  channel_id: string;
  subscribed_at: string;
  channel: {
    id: string;
    name: string;
    subscriber_count: number | null;
    user_id: string;
    is_verified: boolean | null;
    profile: { avatar_url: string | null };
  };
  latestVideos: Array<{
    id: string;
    title: string;
    thumbnail_url: string | null;
    video_url: string | null;
    view_count: number | null;
    created_at: string;
    duration: number | null;
  }>;
}

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<SubscribedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUnsubscribe = async (subId: string, channelName: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subId);
      if (error) throw error;
      setSubscriptions(prev => prev.filter(s => s.id !== subId));
      toast({ title: `Đã hủy đăng ký ${channelName}` });
    } catch (err) {
      console.error('Error unsubscribing:', err);
      toast({ title: "Lỗi hủy đăng ký", variant: "destructive" });
    }
  };

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const { data: subsData, error: subsError } = await supabase
          .from('subscriptions')
          .select(`id, channel_id, created_at, channels (id, name, subscriber_count, user_id, is_verified)`)
          .eq('subscriber_id', user.id)
          .order('created_at', { ascending: false });
        if (subsError) throw subsError;
        if (!subsData || subsData.length === 0) { setSubscriptions([]); setLoading(false); return; }

        const userIds = subsData.map((s: any) => s.channels?.user_id).filter(Boolean);
        const { data: profilesData } = await supabase.from('profiles').select('id, avatar_url').in('id', userIds);
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        const channelIds = subsData.map((s: any) => s.channel_id);
        const { data: videosData } = await supabase
          .from('videos')
          .select('id, title, thumbnail_url, video_url, view_count, created_at, duration, channel_id')
          .in('channel_id', channelIds)
          .eq('is_public', true)
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false });

        const videosByChannel = new Map<string, any[]>();
        videosData?.forEach(video => {
          const existing = videosByChannel.get(video.channel_id) || [];
          if (existing.length < 4) existing.push(video);
          videosByChannel.set(video.channel_id, existing);
        });

        setSubscriptions(subsData.map((sub: any) => ({
          id: sub.id,
          channel_id: sub.channel_id,
          subscribed_at: sub.created_at,
          channel: { ...sub.channels, profile: profilesMap.get(sub.channels?.user_id) || { avatar_url: null } },
          latestVideos: videosByChannel.get(sub.channel_id) || [],
        })));
      } catch (error) { console.error('Error fetching subscriptions:', error); }
      finally { setLoading(false); }
    };
    fetchSubscriptions();
  }, [user]);

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Đăng nhập để xem đăng ký</h2>
            <p className="text-muted-foreground mb-4">Theo dõi các kênh yêu thích của bạn</p>
            <Button onClick={() => navigate('/auth')}>Đăng nhập</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cosmic-sapphire to-cosmic-magenta flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta">Kênh đã đăng ký</h1>
              <p className="text-sm text-muted-foreground">{subscriptions.length} kênh</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-muted" /><div className="h-4 bg-muted rounded w-32" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, j) => <div key={j} className="aspect-video bg-muted rounded-lg" />)}</div>
              </div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Chưa đăng ký kênh nào</h2>
            <p className="text-muted-foreground mb-4">Đăng ký các kênh để xem video mới nhất ở đây</p>
            <Button onClick={() => navigate('/')}>Khám phá kênh</Button>
          </div>
        ) : (
          <div className="space-y-10">
            {subscriptions.map((sub) => (
              <div key={sub.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/channel/${sub.channel.id}`)}>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={sub.channel.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-cosmic-sapphire to-cosmic-cyan text-white">{sub.channel.name?.charAt(0) || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <h2 className="font-semibold hover:text-primary transition-colors">{sub.channel.name}</h2>
                        {sub.channel.is_verified && (
                          <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatViewsShort(sub.channel.subscriber_count)} người đăng ký</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/channel/${sub.channel.id}`)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Chuyển đến kênh
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleUnsubscribe(sub.id, sub.channel.name)}
                        className="text-destructive focus:text-destructive"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Hủy đăng ký
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {sub.latestVideos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Chưa có video nào</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sub.latestVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        videoId={video.id}
                        title={video.title}
                        thumbnail={video.thumbnail_url || undefined}
                        videoUrl={video.video_url || undefined}
                        channel={sub.channel.name}
                        channelId={sub.channel.id}
                        userId={sub.channel.user_id}
                        avatarUrl={sub.channel.profile?.avatar_url || undefined}
                        duration={video.duration}
                        isVerified={sub.channel.is_verified || false}
                        views={formatViews(video.view_count)}
                        timestamp={formatTimestamp(video.created_at)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Subscriptions;
