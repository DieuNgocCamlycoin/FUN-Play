import { useState, useEffect, useRef } from "react";
import { Facebook, Youtube, Send, Linkedin, Plus, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SocialMediaOrbitProps {
  angelaiUrl?: string | null;
  funplayUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  twitterUrl?: string | null;
  telegramUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  zaloUrl?: string | null;
  socialAvatars?: Record<string, string | null> | null;
  isOwnProfile?: boolean;
  userId?: string;
  onProfileUpdate?: () => void;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.82a4.84 4.84 0 01-1-.13z" />
  </svg>
);

const AngelAIIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
  </svg>
);

const FunProfileIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const ZaloIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.03 2 11c0 2.76 1.36 5.22 3.5 6.87V22l4.06-2.23c.78.22 1.6.33 2.44.33 5.52 0 10-4.03 10-9S17.52 2 12 2zm1 13H8v-1.5h5V15zm2.5-3H8v-1.5h7.5V12zm0-3H8V7.5h7.5V9z" />
  </svg>
);

const platforms = [
  { key: "funplay", icon: FunProfileIcon, color: "#00E7FF", label: "Fun Profile", dbField: "funplay_url" },
  { key: "angelai", icon: AngelAIIcon, color: "#FFD700", label: "Angel AI", dbField: "angelai_url" },
  { key: "facebook", icon: Facebook, color: "#1877F2", label: "Facebook", dbField: "facebook_url" },
  { key: "youtube", icon: Youtube, color: "#FF0000", label: "YouTube", dbField: "youtube_url" },
  { key: "twitter", icon: XIcon, color: "#1DA1F2", label: "X / Twitter", dbField: "twitter_url" },
  { key: "telegram", icon: Send, color: "#0088cc", label: "Telegram", dbField: "telegram_url" },
  { key: "tiktok", icon: TikTokIcon, color: "#69C9D0", label: "TikTok", dbField: "tiktok_url" },
  { key: "linkedin", icon: Linkedin, color: "#0A66C2", label: "LinkedIn", dbField: "linkedin_url" },
  { key: "zalo", icon: ZaloIcon, color: "#0068FF", label: "Zalo", dbField: "zalo_url" },
] as const;

const URL_PATTERNS: Record<string, RegExp> = {
  facebook: /^https:\/\/(www\.)?facebook\.com\/.+/i,
  youtube: /^https:\/\/(www\.)?youtube\.com\/.+/i,
  twitter: /^https:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
  tiktok: /^https:\/\/(www\.)?tiktok\.com\/@.+/i,
  telegram: /^https:\/\/(t\.me|telegram\.me)\/.+/i,
  linkedin: /^https:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/i,
  zalo: /^https:\/\/(zalo\.me|chat\.zalo\.me)\/.+/i,
  funplay: /^https:\/\/fun\.rich\/.+/i,
  angelai: /^https:\/\/angel\.fun\.rich\/.+/i,
};

export const SocialMediaOrbit = ({
  angelaiUrl,
  funplayUrl,
  facebookUrl,
  youtubeUrl,
  twitterUrl,
  telegramUrl,
  tiktokUrl,
  linkedinUrl,
  zaloUrl,
  socialAvatars,
  isOwnProfile,
  userId,
  onProfileUpdate,
}: SocialMediaOrbitProps) => {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState("");
  const fetchTriggered = useRef(false);

  const urls: Record<string, string | null | undefined> = {
    angelai: angelaiUrl,
    funplay: funplayUrl,
    facebook: facebookUrl,
    youtube: youtubeUrl,
    twitter: twitterUrl,
    telegram: telegramUrl,
    tiktok: tiktokUrl,
    linkedin: linkedinUrl,
    zalo: zaloUrl,
  };

  const activePlatforms = platforms.filter((p) => urls[p.key]);
  const missingPlatforms = platforms.filter((p) => !urls[p.key]);

  // Auto-trigger fetch for missing social avatars
  useEffect(() => {
    if (!userId || fetchTriggered.current) return;

    const platformsWithUrlButNoAvatar: Record<string, string> = {};
    for (const p of activePlatforms) {
      if (urls[p.key] && !socialAvatars?.[p.key]) {
        // Skip funplay and angelai as they have default images
        if (p.key === "funplay" || p.key === "angelai") continue;
        platformsWithUrlButNoAvatar[p.key] = urls[p.key]!;
      }
    }

    if (Object.keys(platformsWithUrlButNoAvatar).length === 0) return;

    fetchTriggered.current = true;
    console.log("[SocialMediaOrbit] Auto-fetching missing avatars for:", Object.keys(platformsWithUrlButNoAvatar));

    supabase.functions
      .invoke("fetch-social-avatar", {
        body: { userId, platforms: platformsWithUrlButNoAvatar },
      })
      .then(() => {
        onProfileUpdate?.();
      })
      .catch((e) => {
        console.log("Auto-fetch avatars failed (non-critical):", e);
      });
  }, [userId]);

  // Distribute evenly across 360°, starting from 12h (270°)
  const allOrbitItems = [...activePlatforms];
  const showAddButton = isOwnProfile && missingPlatforms.length > 0;

  const count = allOrbitItems.length + (showAddButton ? 1 : 0);
  if (count === 0 && !showAddButton) return null;
  // If no active platforms but we have add button, still render
  if (count === 0) return null;

  const step = 360 / count;
  const baseAngle = count === 1 ? 270 : (count === 2 ? 225 : 270 + step / 2);

  const validateUrl = (platform: string, url: string) => {
    const pattern = URL_PATTERNS[platform];
    if (!pattern) return url.startsWith("https://");
    return pattern.test(url);
  };

  const handleSave = async () => {
    if (!selectedPlatform || !urlInput || !userId) return;

    if (!validateUrl(selectedPlatform, urlInput)) {
      setUrlError("URL không hợp lệ cho nền tảng này");
      return;
    }

    setSaving(true);
    setUrlError("");

    try {
      const platformConfig = platforms.find(p => p.key === selectedPlatform);
      if (!platformConfig) return;

      const { error } = await supabase
        .from("profiles")
        .update({ [platformConfig.dbField]: urlInput })
        .eq("id", userId);

      if (error) throw error;

      // Trigger avatar fetch for the new platform
      try {
        await supabase.functions.invoke("fetch-social-avatar", {
          body: {
            userId,
            platforms: { [selectedPlatform]: urlInput },
          },
        });
      } catch (e) {
        console.log("Avatar fetch failed (non-critical):", e);
      }

      toast({
        title: "Đã thêm liên kết! 🎉",
        description: `${platformConfig.label} đã được thêm vào hồ sơ`,
      });

      setAddOpen(false);
      setSelectedPlatform(null);
      setUrlInput("");
      onProfileUpdate?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu liên kết",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="absolute inset-0">
        {/* Spinning orbit container */}
        <div
          className="absolute inset-0 orbit-container animate-[orbit-spin_25s_linear_infinite]"
          style={{ transformOrigin: "center center" }}
        >
          {allOrbitItems.map((platform, index) => {
            const Icon = platform.icon;
            const angle = baseAngle + step * index;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * 58;
            const y = Math.sin(rad) * 58;
            const avatarUrl = socialAvatars?.[platform.key];
            const defaultAvatarMap: Record<string, string> = {
              funplay: '/images/FUN_Profile.png',
              angelai: '/images/Angel_AI.png',
              facebook: '/images/facebook-default.png',
              twitter: '/images/twitter-default.png',
            };
            const displayUrl = avatarUrl || defaultAvatarMap[platform.key] || null;

            return (
              <Tooltip key={platform.key}>
                <TooltipTrigger asChild>
                  <a
                    href={urls[platform.key]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute z-20 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full shadow-lg transition-transform hover:scale-[1.3] cursor-pointer overflow-hidden bg-background/80 dark:bg-background/60 orbit-item animate-[orbit-counter-spin_25s_linear_infinite]"
                    style={{
                      border: "3px solid #00E7FF",
                      left: `calc(50% + ${x}%)`,
                      top: `calc(50% + ${y}%)`,
                      transform: "translate(-50%, -50%)",
                      boxShadow: "0 0 8px #00E7FF40",
                    }}
                  >
                    {displayUrl ? (
                      <OrbitImage src={displayUrl} alt={platform.label} color={platform.color} />
                    ) : (
                      <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: platform.color }} />
                    )}
                  </a>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[320px] px-3 py-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold">{platform.label}</span>
                    <span className="text-muted-foreground truncate text-[11px] max-w-full">
                      {(urls[platform.key] || "").replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-muted">
                      {displayUrl ? (
                        <img src={displayUrl} alt={platform.label} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" style={{ color: platform.color }} />
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Fixed "+" button at 10 o'clock position - outside orbit, does not spin */}
        {showAddButton && (
          <Popover open={addOpen} onOpenChange={(open) => {
            setAddOpen(open);
            if (!open) {
              setSelectedPlatform(null);
              setUrlInput("");
              setUrlError("");
            }
          }}>
            <PopoverTrigger asChild>
              <button
                className="absolute z-30 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full shadow-lg transition-all hover:scale-[1.3] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #22d3ee, #3b82f6)",
                  left: "calc(50% - 50.2%)",
                  top: "calc(50% - 29%)",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 12px rgba(34, 211, 238, 0.5), 0 0 24px rgba(59, 130, 246, 0.3)",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="center"
              className="w-72 p-3 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {!selectedPlatform ? (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Thêm mạng xã hội</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingPlatforms.map((p) => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.key}
                          onClick={() => setSelectedPlatform(p.key)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border border-border bg-background hover:bg-accent transition-colors"
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => {
                        setSelectedPlatform(null);
                        setUrlInput("");
                        setUrlError("");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs font-semibold text-foreground">
                      {platforms.find(p => p.key === selectedPlatform)?.label}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setUrlError("");
                      }}
                      placeholder="https://..."
                      className="text-xs h-8"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!urlInput || saving}
                      className="h-8 px-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white border-0"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                  {urlError && (
                    <p className="text-[10px] text-destructive mt-1">{urlError}</p>
                  )}
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </TooltipProvider>
  );
};

// Sub-component for orbit images with fallback
const OrbitImage = ({ src, alt, color }: { src: string; alt: string; color: string }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-[10px] font-bold"
        style={{ color }}
      >
        {alt.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};
