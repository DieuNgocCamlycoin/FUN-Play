import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, UserPlus, UserCheck, Share2, Copy, Settings, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";
import { motion } from "framer-motion";
import { formatViewsShort } from "@/lib/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileInfoProps {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    wallet_address: string | null;
    total_camly_rewards: number;
  };
  channel: {
    id: string;
    subscriber_count: number;
    is_verified?: boolean;
  } | null;
  isOwnProfile: boolean;
  isSubscribed: boolean;
  onSubscribe: () => void;
}

export const ProfileInfo = ({
  profile,
  channel,
  isOwnProfile,
  isSubscribed,
  onSubscribe,
}: ProfileInfoProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [donateModalOpen, setDonateModalOpen] = useState(false);

  const displayName = (profile.display_name || profile.username || "User")
    .replace(" là", "")
    .replace(" is", "")
    .replace("'s Channel", "");
  const subscriberCount = channel?.subscriber_count || 0;

  const handleShare = (platform: string) => {
    const profileUrl = `${window.location.origin}/u/${profile.username}`;
    const text = `Khám phá trang cá nhân của ${displayName} trên FUN PLAY! 🎉`;

    let shareUrl = "";
    switch (platform) {
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(profileUrl);
        toast({
          title: "Đã copy! ✨",
          description: "Link trang cá nhân đã được sao chép",
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="py-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left: Name + Info */}
        <div className="flex-1 pl-36 md:pl-44 lg:pl-52">
          {/* Display Name with Rainbow Gradient */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#FF0000] via-[#FF7F00] via-[#FFFF00] via-[#00FF00] via-[#0000FF] via-[#4B0082] to-[#9400D3] bg-clip-text text-transparent animate-rainbow-shift bg-[length:200%_auto]">
              {displayName}
            </h1>
            {channel?.is_verified && (
              <svg className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            )}
          </div>

          {/* Username + Stats */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-medium">@{profile.username}</span>
            <span>•</span>
            <span>{formatViewsShort(subscriberCount)} người theo dõi</span>
            <span>•</span>
            <span className="text-[hsl(var(--cosmic-gold))] font-semibold">
              {profile.total_camly_rewards.toLocaleString()} CAMLY
            </span>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-foreground/80 max-w-xl mb-3 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Wallet/Fun-ID */}
          {profile.wallet_address && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="w-3.5 h-3.5" />
              <span className="font-mono truncate max-w-[200px]">
                {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  navigator.clipboard.writeText(profile.wallet_address || "");
                  toast({ title: "Đã copy địa chỉ ví" });
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 lg:gap-3 pl-36 md:pl-44 lg:pl-0">
          {/* Donate Button - Premium Metallic Gold Style - ALWAYS VISIBLE */}
          <Button
            onClick={() => setDonateModalOpen(true)}
            className="relative overflow-hidden bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800] text-[#7C5800] font-bold px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_0_35px_rgba(255,234,0,0.7),0_0_50px_rgba(255,215,0,0.4)] border border-[#FFEA00]/60 transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Tặng & Thưởng
            </span>
            {/* Mirror shimmer effect - continuous */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer" />
          </Button>

          {/* Subscribe Button */}
          {!isOwnProfile && (
            <Button
              onClick={onSubscribe}
              variant={isSubscribed ? "outline" : "default"}
              className={`rounded-full font-semibold px-4 ${
                isSubscribed
                  ? "border-muted-foreground/30 text-muted-foreground"
                  : "bg-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan))]/90"
              }`}
            >
              {isSubscribed ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Đã theo dõi
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Theo dõi
                </>
              )}
            </Button>
          )}

          {/* Settings Button (own profile) - Icon only */}
          {isOwnProfile && (
            <Button
              onClick={() => navigate("/settings")}
              variant="outline"
              size="icon"
              className="rounded-full"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}

          {/* Share Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <Share2 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare("copy")}>
                <Copy className="w-4 h-4 mr-2" />
                Sao chép link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("telegram")}>
                Telegram
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("facebook")}>
                Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("twitter")}>
                Twitter / X
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Donate Modal - Context-aware */}
      <EnhancedDonateModal
        open={donateModalOpen}
        onOpenChange={setDonateModalOpen}
        {...(isOwnProfile
          ? { contextType: "global" as const }
          : {
              defaultReceiverId: profile.id,
              defaultReceiverName: displayName,
              defaultReceiverAvatar: profile.avatar_url || undefined,
              defaultReceiverWallet: profile.wallet_address || undefined,
            }
        )}
      />
    </motion.div>
  );
};
