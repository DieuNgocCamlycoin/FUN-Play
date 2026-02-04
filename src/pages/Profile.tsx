import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Settings, ChevronRight, Play, Download, Plus, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useOfflineVideos } from "@/hooks/useOfflineVideos";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MobileBottomNav } from "@/components/Layout/MobileBottomNav";

interface ChannelInfo {
  id: string;
  subscriber_count: number;
  video_count: number;
}

interface Playlist {
  id: string;
  name: string;
  video_count: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { watchHistory, loading: historyLoading } = useWatchHistory();
  const { videos: offlineVideos, getCount } = useOfflineVideos();
  
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [watchLaterCount, setWatchLaterCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      // Fetch channel info
      const { data: channelData } = await supabase
        .from("channels")
        .select("id, subscriber_count")
        .eq("user_id", user.id)
        .maybeSingle();

      if (channelData) {
        // Get video count
        const { count: videoCount } = await supabase
          .from("videos")
          .select("*", { count: "exact", head: true })
          .eq("channel_id", channelData.id);

        setChannel({
          id: channelData.id,
          subscriber_count: channelData.subscriber_count || 0,
          video_count: videoCount || 0,
        });
      }

      // Fetch playlists with video counts
      const { data: playlistData } = await supabase
        .from("playlists")
        .select(`
          id,
          name,
          playlist_videos(count)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (playlistData) {
        setPlaylists(
          playlistData.map((p) => ({
            id: p.id,
            name: p.name,
            video_count: (p.playlist_videos as any)?.[0]?.count || 0,
          }))
        );
      }

      // Fetch watch later count
      const { count: wlCount } = await supabase
        .from("watch_later")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setWatchLaterCount(wlCount || 0);
    };

    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    const fetchOfflineCount = async () => {
      const count = await getCount();
      setOfflineCount(count);
    };
    fetchOfflineCount();
  }, [getCount, offlineVideos]);

  if (!user) return null;

  const displayName = profile?.display_name || profile?.username || "User";
  const username = profile?.username || "user";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate("/")}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* User Info Section */}
      <div className="px-4 py-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-75 animate-pulse" />
            <Avatar className="relative h-20 w-20 border-2 border-background">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">@{username}</p>
          
          <p className="text-sm text-muted-foreground mt-1">
            {channel?.subscriber_count || 0} người đăng ký • {channel?.video_count || 0} video
          </p>
          
          <Button
            variant="ghost"
            className="mt-2 text-primary hover:text-primary/80"
            onClick={() => channel && navigate(`/channel/${channel.id}`)}
          >
            Xem kênh <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Watch History Section */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Video đã xem</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
            Xem tất cả
          </Button>
        </div>

        {historyLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-36 animate-pulse">
                <div className="aspect-video bg-muted rounded-lg mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : watchHistory.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {watchHistory.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-36 cursor-pointer"
                onClick={() => navigate(`/watch/${item.video_id}`)}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                  {item.video?.thumbnail_url ? (
                    <img
                      src={item.video.thumbnail_url}
                      alt={item.video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Progress bar */}
                  {item.video?.duration && item.last_position_seconds > 0 && (
                    <div className="absolute bottom-0 left-0 right-0">
                      <Progress 
                        value={(item.last_position_seconds / item.video.duration) * 100} 
                        className="h-1 rounded-none"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-foreground line-clamp-2">
                  {item.video?.title || "Video"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <Play className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có video đã xem</p>
          </Card>
        )}
      </div>

      {/* Playlists Section */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Danh sách phát</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/manage-playlists")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Watch Later special playlist */}
          <div
            className="flex-shrink-0 w-32 cursor-pointer"
            onClick={() => navigate("/watch-later")}
          >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 mb-2 flex items-center justify-center">
              <Clock className="h-8 w-8 text-primary" />
              <span className="absolute bottom-1 right-1 text-xs bg-background/80 px-1.5 py-0.5 rounded">
                {watchLaterCount}
              </span>
            </div>
            <p className="text-xs text-foreground line-clamp-1">Xem sau</p>
          </div>

          {/* User playlists */}
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="flex-shrink-0 w-32 cursor-pointer"
              onClick={() => navigate(`/playlist/${playlist.id}`)}
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2 flex items-center justify-center">
                <div className="text-muted-foreground">
                  <div className="w-6 h-0.5 bg-current mb-1" />
                  <div className="w-6 h-0.5 bg-current mb-1" />
                  <div className="w-6 h-0.5 bg-current" />
                </div>
                <span className="absolute bottom-1 right-1 text-xs bg-background/80 px-1.5 py-0.5 rounded">
                  {playlist.video_count}
                </span>
              </div>
              <p className="text-xs text-foreground line-clamp-1">{playlist.name}</p>
            </div>
          ))}

          {playlists.length === 0 && (
            <div
              className="flex-shrink-0 w-32 cursor-pointer"
              onClick={() => navigate("/manage-playlists")}
            >
              <div className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 mb-2 flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground text-center">Tạo playlist</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4">
        {/* Your Videos */}
        <button
          className="w-full flex items-center justify-between py-4 border-b border-border hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/your-videos-mobile")}
        >
          <div className="flex items-center gap-4">
            <Play className="h-6 w-6 text-foreground" />
            <span className="text-base text-foreground">Video của bạn</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Downloaded Videos */}
        <button
          className="w-full flex items-center justify-between py-4 border-b border-border hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/downloads")}
        >
          <div className="flex items-center gap-4">
            <Download className="h-6 w-6 text-foreground" />
            <span className="text-base text-foreground">Nội dung tải xuống</span>
          </div>
          <div className="flex items-center gap-2">
            {offlineCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {offlineCount}
              </span>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </button>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Profile;
