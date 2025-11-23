import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { CategoryChips } from "@/components/Layout/CategoryChips";
import { VideoCard } from "@/components/Video/VideoCard";
import { TipModal } from "@/components/Tipping/TipModal";
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
  channels: {
    name: string;
    id: string;
  };
  profiles: {
    wallet_address: string | null;
  };
}

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; channel: string; walletAddress: string | null } | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
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
          .limit(24);

        if (error) {
          console.error("Error fetching videos:", error);
          toast({
            title: "Lỗi tải video",
            description: "Không thể tải danh sách video",
            variant: "destructive",
          });
          return;
        }

        // Fetch wallet addresses for all users
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(v => v.user_id))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, wallet_address")
            .in("id", userIds);

          const profilesMap = new Map(profilesData?.map(p => [p.id, p.wallet_address]) || []);

          const videosWithProfiles = data.map(video => ({
            ...video,
            profiles: {
              wallet_address: profilesMap.get(video.user_id) || null,
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

  const handleTip = async (videoId: string, channel: string, walletAddress: string | null) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to tip creators",
      });
      navigate("/auth");
      return;
    }

    // Check if user has set their wallet address
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.wallet_address) {
      toast({
        title: "Wallet Not Set",
        description: "Please set your wallet address in settings first",
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
            Go to Settings
          </Button>
        ),
      });
      return;
    }

    setSelectedVideo({ id: videoId, channel, walletAddress });
    setTipModalOpen(true);
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
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main content */}
      <main className="pt-14 lg:pl-64">
        <CategoryChips />
        {!user && (
          <div className="bg-primary/10 border-b border-primary/20 p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-foreground">
                Join FUN PLAY to upload videos, subscribe to channels, and tip creators!
              </p>
              <Button onClick={() => navigate("/auth")} variant="default">
                Sign In
              </Button>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Chưa có video nào</p>
              <p className="text-sm text-muted-foreground mt-2">Hãy tải video đầu tiên lên!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  thumbnail={video.thumbnail_url || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop"}
                  title={video.title}
                  channel={video.channels?.name || "Unknown Channel"}
                  views={formatViews(video.view_count)}
                  timestamp={formatTimestamp(video.created_at)}
                  onTip={() => handleTip(video.id, video.channels?.name || "Unknown", video.profiles?.wallet_address || null)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        creatorAddress={selectedVideo?.walletAddress || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"}
        videoId={selectedVideo?.id}
        creatorName={selectedVideo?.channel || "Creator"}
      />
    </div>
  );
};

export default Index;
