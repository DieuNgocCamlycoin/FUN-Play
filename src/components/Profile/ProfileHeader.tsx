import { useState } from "react";
import { Camera, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ProfileHonorBoard } from "./ProfileHonorBoard";

interface ProfileHeaderProps {
  profile: {
    id: string;
    avatar_url: string | null;
    display_name: string | null;
    username: string;
  };
  channel: {
    id: string;
    banner_url: string | null;
    user_id: string;
  } | null;
}

export const ProfileHeader = ({ profile, channel }: ProfileHeaderProps) => {
  const displayName = profile.display_name || profile.username || "User";

  return (
    <div className="relative">
      {/* Cover Photo Container */}
      <div className="relative w-full h-48 md:h-64 lg:h-80 xl:h-[400px] overflow-hidden">
        {/* Cover Image or Gradient */}
        {channel?.banner_url ? (
          <img
            src={channel.banner_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/20 via-[hsl(var(--cosmic-magenta))]/15 to-[hsl(var(--cosmic-gold))]/20" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--cosmic-purple))]/10 via-transparent to-[hsl(var(--cosmic-cyan))]/10" />

        {/* Honor Board - Positioned on cover photo */}
        <ProfileHonorBoard userId={profile.id} />
      </div>

      {/* Avatar - Overlapping cover */}
      <div className="relative max-w-6xl mx-auto px-4 lg:px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="absolute -top-20 md:-top-24 lg:-top-28"
        >
          {/* Avatar Container with Hologram Border */}
          <div className="relative group">
            {/* Animated Glow Ring */}
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-70 blur-md animate-pulse group-hover:opacity-100 transition-opacity" />
            
            {/* Rainbow Border Animation */}
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
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] flex items-center justify-center">
                  <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Spacer for avatar overlap */}
      <div className="h-16 md:h-20 lg:h-24" />
    </div>
  );
};
