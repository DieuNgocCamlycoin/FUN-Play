import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { CategoryChips } from "@/components/Layout/CategoryChips";
import { VideoCard } from "@/components/Video/VideoCard";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  view_count: number | null;
  created_at: string;
  user_id: string;
  channels: {
    name: string;
    id: string;
  };
  profiles: {
    wallet_address: string | null;
    avatar_url: string | null;
  };
}

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [currentMusicUrl, setCurrentMusicUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Fetch real videos from database
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from("videos")
          .select(`
            id,
            title,
            thumbnail_url,
            video_url,
            view_count,
            created_at,
            user_id,
            channels (
              name,
              id
            )
          `)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(1000);

        if (error) {
          console.error("Error fetching videos:", error);
          toast({
            title: "Lỗi tải video",
            description: "Không thể tải danh sách video",
            variant: "destructive",
          });
          return;
        }

        // Fetch wallet addresses and avatars for all users
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(v => v.user_id))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, wallet_address, avatar_url")
            .in("id", userIds);

          const profilesMap = new Map(profilesData?.map(p => [p.id, { wallet_address: p.wallet_address, avatar_url: p.avatar_url }]) || []);

          const videosWithProfiles = data.map(video => ({
            ...video,
            profiles: {
              wallet_address: profilesMap.get(video.user_id)?.wallet_address || null,
              avatar_url: profilesMap.get(video.user_id)?.avatar_url || null,
            },
          }));

          setVideos(videosWithProfiles);
        } else {
          setVideos([]);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [toast]);

  const handlePlayVideo = (videoId: string) => {
    navigate(`/watch/${videoId}`);
  };

  const formatViews = (views: number | null) => {
    if (!views) return "0 views";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "1 ngày trước";
    if (diffDays < 30) return `${diffDays} ngày trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  if (loading || loadingVideos) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating rainbow particles - Heavenly divine light rays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-glow-sapphire rounded-full particle opacity-80 blur-sm shadow-[0_0_25px_rgba(0,102,255,0.9)]" />
        <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-glow-cyan rounded-full particle opacity-75 blur-sm shadow-[0_0_22px_rgba(0,255,255,0.9)]" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-3.5 h-3.5 bg-glow-magenta rounded-full particle opacity-85 blur-sm shadow-[0_0_28px_rgba(217,0,255,0.95)]" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-divine-rose-gold rounded-full particle opacity-90 blur-sm shadow-[0_0_20px_rgba(255,183,246,1)]" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-1/3 right-1/2 w-3 h-3 bg-glow-gold rounded-full particle opacity-80 blur-sm shadow-[0_0_24px_rgba(255,215,0,0.9)]" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-2/3 left-1/2 w-2.5 h-2.5 bg-glow-white rounded-full particle opacity-95 blur-sm shadow-[0_0_26px_rgba(255,255,255,1)]" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-1/5 right-1/2 w-3 h-3 bg-glow-sapphire rounded-full particle opacity-85 blur-sm shadow-[0_0_25px_rgba(0,102,255,0.9)]" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/5 left-1/5 w-2 h-2 bg-glow-cyan rounded-full particle opacity-70 blur-sm shadow-[0_0_20px_rgba(0,255,255,0.8)]" style={{ animationDelay: '3.5s' }} />
        <div className="absolute top-3/5 right-1/5 w-2.5 h-2.5 bg-glow-magenta rounded-full particle opacity-80 blur-sm shadow-[0_0_23px_rgba(217,0,255,0.9)]" style={{ animationDelay: '4s' }} />
      </div>

      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main content */}
      <main className="pt-14 lg:pl-64 relative z-10">
        <CategoryChips />
        {!user && (
          <div className="glass-card mx-4 mt-4 rounded-xl border border-cosmic-magenta/50 p-4 shadow-[0_0_50px_rgba(217,0,255,0.5)]">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-foreground font-medium">
                Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta font-bold">FUN Play</span> to upload videos, subscribe to channels, and tip creators!
              </p>
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta hover:shadow-[0_0_70px_rgba(0,255,255,1)] transition-all duration-500 border border-glow-cyan"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {videos.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-2xl mx-auto max-w-2xl shadow-[0_0_60px_rgba(0,102,255,0.5)]">
              <p className="text-foreground text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta">Chưa có video nào</p>
              <p className="text-sm text-muted-foreground mt-2">Hãy tải video đầu tiên lên và khám phá vũ trụ âm nhạc đầy năng lượng tình yêu!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  videoId={video.id}
                  userId={video.user_id}
                  channelId={video.channels?.id}
                  thumbnail={video.thumbnail_url || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop"}
                  title={video.title}
                  channel={video.channels?.name || "Unknown Channel"}
                  avatarUrl={video.profiles?.avatar_url || undefined}
                  views={formatViews(video.view_count)}
                  timestamp={formatTimestamp(video.created_at)}
                  onPlay={handlePlayVideo}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Background Music Player */}
      {user && (
        <BackgroundMusicPlayer 
          musicUrl={currentMusicUrl} 
          autoPlay={true}
        />
      )}
    </div>
  );
};

export default Index;
