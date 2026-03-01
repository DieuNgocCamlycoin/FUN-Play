import { motion } from "framer-motion";
import { ProfileHonorBoard } from "./ProfileHonorBoard";
import { SocialMediaOrbit } from "./SocialMediaOrbit";
import { DiamondBadge } from "./DiamondBadge";
import { LightLevelBadge } from "./LightLevelBadge";

interface ProfileHeaderProps {
  profile: {
    id: string;
    avatar_url: string | null;
    display_name: string | null;
    username: string;
    facebook_url?: string | null;
    youtube_url?: string | null;
    twitter_url?: string | null;
    tiktok_url?: string | null;
    telegram_url?: string | null;
    angelai_url?: string | null;
    funplay_url?: string | null;
    linkedin_url?: string | null;
    zalo_url?: string | null;
    social_avatars?: any;
  };
  channel: {
    id: string;
    banner_url: string | null;
    user_id: string;
  } | null;
  lightScore?: number;
  lightLevel?: string;
  suspiciousScore?: number;
  banned?: boolean;
  violationLevel?: number;
  isOwnProfile?: boolean;
  onProfileUpdate?: () => void;
}

export const ProfileHeader = ({ profile, channel, lightScore = 0, lightLevel, suspiciousScore = 0, banned, violationLevel, isOwnProfile, onProfileUpdate }: ProfileHeaderProps) => {
  const displayName = profile.display_name || profile.username || "User";

  return (
    <div className="relative">
      {/* Cover Photo Container */}
      <div className="relative w-full h-48 md:h-64 lg:h-80 xl:h-[400px] overflow-hidden">
        {channel?.banner_url ? (
          <img src={channel.banner_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/20 via-[hsl(var(--cosmic-magenta))]/15 to-[hsl(var(--cosmic-gold))]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--cosmic-purple))]/10 via-transparent to-[hsl(var(--cosmic-cyan))]/10" />
        <ProfileHonorBoard userId={profile.id} placement="cover" />
      </div>

      <ProfileHonorBoard userId={profile.id} placement="below" />

      {/* Avatar */}
      <div className="relative max-w-none md:max-w-6xl mx-auto md:px-4 lg:px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="absolute -top-20 md:-top-24 lg:-top-28 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0"
        >
          <div className="relative group">
            {/* Diamond Badge */}
            <DiamondBadge lightScore={lightScore} suspiciousScore={suspiciousScore} banned={banned} violationLevel={violationLevel} />

            {/* Light Level Badge - public label, no numeric score */}
            {lightLevel && !banned && (
              <LightLevelBadge level={lightLevel} />
            )}

            {/* Glow Ring */}
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-70 blur-md animate-pulse group-hover:opacity-100 transition-opacity" />
            
            {/* Rainbow Border */}
            <div
              className="absolute -inset-1 rounded-full animate-spin-slow"
              style={{
                background: "conic-gradient(from 0deg, hsl(var(--cosmic-cyan)), hsl(var(--cosmic-purple)), hsl(var(--cosmic-magenta)), hsl(var(--cosmic-gold)), hsl(var(--cosmic-cyan)))",
                animationDuration: "4s",
              }}
            />

            {/* Avatar */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-4 border-background overflow-hidden bg-background">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] flex items-center justify-center">
                  <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Social Media Orbit - hidden when banned */}
            {!banned && (
              <SocialMediaOrbit
                angelaiUrl={profile.angelai_url}
                funplayUrl={profile.funplay_url}
                facebookUrl={profile.facebook_url}
                youtubeUrl={profile.youtube_url}
                twitterUrl={profile.twitter_url}
                telegramUrl={profile.telegram_url}
                tiktokUrl={profile.tiktok_url}
                linkedinUrl={profile.linkedin_url}
                zaloUrl={profile.zalo_url}
                socialAvatars={profile.social_avatars}
                isOwnProfile={isOwnProfile}
                userId={profile.id}
                onProfileUpdate={onProfileUpdate}
              />
            )}
          </div>
        </motion.div>
      </div>

      <div className="h-28 md:h-20 lg:h-24" />
    </div>
  );
};
