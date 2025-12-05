import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LuxuryAvatar } from "@/components/Profile/LuxuryAvatar";
import { LuxuryHonobar } from "@/components/Profile/LuxuryHonobar";
import { LuxuryStatsCards } from "@/components/Profile/LuxuryStatsCards";
import { RewardZone } from "@/components/Profile/RewardZone";
import { EarningMechanics } from "@/components/Profile/EarningMechanics";
import { ProfileActionButtons } from "@/components/Profile/ProfileActionButtons";
import { StarfieldBackground } from "@/components/Profile/StarfieldBackground";
import { KYCButton } from "@/components/Profile/KYCButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  total_camly_rewards: number;
}

interface ChannelData {
  id: string;
  name: string;
  subscriber_count: number;
  user_id: string;
}

export default function UserProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Stats
  const [followers, setFollowers] = useState(0);
  const [videos, setVideos] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  
  // Earnings breakdown
  const [uploadRewards, setUploadRewards] = useState(0);
  const [viewRewards, setViewRewards] = useState(0);
  const [commentRewards, setCommentRewards] = useState(0);
  const [referralRewards, setReferralRewards] = useState(0);
  const [referralCount, setReferralCount] = useState(0);

  // KYC status (placeholder - would come from backend)
  const [isKYCVerified] = useState(false);

  const isOwnProfile = user?.id === profile?.id;

  useEffect(() => {
    if (username) {
      fetchProfileData();
    }
  }, [username]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile by username
      const cleanUsername = username?.replace('@', '');
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (profileError || !profileData) {
        toast({ title: "Profile not found", variant: "destructive" });
        navigate("/");
        return;
      }

      setProfile(profileData);

      // Fetch channel
      const { data: channelData } = await supabase
        .from("channels")
        .select("*")
        .eq("user_id", profileData.id)
        .maybeSingle();

      if (channelData) {
        setChannel(channelData);
        setFollowers(channelData.subscriber_count || 0);
      }

      // Fetch videos stats
      const { data: videosData } = await supabase
        .from("videos")
        .select("id, view_count, comment_count")
        .eq("user_id", profileData.id);

      if (videosData) {
        setVideos(videosData.length);
        setTotalViews(videosData.reduce((sum, v) => sum + (v.view_count || 0), 0));
        setTotalComments(videosData.reduce((sum, v) => sum + (v.comment_count || 0), 0));
      }

      // Fetch earnings breakdown from reward_transactions
      const { data: rewardData } = await supabase
        .from("reward_transactions")
        .select("amount, reward_type")
        .eq("user_id", profileData.id);

      if (rewardData) {
        let uploads = 0, views = 0, comments = 0, referrals = 0;
        rewardData.forEach(r => {
          const amount = Number(r.amount);
          switch (r.reward_type) {
            case 'UPLOAD': uploads += amount; break;
            case 'VIEW': views += amount; break;
            case 'COMMENT': comments += amount; break;
            case 'REFERRAL': referrals += amount; break;
          }
        });
        setUploadRewards(uploads);
        setViewRewards(views);
        setCommentRewards(comments);
        setReferralRewards(referrals);
      }

    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[hsl(var(--cosmic-cyan))] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Starfield Background */}
      <StarfieldBackground />

      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-20 pb-8 lg:pl-64 relative z-10">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* Profile Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative pt-8"
          >
            {/* Header row with Avatar and KYC button */}
            <div className="flex items-start justify-between">
              {/* Left spacer for centering avatar */}
              <div className="w-24 hidden sm:block" />
              
              {/* Center: Avatar with rainbow border */}
              <div className="flex flex-col items-center text-center flex-1">
                <LuxuryAvatar
                  avatarUrl={profile.avatar_url}
                  displayName={profile.display_name}
                  username={profile.username}
                  userId={profile.id}
                  isOwnProfile={isOwnProfile}
                  onUpdate={fetchProfileData}
                />

                {/* Name & Username */}
                <motion.h1
                  className="mt-6 text-3xl font-black bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] bg-clip-text text-transparent drop-shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {profile.display_name || profile.username}
                </motion.h1>
                <motion.p
                  className="text-muted-foreground font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  @{profile.username}
                </motion.p>

                {/* Bio */}
                {profile.bio && (
                  <motion.p
                    className="mt-3 max-w-md text-sm text-foreground/80 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {profile.bio}
                  </motion.p>
                )}
              </div>

              {/* Right: KYC Button */}
              {isOwnProfile && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute right-0 top-8 sm:relative sm:right-auto sm:top-auto"
                >
                  <KYCButton
                    isVerified={isKYCVerified}
                    onClick={() => setShowKYCModal(true)}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Honorbar - Achievement Badge System */}
          <LuxuryHonobar totalRewards={profile.total_camly_rewards} />

          {/* Real Stats Section */}
          <LuxuryStatsCards
            followers={followers}
            videos={videos}
            totalViews={totalViews}
            comments={totalComments}
            rewardsEarned={profile.total_camly_rewards}
          />

          {/* Reward Zone */}
          <div id="reward-zone">
            <RewardZone
              totalRewards={profile.total_camly_rewards}
              claimableBalance={isKYCVerified ? profile.total_camly_rewards : 0}
              isKYCVerified={isKYCVerified}
              walletAddress={profile.wallet_address}
              onClaimSuccess={fetchProfileData}
            />
          </div>

          {/* Earning Mechanics */}
          <EarningMechanics
            uploadRewards={uploadRewards}
            viewRewards={viewRewards}
            commentRewards={commentRewards}
            referralRewards={referralRewards}
            referralCount={referralCount}
          />

          {/* Action Buttons */}
          {isOwnProfile && (
            <ProfileActionButtons
              isKYCVerified={isKYCVerified}
              onKYCClick={() => setShowKYCModal(true)}
              referralCode={profile.username}
            />
          )}
        </div>
      </main>

      {/* KYC Modal */}
      <Dialog open={showKYCModal} onOpenChange={setShowKYCModal}>
        <DialogContent className="bg-gradient-to-br from-background via-background to-[hsl(var(--cosmic-purple)/0.1)] border-2 border-green-500/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-green-400 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              KYC Verification
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              Complete KYC verification to unlock reward claims and withdrawals.
            </p>
            <p className="text-sm text-amber-400 mb-6">
              This feature is coming soon. Your rewards are safe and will be available to claim once KYC is enabled.
            </p>
            <Button
              onClick={() => setShowKYCModal(false)}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
