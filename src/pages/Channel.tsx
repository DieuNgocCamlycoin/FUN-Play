import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "@/components/Video/VideoCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";

interface Channel {
  id: string;
  name: string;
  description: string;
  banner_url: string;
  subscriber_count: number;
  user_id: string;
}

interface Profile {
  background_music_url: string | null;
  music_enabled: boolean | null;
}

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  created_at: string;
}

export default function Channel() {
  const { id, username } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id || username) {
      fetchChannel();
    }
  }, [id, username, user]);

  useEffect(() => {
    if (channel) {
      fetchVideos();
      if (user) {
        checkSubscription();
      }
    }
  }, [channel, user]);

  const fetchChannel = async () => {
    try {
      let query = supabase.from("channels").select("*");
      
      if (username) {
        // First get profile by username
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .single();
          
        if (profileError) throw profileError;
        
        // Then get channel by user_id
        query = query.eq("user_id", profileData.id);
      } else {
        query = query.eq("id", id);
      }
      
      const { data, error } = await query.single();

      if (error) throw error;
      setChannel(data);

      // Fetch profile for background music
      const { data: profileData } = await supabase
        .from("profiles")
        .select("background_music_url, music_enabled")
        .eq("id", data.user_id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    } catch (error: any) {
      toast({
        title: "Error loading channel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    if (!channel) return;
    
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, view_count, created_at")
        .eq("channel_id", channel.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error("Error loading videos:", error);
    }
  };

  const checkSubscription = async () => {
    if (!user || !channel) return;

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("channel_id", channel.id)
        .eq("subscriber_id", user.id)
        .maybeSingle();

      setIsSubscribed(!!data);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!channel) return;

    try {
      if (isSubscribed) {
        await supabase
          .from("subscriptions")
          .delete()
          .eq("channel_id", channel.id)
          .eq("subscriber_id", user.id);

        await supabase
          .from("channels")
          .update({ subscriber_count: (channel?.subscriber_count || 1) - 1 })
          .eq("id", channel.id);

        setIsSubscribed(false);
      } else {
        await supabase.from("subscriptions").insert({
          channel_id: channel.id,
          subscriber_id: user.id,
        });

        await supabase
          .from("channels")
          .update({ subscriber_count: (channel?.subscriber_count || 0) + 1 })
          .eq("id", channel.id);

        setIsSubscribed(true);
      }

      fetchChannel();
      toast({
        title: isSubscribed ? "Unsubscribed" : "Subscribed!",
        description: isSubscribed
          ? "You've unsubscribed from this channel"
          : "You've subscribed to this channel",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Channel not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        {profile?.music_enabled && profile.background_music_url && (
          <BackgroundMusicPlayer musicUrl={profile.background_music_url} />
        )}

        {/* Channel Banner */}
        <div className="relative h-48 bg-gradient-to-r from-primary to-secondary">
          {channel.banner_url && (
            <img
              src={channel.banner_url}
              alt={channel.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Channel Info */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl flex-shrink-0">
              {channel.name[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                {channel.name}
              </h1>
              <p className="text-muted-foreground mb-2">
                {channel.subscriber_count || 0} subscribers
              </p>
              {channel.description && (
                <p className="text-sm text-foreground">{channel.description}</p>
              )}
            </div>
            <Button
              onClick={handleSubscribe}
              variant={isSubscribed ? "secondary" : "default"}
              className="rounded-full"
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="videos">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    videoId={video.id}
                    thumbnail={video.thumbnail_url || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop"}
                    title={video.title}
                    channel={channel.name}
                    views={`${video.view_count || 0} views`}
                    timestamp={new Date(video.created_at).toLocaleDateString()}
                    onPlay={(id) => navigate(`/watch/${id}`)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="playlists">
              <p className="text-muted-foreground">No playlists yet</p>
            </TabsContent>

            <TabsContent value="about">
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  About
                </h2>
                <p className="text-foreground">{channel.description}</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
