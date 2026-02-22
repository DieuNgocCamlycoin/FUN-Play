import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/Layout/MainLayout";
import { ProfileHeader } from "@/components/Profile/ProfileHeader";
import { ProfileInfo } from "@/components/Profile/ProfileInfo";
import { ProfileTabs } from "@/components/Profile/ProfileTabs";
import { SuspendedBanner } from "@/components/Profile/SuspendedBanner";
import { DonationCelebration } from "@/components/Profile/DonationCelebration";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import { useToast } from "@/hooks/use-toast";
import { AuthRequiredDialog } from "@/components/Auth/AuthRequiredDialog";
import { BackButton } from "@/components/ui/back-button";

interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  total_camly_rewards: number;
  pending_rewards: number | null;
  approved_reward: number | null;
  background_music_url: string | null;
  music_enabled: boolean | null;
  light_score: number | null;
  suspicious_score: number | null;
  banned: boolean | null;
  violation_level: number | null;
  facebook_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
  telegram_url: string | null;
  angelai_url: string | null;
  funplay_url: string | null;
  linkedin_url: string | null;
  zalo_url: string | null;
  social_avatars: any;
}

interface ChannelData {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  subscriber_count: number;
  user_id: string;
  is_verified?: boolean;
}

export default function Channel() {
  const { id, username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ amount: number; senderName: string } | null>(null);

  // Parse username (remove @ prefix)
  const targetUsername = username?.replace("@", "") || null;
  const targetChannelId = id || null;

  // Guard: prevent navigation to literal "undefined" or "null"
  useEffect(() => {
    if (targetUsername === "undefined" || targetUsername === "null" || targetChannelId === "undefined" || targetChannelId === "null") {
      console.warn("[Channel] Invalid param detected, redirecting to home:", { targetUsername, targetChannelId });
      navigate("/", { replace: true });
    }
  }, [targetUsername, targetChannelId, navigate]);

  useEffect(() => {
    fetchChannelAndProfile();
  }, [targetChannelId, targetUsername]);

  useEffect(() => {
    if (profile && user && channel) {
      checkSubscription();
    }
  }, [profile, user, channel]);

  // Real-time subscription for donations (skip for banned channels)
  useEffect(() => {
    if (!profile || profile.banned) return;

    const donationChannel = supabase
      .channel(`channel-donations-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donation_transactions",
          filter: `receiver_id=eq.${profile.id}`,
        },
        async (payload) => {
          const donation = payload.new as any;
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("display_name, username")
            .eq("id", donation.sender_id)
            .single();

          setCelebrationData({
            amount: donation.amount,
            senderName: senderProfile?.display_name || senderProfile?.username || "Người ẩn danh",
          });
          setShowCelebration(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(donationChannel);
    };
  }, [profile?.id]);

  // Real-time subscription for channel updates
  useEffect(() => {
    if (!channel) return;

    const channelSub = supabase
      .channel(`channel-updates-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "channels",
          filter: `id=eq.${channel.id}`,
        },
        (payload) => {
          setChannel((prev) => (prev ? { ...prev, ...(payload.new as any) } : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [channel?.id]);

  // Real-time subscription for profile updates
  useEffect(() => {
    if (!profile) return;

    const profileSub = supabase
      .channel(`profile-updates-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          setProfile(payload.new as ProfileData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
    };
  }, [profile?.id]);

  const initialLoadDone = useRef(false);

  const fetchChannelAndProfile = async () => {
    try {
      if (!initialLoadDone.current) {
        setLoading(true);
      }

      let channelData: ChannelData | null = null;
      let profileData: ProfileData | null = null;

      if (targetUsername) {
        // Detect if the param is a UUID (fallback from getProfileUrl)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(targetUsername);

        // Fetch profile by id or username accordingly
        const { data: pData, error: pError } = await supabase
          .from("profiles")
          .select("*")
          .eq(isUUID ? "id" : "username", targetUsername)
          .maybeSingle();

        if (pError) throw pError;

        // If not found by username, try previous_username for redirect
        if (!pData && !isUUID) {
          const { data: oldData } = await supabase
            .from("profiles")
            .select("username")
            .eq("previous_username", targetUsername)
            .maybeSingle();

          if (oldData?.username) {
            navigate(`/${oldData.username}`, { replace: true });
            return;
          }
          throw new Error("Không tìm thấy người dùng");
        }

        if (!pData) throw new Error("Không tìm thấy người dùng");

        // Auto-redirect UUID to clean username URL
        if (isUUID && pData.username && !pData.username.startsWith('user_')) {
          navigate(`/${pData.username}`, { replace: true });
          return;
        }

        profileData = pData;

        // Then get channel
        const { data: cData } = await supabase
          .from("channels")
          .select("*")
          .eq("user_id", pData.id)
          .maybeSingle();

        channelData = cData;
      } else if (targetChannelId) {
        // Fetch by channel ID
        const { data: cData, error: cError } = await supabase
          .from("channels")
          .select("*")
          .eq("id", targetChannelId)
          .maybeSingle();

        if (cError) throw cError;
        if (!cData) throw new Error("Không tìm thấy kênh");

        channelData = cData;

        // Then get profile
        const { data: pData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", cData.user_id)
          .maybeSingle();

        if (!pData) throw new Error("Không tìm thấy hồ sơ");
        profileData = pData;
      }

      setProfile(profileData);
      setChannel(channelData);
    } catch (error: any) {
      console.error("Error fetching channel/profile:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải trang kênh",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  };

  const checkSubscription = async () => {
    if (!user || !channel) return;

    const { data } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("channel_id", channel.id)
      .eq("subscriber_id", user.id)
      .maybeSingle();

    setIsSubscribed(!!data);
  };

  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      setShowAuthDialog(true);
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
        setIsSubscribed(false);
      } else {
        await supabase.from("subscriptions").insert({
          channel_id: channel.id,
          subscriber_id: user.id,
        });
        setIsSubscribed(true);
      }

      // Refresh channel data
      const { data: updatedChannel } = await supabase
        .from("channels")
        .select("*")
        .eq("id", channel.id)
        .single();

      if (updatedChannel) {
        setChannel(updatedChannel);
      }

      toast({
        title: isSubscribed ? "Đã hủy theo dõi" : "Đã theo dõi! 🎉",
        description: isSubscribed
          ? "Bạn đã hủy theo dõi kênh này"
          : "Bạn đã theo dõi kênh này",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <MainLayout className="pt-0">
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full animate-pulse bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))]" />
            <div className="text-muted-foreground">Đang tải trang kênh...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout className="pt-0">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy kênh</h1>
            <p className="text-muted-foreground">Kênh này không tồn tại hoặc đã bị xóa.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <MainLayout className="pt-0">
      {/* Background Music */}
      {profile.music_enabled && profile.background_music_url && (
        <BackgroundMusicPlayer musicUrl={profile.background_music_url} />
      )}

      {/* Donation Celebration */}
      {showCelebration && celebrationData && (
        <DonationCelebration
          amount={celebrationData.amount}
          senderName={celebrationData.senderName}
          onClose={() => setShowCelebration(false)}
        />
      )}

      <div className="min-h-screen bg-background">
        <div className="absolute top-4 left-4 z-20"><BackButton /></div>
        {/* Header with Cover + Avatar + Honor Board */}
        <ProfileHeader
          profile={profile}
          channel={channel}
          lightScore={profile.light_score ?? 0}
          suspiciousScore={profile.suspicious_score ?? 0}
          banned={profile.banned ?? false}
          violationLevel={profile.violation_level ?? 0}
          isOwnProfile={isOwnProfile}
          onProfileUpdate={fetchChannelAndProfile}
        />

        {/* Suspended Banner */}
        <SuspendedBanner banned={profile.banned} />

        {/* User Info + Actions */}
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <ProfileInfo
            profile={profile}
            channel={channel}
            isOwnProfile={isOwnProfile}
            isSubscribed={isSubscribed}
            onSubscribe={handleSubscribe}
            banned={profile.banned ?? false}
          />

          {/* Tabs Content */}
          <ProfileTabs
            userId={profile.id}
            channelId={channel?.id}
            isOwnProfile={isOwnProfile}
            banned={profile.banned ?? false}
          />
        </div>
      </div>
      <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </MainLayout>
  );
}
