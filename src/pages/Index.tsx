import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { VideoCard } from "@/components/Video/VideoCard";
import { TipModal } from "@/components/Tipping/TipModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: number; channel: string } | null>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Mock video data
  const videos = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    thumbnail: `https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop`,
    title: `Amazing Music Performance ${i + 1} - Live Concert Highlights`,
    channel: `Music Channel ${i + 1}`,
    views: `${Math.floor(Math.random() * 900 + 100)}K views`,
    timestamp: `${Math.floor(Math.random() * 12 + 1)} days ago`,
  }));

  const handleTip = (videoId: number, channel: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to tip creators",
      });
      navigate("/auth");
      return;
    }
    
    setSelectedVideo({ id: videoId, channel });
    setTipModalOpen(true);
  };

  if (loading) {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                thumbnail={video.thumbnail}
                title={video.title}
                channel={video.channel}
                views={video.views}
                timestamp={video.timestamp}
                onTip={() => handleTip(video.id, video.channel)}
              />
            ))}
          </div>
        </div>
      </main>

      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        creatorAddress="0x742d35Cc6634C0532925a3b844Bc454e4438f44e" // Mock address - will come from DB
        videoId={selectedVideo?.id.toString()}
        creatorName={selectedVideo?.channel || "Creator"}
      />
    </div>
  );
};

export default Index;
