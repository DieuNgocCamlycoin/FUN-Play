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
import { Copy, QrCode, Share2 } from "lucide-react";
import { Honobar } from "@/components/Layout/Honobar";
import { GlassmorphismStats } from "@/components/Profile/GlassmorphismStats";
import { RewardClaimSection } from "@/components/Profile/RewardClaimSection";
import { ProfileActionButtonsShiny } from "@/components/Profile/ProfileActionButtonsShiny";
import { PremiumStarfieldBackground } from "@/components/Layout/PremiumStarfieldBackground";
import { QRCodeSVG } from "qrcode.react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  bio: string | null;
  wallet_address: string | null;
  avatar_url: string | null;
  display_name: string | null;
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
  const [showQRCode, setShowQRCode] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string>("");
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

  // Real-time subscription for channel updates (subscriber count)
  useEffect(() => {
    if (!channel) return;

    const channelSub = supabase
      .channel(`channel-updates-${channel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'channels',
          filter: `id=eq.${channel.id}`,
        },
        (payload) => {
          console.log('Channel updated in real-time:', payload);
          setChannel(prev => prev ? { ...prev, ...payload.new as any } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [channel?.id]);

  // Real-time subscription for profile updates (avatar, bio, etc.)
  useEffect(() => {
    if (!channel) return;

    const profileSub = supabase
      .channel(`profile-updates-${channel.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${channel.user_id}`,
        },
        (payload) => {
          console.log('Profile updated in real-time:', payload);
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
    };
  }, [channel?.user_id]);

  // Listen for profile-updated event to refetch profile data
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (channel) {
        fetchChannel();
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [channel]);

  const fetchChannel = async () => {
    try {
      let query = supabase.from("channels").select("*");
      
      if (username) {
        // First get profile by username
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.replace('@', ''))
          .maybeSingle();
          
        if (profileError || !profileData) {
          throw new Error("Profile not found");
        }
        
        // Then get channel by user_id
        query = query.eq("user_id", profileData.id);
      } else {
        query = query.eq("id", id);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      
      if (!data) {
        throw new Error("Channel not found");
      }
      
      setChannel(data);

      // Fetch profile for background music and avatar
      const { data: profileData } = await supabase
        .from("profiles")
        .select("background_music_url, music_enabled, bio, wallet_address, avatar_url, display_name")
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

  const detectWalletAddress = (text: string): { before: string; address: string; after: string } | null => {
    const walletRegex = /(0x[a-fA-F0-9]{40})/;
    const match = text.match(walletRegex);
    if (match) {
      const index = match.index!;
      return {
        before: text.substring(0, index),
        address: match[1],
        after: text.substring(index + match[1].length),
      };
    }
    return null;
  };

  const renderBioWithHighlight = (bio: string) => {
    const detected = detectWalletAddress(bio);
    if (detected) {
      return (
        <>
          {detected.before}
          <span 
            className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-400 cursor-pointer hover:underline"
            onClick={() => {
              setSelectedWalletAddress(detected.address);
              setShowQRCode(true);
            }}
          >
            {detected.address}
          </span>
          {detected.after}
        </>
      );
    }
    return bio;
  };

  const shareChannel = (platform: string) => {
    const channelUrl = `${window.location.origin}/c/${username || id}`;
    const text = `Check out ${channel?.name} on FUN PLAY!`;
    
    let shareUrl = "";
    switch (platform) {
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(channelUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(channelUrl)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(channelUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case "zalo":
        shareUrl = `https://zalo.me/share?url=${encodeURIComponent(channelUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(channelUrl);
        toast({
          title: "Đã copy",
          description: "Đã sao chép link kênh vào clipboard",
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
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
    <div className="min-h-screen bg-background relative">
      <PremiumStarfieldBackground />
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-16 lg:pl-64 relative z-10">
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
          {/* Honobar positioned in top-right corner */}
          <Honobar />
        </div>

        {/* Channel Info */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Glassmorphism Stats */}
          <GlassmorphismStats userId={channel.user_id} channelId={channel.id} />

          {/* Reward Claim Section */}
          <RewardClaimSection userId={channel.user_id} isOwnProfile={user?.id === channel.user_id} />

          {/* Shiny Action Buttons - only show on own profile */}
          {user?.id === channel.user_id && (
            <ProfileActionButtonsShiny 
              username={profile?.display_name || channel.name}
              onClaimClick={() => setShowClaimModal(true)}
            />
          )}
          <div className="flex items-start gap-6 mb-6">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={channel.name}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-primary shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl flex-shrink-0">
                {channel.name[0]}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                {channel.name}
              </h1>
              <div className="flex items-center gap-4 mb-2">
                <p className="text-muted-foreground font-semibold">
                  {(channel.subscriber_count || 0).toLocaleString()} người đăng ký
                </p>
                <p className="text-muted-foreground font-semibold">
                  {videos.length} video{videos.length !== 1 ? 's' : ''}
                </p>
                <p className="text-muted-foreground font-semibold">
                  {videos.reduce((sum, v) => sum + (v.view_count || 0), 0).toLocaleString()} lượt xem
                </p>
              </div>
              {channel.description && (
                <p className="text-sm text-foreground">{channel.description}</p>
              )}
              {profile?.bio && (
                <div className="mt-3 p-3 bg-card/50 border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-all flex-1 font-mono">
                      {renderBioWithHighlight(profile.bio)}
                    </p>
                    <div className="flex gap-1 flex-shrink-0">
                      {detectWalletAddress(profile.bio) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const detected = detectWalletAddress(profile.bio || "");
                            if (detected) {
                              setSelectedWalletAddress(detected.address);
                              setShowQRCode(true);
                            }
                          }}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(profile.bio || "");
                          toast({
                            title: "Đã copy",
                            description: "Đã sao chép Bio vào clipboard",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => shareChannel("copy")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareChannel("telegram")}>
                    Telegram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareChannel("zalo")}>
                    Zalo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareChannel("facebook")}>
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareChannel("twitter")}>
                    Twitter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={handleSubscribe}
                className={`rounded-full px-6 ${
                  isSubscribed
                    ? "bg-muted hover:bg-muted/80 text-foreground"
                    : "bg-gradient-to-r from-cosmic-sapphire to-cosmic-cyan hover:from-cosmic-sapphire/90 hover:to-cosmic-cyan/90 text-foreground shadow-[0_0_30px_rgba(0,255,255,0.5)]"
                }`}
              >
                {isSubscribed ? "Đã đăng ký" : "Đăng ký"}
              </Button>
            </div>
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
                    userId={channel.user_id}
                    channelId={channel.id}
                    thumbnail={video.thumbnail_url || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop"}
                    title={video.title}
                    channel={channel.name}
                    avatarUrl={profile?.avatar_url || undefined}
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

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - Địa chỉ ví</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-6">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={selectedWalletAddress} size={200} />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all font-mono">
              {selectedWalletAddress}
            </p>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(selectedWalletAddress);
                toast({
                  title: "Đã copy",
                  description: "Đã sao chép địa chỉ ví vào clipboard",
                });
              }}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy địa chỉ ví
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
