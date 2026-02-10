import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/Layout/MainLayout";
import { ProfileHeader } from "@/components/Profile/ProfileHeader";
import { ProfileInfo } from "@/components/Profile/ProfileInfo";
import { ProfileTabs } from "@/components/Profile/ProfileTabs";
import { ProfileHonorBoard } from "@/components/Profile/ProfileHonorBoard";
import { DonationCelebration } from "@/components/Profile/DonationCelebration";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import { useToast } from "@/hooks/use-toast";
import { AuthRequiredDialog } from "@/components/Auth/AuthRequiredDialog";

interface UserProfileData {
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
}

interface ChannelData {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  subscriber_count: number;
  user_id: string;
}

export default function UserProfile() {
  const { userId, username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ amount: number; senderName: string } | null>(null);

  // Determine target user ID
  const targetUserId = userId || null;
  const targetUsername = username?.replace('@', '') || null;

  useEffect(() => {
    fetchUserProfile();
  }, [targetUserId, targetUsername]);

  useEffect(() => {
    if (profile && user) {
      checkSubscription();
    }
  }, [profile, user]);

  // Real-time subscription for donations
  useEffect(() => {
    if (!profile) return;

    const donationChannel = supabase
      .channel(`user-donations-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donation_transactions',
          filter: `receiver_id=eq.${profile.id}`,
        },
        async (payload) => {
          const donation = payload.new as any;
          // Fetch sender info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', donation.sender_id)
            .single();

          setCelebrationData({
            amount: donation.amount,
            senderName: senderProfile?.display_name || senderProfile?.username || 'Người ẩn danh',
          });
          setShowCelebration(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(donationChannel);
    };
  }, [profile?.id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      let profileQuery = supabase.from("profiles").select("*");

      if (targetUserId) {
        profileQuery = profileQuery.eq("id", targetUserId);
      } else if (targetUsername) {
        profileQuery = profileQuery.eq("username", targetUsername);
      } else {
        throw new Error("Không tìm thấy thông tin người dùng");
      }

      const { data: profileData, error: profileError } = await profileQuery.maybeSingle();
      if (profileError) throw profileError;
      if (!profileData) throw new Error("Người dùng không tồn tại");

      setProfile(profileData);

      // Fetch channel
      const { data: channelData, error: channelError } = await supabase
        .from("channels")
        .select("*")
        .eq("user_id", profileData.id)
        .maybeSingle();

      if (channelData) {
        setChannel(channelData);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải trang cá nhân",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <div className="text-muted-foreground">Đang tải trang cá nhân...</div>
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy người dùng</h1>
            <p className="text-muted-foreground">Người dùng này không tồn tại hoặc đã bị xóa.</p>
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
        {/* Header with Cover + Avatar + Honor Board */}
        <ProfileHeader
          profile={profile}
          channel={channel}
        />

        {/* User Info + Actions */}
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <ProfileInfo
            profile={profile}
            channel={channel}
            isOwnProfile={isOwnProfile}
            isSubscribed={isSubscribed}
            onSubscribe={handleSubscribe}
          />

          {/* Tabs Content */}
          <ProfileTabs
            userId={profile.id}
            channelId={channel?.id}
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>
      <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </MainLayout>
  );
}
