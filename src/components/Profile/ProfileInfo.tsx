import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, UserPlus, UserCheck, Share2, Copy, Settings, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";
import { motion } from "framer-motion";
import { formatViewsShort } from "@/lib/formatters";
import { getShareUrl, copyToClipboard } from "@/lib/shareUtils";
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
  banned?: boolean;
}

export const ProfileInfo = ({
  profile,
  channel,
  isOwnProfile,
  isSubscribed,
  onSubscribe,
  banned,
}: ProfileInfoProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [donateModalOpen, setDonateModalOpen] = useState(false);

  const displayName = (profile.display_name || profile.username || "User")
    .replace(" là", "")
    .replace(" is", "")
    .replace("'s Channel", "");
  const subscriberCount = channel?.subscriber_count || 0;

  const handleShare = async (platform: string) => {
    const profileUrl = getShareUrl(`/${profile.username}`);
    const text = `Khám phá trang cá nhân của ${displayName} trên FUN PLAY! 🎉`;

    let shareLink = "";
    switch (platform) {
      case "telegram":
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case "copy": {
        const success = await copyToClipboard(profileUrl);
        toast({
          title: success ? "Đã copy! ✨" : "Lỗi",
          description: success ? "Link trang cá nhân đã được sao chép" : "Không thể sao chép link",
          variant: success ? "default" : "destructive",
        });
        return;
      }
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
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
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-muted/60 border border-primary/30 rounded-full hover:border-primary/50 transition-colors duration-200">
              <Wallet className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-mono text-sm text-foreground truncate max-w-[200px]">
                {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-primary/10 rounded-full flex-shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(profile.wallet_address || "");
                  toast({ title: "Đã copy địa chỉ ví" });
                }}
              >
                <Copy className="w-4 h-4 text-primary" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: Action Buttons - hidden when banned */}
        {!banned && (
          <div className="flex items-center gap-2 lg:gap-3 pl-36 md:pl-44 lg:pl-0">
            {/* Donate Button - Premium Metallic Gold Style - ALWAYS VISIBLE */}
            <Button
              onClick={() => setDonateModalOpen(true)}
              className="relative overflow-hidden bg-[linear-gradient(90deg,#F9E37A_0%,#FFD700_20%,#FFEC8B_40%,#FFF8DC_50%,#FFEC8B_60%,#FFD700_80%,#F9E37A_100%)] text-[#8B6914] font-bold px-5 py-2.5 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_0_25px_rgba(255,215,0,0.6),0_0_50px_rgba(255,215,0,0.3)] hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_0_40px_rgba(255,215,0,0.8),0_0_80px_rgba(255,215,0,0.4)] border border-[#DAA520]/70 transition-all duration-300 hover:scale-105 animate-luxury-pulse"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Tặng & Thưởng
              </span>
              {/* Glossy highlight */}
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-t-full pointer-events-none" />
              {/* Mirror shimmer effect - continuous */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-mirror-shimmer" />
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
        )}
      </div>

      {/* Donate Modal - Context-aware - not rendered when banned */}
      {!banned && <EnhancedDonateModal
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
      />}
    </motion.div>
  );
};
