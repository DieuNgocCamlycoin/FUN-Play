import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Play } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MobileHeader } from '@/components/Layout/MobileHeader';
import { MobileDrawer } from '@/components/Layout/MobileDrawer';
import { MobileBottomNav } from '@/components/Layout/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultThumbnail } from '@/lib/defaultThumbnails';

interface SubscribedChannel {
  id: string;
  channel_id: string;
  subscribed_at: string;
  channel: {
    id: string;
    name: string;
    subscriber_count: number | null;
    user_id: string;
    profile: {
      avatar_url: string | null;
    };
  };
  latestVideos: Array<{
    id: string;
    title: string;
    thumbnail_url: string | null;
    view_count: number | null;
    created_at: string;
    duration: number | null;
  }>;
}

const Subscriptions = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscribedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch subscriptions
        const { data: subsData, error: subsError } = await supabase
          .from('subscriptions')
          .select(`
            id,
            channel_id,
            created_at,
            channels (
              id,
              name,
              subscriber_count,
              user_id
            )
          `)
          .eq('subscriber_id', user.id)
          .order('created_at', { ascending: false });

        if (subsError) throw subsError;

        if (!subsData || subsData.length === 0) {
          setSubscriptions([]);
          setLoading(false);
          return;
        }

        // Fetch profiles for channels
        const userIds = subsData.map((s: any) => s.channels?.user_id).filter(Boolean);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Fetch latest videos for each channel
        const channelIds = subsData.map((s: any) => s.channel_id);
        const { data: videosData } = await supabase
          .from('videos')
          .select('id, title, thumbnail_url, view_count, created_at, duration, channel_id')
          .in('channel_id', channelIds)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        // Group videos by channel
        const videosByChannel = new Map<string, any[]>();
        videosData?.forEach(video => {
          const existing = videosByChannel.get(video.channel_id) || [];
          if (existing.length < 4) {
            existing.push(video);
          }
          videosByChannel.set(video.channel_id, existing);
        });

        // Combine data
        const formattedSubs = subsData.map((sub: any) => ({
          id: sub.id,
          channel_id: sub.channel_id,
          subscribed_at: sub.created_at,
          channel: {
            ...sub.channels,
            profile: profilesMap.get(sub.channels?.user_id) || { avatar_url: null },
          },
          latestVideos: videosByChannel.get(sub.channel_id) || [],
        }));

        setSubscriptions(formattedSubs);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user]);

  const formatViews = (views: number | null) => {
    if (!views) return '0 lượt xem';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M lượt xem`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K lượt xem`;
    return `${views} lượt xem`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return '1 ngày trước';
    if (diffDays < 30) return `${diffDays} ngày trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Desktop Header & Sidebar */}
        <div className="hidden lg:block">
          <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Mobile Header & Drawer */}
        <div className="lg:hidden">
          <MobileHeader onMenuClick={() => setIsMobileDrawerOpen(true)} />
          <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
          <MobileBottomNav />
        </div>

        <main className="pt-14 pb-20 lg:pb-0 lg:pl-64 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Đăng nhập để xem đăng ký</h2>
            <p className="text-muted-foreground mb-4">
              Theo dõi các kênh yêu thích của bạn
            </p>
            <Button onClick={() => navigate('/auth')}>
              Đăng nhập
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header & Sidebar */}
      <div className="hidden lg:block">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Mobile Header & Drawer */}
      <div className="lg:hidden">
        <MobileHeader onMenuClick={() => setIsMobileDrawerOpen(true)} />
        <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
        <MobileBottomNav />
      </div>

      <main className="pt-14 pb-20 lg:pb-0 lg:pl-64">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cosmic-cyan to-glow-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta">
                  Kênh đã đăng ký
                </h1>
                <p className="text-sm text-muted-foreground">
                  {subscriptions.length} kênh
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="h-4 bg-muted rounded w-32" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="aspect-video bg-muted rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Chưa đăng ký kênh nào</h2>
              <p className="text-muted-foreground mb-4">
                Đăng ký các kênh để xem video mới nhất ở đây
              </p>
              <Button onClick={() => navigate('/')}>
                Khám phá kênh
              </Button>
            </div>
          ) : (
            <div className="space-y-10">
              {subscriptions.map((sub) => (
                <div key={sub.id}>
                  {/* Channel header */}
                  <div 
                    className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/channel/${sub.channel.id}`)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={sub.channel.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-cosmic-sapphire to-cosmic-cyan text-white">
                        {sub.channel.name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold hover:text-primary transition-colors">
                        {sub.channel.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {sub.channel.subscriber_count || 0} người đăng ký
                      </p>
                    </div>
                  </div>

                  {/* Videos grid */}
                  {sub.latestVideos.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      Chưa có video nào
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {sub.latestVideos.map((video) => (
                        <div
                          key={video.id}
                          className="group cursor-pointer"
                          onClick={() => navigate(`/watch/${video.id}`)}
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={video.thumbnail_url || getDefaultThumbnail(video.id)}
                              alt={video.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                              {formatDuration(video.duration)}
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-10 h-10 text-white fill-white" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {video.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatViews(video.view_count)} • {formatTimestamp(video.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Subscriptions;
