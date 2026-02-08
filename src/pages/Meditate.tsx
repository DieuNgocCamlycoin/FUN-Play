import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MeditationVideoGrid } from "@/components/Meditation/MeditationVideoGrid";
import { MeditationPlayer } from "@/components/Meditation/MeditationPlayer";
import { MeditationPlaylists } from "@/components/Meditation/MeditationPlaylists";
import { LightParticles } from "@/components/Meditation/LightParticles";
import { MeditatingAngel } from "@/components/Meditation/MeditatingAngel";
import { AmbientSoundSelector } from "@/components/Meditation/AmbientSoundSelector";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, Infinity, Moon, Sparkles, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  duration: number | null;
  view_count: number | null;
  channel_id: string;
  user_id: string;
}

const Meditate = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { playQueue, toggleShuffle, shuffleEnabled, toggleRepeat } = useMusicPlayer();

  useEffect(() => {
    fetchMeditationVideos();
  }, []);

  const fetchMeditationVideos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url, video_url, duration, view_count, channel_id, user_id")
      .eq("category", "meditation")
      .eq("is_public", true)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching meditation videos:", error);
    } else {
      setVideos(data || []);
    }
    setIsLoading(false);
  };

  const startAutoPlay = useCallback(() => {
    if (videos.length === 0) {
      toast({
        title: "Chưa có video thiền định",
        description: "Hãy upload video thiền định đầu tiên để bắt đầu!",
      });
      return;
    }
    setIsAutoPlaying(true);
    setCurrentVideoIndex(0);
    setSelectedVideo(videos[0]);
    setShowPlayer(true);
  }, [videos, toast]);

  // Play in background using global music player
  const playInBackground = useCallback(() => {
    if (videos.length === 0) {
      toast({
        title: "Chưa có video thiền định",
        description: "Hãy upload video thiền định đầu tiên để bắt đầu!",
      });
      return;
    }
    
    const tracks = videos.map(v => ({
      id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      video_url: v.video_url,
      duration: v.duration,
      channelName: "Meditate with Father",
    }));
    
    playQueue(tracks, 0);
    toast({
      title: "🎵 Đang phát nền",
      description: "Nhạc thiền đang phát trong mini player. Bạn có thể duyệt web thoải mái!",
    });
  }, [videos, playQueue, toast]);

  const handleVideoEnd = useCallback(() => {
    if (isAutoPlaying && videos.length > 0) {
      const nextIndex = (currentVideoIndex + 1) % videos.length;
      setCurrentVideoIndex(nextIndex);
      setSelectedVideo(videos[nextIndex]);
    }
  }, [isAutoPlaying, currentVideoIndex, videos]);

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setShowPlayer(true);
    setIsAutoPlaying(false);
  };

  const startSleepTimer = (minutes: number) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }
    setSleepTimer(minutes);
    sleepTimerRef.current = setTimeout(() => {
      setIsAutoPlaying(false);
      setShowPlayer(false);
      setSleepTimer(null);
      toast({
        title: "🌙 Hẹn giờ ngủ",
        description: "Video đã dừng. Chúc bạn ngủ ngon và bình an.",
      });
    }, minutes * 60 * 1000);

    toast({
      title: "⏰ Hẹn giờ đã bật",
      description: `Video sẽ tự động dừng sau ${minutes} phút`,
    });
  };

  const closePlayer = () => {
    setShowPlayer(false);
    setIsAutoPlaying(false);
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Light Particles Background with golden paradise theme */}
      <LightParticles />

      {/* Meditating Angel */}
      <MeditatingAngel />

      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-12 lg:pt-14 lg:pl-60 min-h-screen relative z-10">
        <div className="p-4 md:p-6">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-400/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                Meditate with Father
              </h1>
            </div>
            <p className="text-amber-700/70 max-w-2xl mx-auto">
              Không gian chữa lành và tái sinh năng lượng • Nơi mọi linh hồn được nghỉ ngơi trong dòng chảy ánh sáng 24/24
            </p>
          </div>

          {/* Auto Play Control */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Button
              onClick={startAutoPlay}
              className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
            >
              <Infinity className="w-6 h-6 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
              Phát liên tục 24/24
            </Button>

            <Button
              onClick={playInBackground}
              className="bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 hover:from-cyan-600 hover:via-teal-600 hover:to-cyan-600 text-white px-6 py-6 text-lg rounded-full shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
            >
              <Headphones className="w-6 h-6 mr-2" />
              Phát nền
            </Button>

            {/* Sleep Timer Options */}
            <div className="flex flex-wrap gap-2">
              {[30, 60, 180, 480].map((minutes) => (
                <Button
                  key={minutes}
                  variant="outline"
                  onClick={() => startSleepTimer(minutes)}
                  className={`border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800 bg-white/80 ${
                    sleepTimer === minutes ? 'bg-amber-100 border-amber-500' : ''
                  }`}
                >
                  <Moon className="w-4 h-4 mr-1" />
                  {minutes < 60 ? `${minutes} phút` : `${minutes / 60} giờ`}
                </Button>
              ))}
            </div>
          </div>

          {/* Ambient Sound Selector */}
          <div className="mb-8 max-w-xl mx-auto">
            <AmbientSoundSelector />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="bg-white/80 border border-amber-200 mb-6 shadow-sm">
              <TabsTrigger value="videos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-yellow-100 data-[state=active]:text-amber-800 text-amber-700">
                <Play className="w-4 h-4 mr-2" />
                Video Thiền Định
              </TabsTrigger>
              <TabsTrigger value="playlists" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-yellow-100 data-[state=active]:text-amber-800 text-amber-700">
                <Clock className="w-4 h-4 mr-2" />
                Playlist Chữa Lành
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos">
              <MeditationVideoGrid 
                videos={videos} 
                isLoading={isLoading} 
                onVideoSelect={handleVideoSelect}
              />
            </TabsContent>

            <TabsContent value="playlists">
              <MeditationPlaylists />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Meditation Player Modal */}
      {showPlayer && selectedVideo && (
        <MeditationPlayer
          video={selectedVideo}
          isAutoPlaying={isAutoPlaying}
          onVideoEnd={handleVideoEnd}
          onClose={closePlayer}
          sleepTimer={sleepTimer}
        />
      )}
    </div>
  );
};

export default Meditate;
