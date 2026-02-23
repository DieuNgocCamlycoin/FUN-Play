import { useState, useEffect, useRef, useCallback } from "react";
import { Facebook, Youtube, Send, Linkedin, Plus, Check, X, Trash2 } from "lucide-react";
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
  { key: "funplay", icon: FunProfileIcon, color: "#22C55E", label: "Fun Profile", dbField: "funplay_url" },
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
  facebook: /^https:\/\/(\w*\.)?facebook\.com\/.+/i,
  youtube: /^https:\/\/(\w*\.)?youtube\.com\/.+/i,
  twitter: /^https:\/\/(\w*\.)?(twitter\.com|x\.com)\/.+/i,
  tiktok: /^https:\/\/(\w*\.)?tiktok\.com\/@.+/i,
  telegram: /^https:\/\/(\w*\.)?(t\.me|telegram\.me)\/.+/i,
  linkedin: /^https:\/\/(\w*\.)?linkedin\.com\/(in|company)\/.+/i,
  zalo: /^https:\/\/(\w*\.)?(zalo\.me|chat\.zalo\.me)\/.+/i,
  funplay: /^https:\/\/fun\.rich\/.+/i,
  angelai: /^https:\/\/angel\.fun\.rich\/.+/i,
};

const defaultAvatarMap: Record<string, string> = {
  funplay: '/images/FUN_Profile.png',
  angelai: '/images/Angel_AI.png',
  facebook: '/images/facebook-default.png',
  zalo: '/images/zalo-default.png',
  linkedin: '/images/linkedin-default.png',
  youtube: '/images/youtube-default.png',
  twitter: '/images/x-default.png',
  tiktok: '/images/tiktok-default.png',
  telegram: '/images/telegram-default.png',
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
  // Track which orbit item popover is open
  const [orbitPopoverKey, setOrbitPopoverKey] = useState<string | null>(null);
  const [orbitUrlInput, setOrbitUrlInput] = useState("");
  const [orbitUrlError, setOrbitUrlError] = useState("");

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

  // Custom tooltip state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const iconRefs = useRef<Record<string, HTMLElement | null>>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // RAF loop to track icon position for tooltip
  const updateTooltipPosition = useCallback(() => {
    if (!activeTooltip || !wrapperRef.current) {
      rafRef.current = 0;
      return;
    }
    const iconEl = iconRefs.current[activeTooltip];
    if (!iconEl) {
      rafRef.current = 0;
      return;
    }
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const iconRect = iconEl.getBoundingClientRect();
    const x = iconRect.left + iconRect.width / 2 - wrapperRect.left;
    const y = iconRect.top - wrapperRect.top;
    setTooltipPos({ x, y });
    rafRef.current = requestAnimationFrame(updateTooltipPosition);
  }, [activeTooltip]);

  useEffect(() => {
    if (activeTooltip) {
      rafRef.current = requestAnimationFrame(updateTooltipPosition);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeTooltip, updateTooltipPosition]);

  // Show ALL platforms always (active ones + unlinked ones)
  const allOrbitItems = [...platforms];
  const count = allOrbitItems.length;

  const step = 360 / count;
  const baseAngle = 270 + step / 2;

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

  // Save from orbit item popover
  const handleOrbitSave = async (platformKey: string) => {
    if (!orbitUrlInput || !userId) return;

    if (!validateUrl(platformKey, orbitUrlInput)) {
      setOrbitUrlError("URL không hợp lệ cho nền tảng này");
      return;
    }

    setSaving(true);
    setOrbitUrlError("");

    try {
      const platformConfig = platforms.find(p => p.key === platformKey);
      if (!platformConfig) return;

      const { error } = await supabase
        .from("profiles")
        .update({ [platformConfig.dbField]: orbitUrlInput })
        .eq("id", userId);

      if (error) throw error;

      try {
        await supabase.functions.invoke("fetch-social-avatar", {
          body: {
            userId,
            platforms: { [platformKey]: orbitUrlInput },
          },
        });
      } catch (e) {
        console.log("Avatar fetch failed (non-critical):", e);
      }

      toast({
        title: "Đã thêm liên kết! 🎉",
        description: `${platformConfig.label} đã được thêm vào hồ sơ`,
      });

      setOrbitPopoverKey(null);
      setOrbitUrlInput("");
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

  // Delete link from orbit item popover
  const handleOrbitDelete = async (platformKey: string) => {
    if (!userId) return;
    setSaving(true);

    try {
      const platformConfig = platforms.find(p => p.key === platformKey);
      if (!platformConfig) return;

      // Clear both url and avatar
      const updateData: Record<string, null> = { [platformConfig.dbField]: null };
      
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Đã xóa liên kết",
        description: `${platformConfig.label} đã được xóa khỏi hồ sơ`,
      });

      setOrbitPopoverKey(null);
      setOrbitUrlInput("");
      onProfileUpdate?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa liên kết",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Find active tooltip platform data
  const activeTooltipPlatform = activeTooltip ? platforms.find(p => p.key === activeTooltip) : null;

  return (
    <div className="absolute inset-0" ref={wrapperRef}>
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
          const hasUrl = !!urls[platform.key];
          const rawAvatar = socialAvatars?.[platform.key];
          const avatarUrl = rawAvatar && rawAvatar.trim().length > 0 ? rawAvatar : null;
          const displayUrl = avatarUrl || defaultAvatarMap[platform.key] || null;

          const orbitStyle = {
            border: hasUrl ? "3px solid #00E7FF" : "3px dashed #999",
            left: `calc(50% + ${x}%)`,
            top: `calc(50% + ${y}%)`,
            transform: "translate(-50%, -50%)",
            boxShadow: hasUrl ? "0 0 8px #00E7FF40" : "none",
            opacity: hasUrl ? 1 : 0.7,
          };

          const imageContent = displayUrl ? (
            <OrbitImage src={displayUrl} alt={platform.label} color={platform.color} fallbackSrc={defaultAvatarMap[platform.key]} FallbackIcon={Icon} />
          ) : (
            <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: platform.color }} />
          );

          // Platform with URL → link
          if (hasUrl) {
            return (
              <a
                key={platform.key}
                ref={(el) => { iconRefs.current[platform.key] = el; }}
                href={urls[platform.key]!}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setActiveTooltip(platform.key)}
                onMouseLeave={() => setActiveTooltip(null)}
                className="absolute z-20 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full shadow-lg transition-transform hover:scale-[1.3] cursor-pointer overflow-hidden bg-background/80 dark:bg-background/60 orbit-item animate-[orbit-counter-spin_25s_linear_infinite]"
                style={orbitStyle}
              >
                {imageContent}
              </a>
            );
          }

          // No URL + own profile → Popover to add link
          if (isOwnProfile) {
            return (
              <Popover
                key={platform.key}
                open={orbitPopoverKey === platform.key}
                onOpenChange={(open) => {
                  if (open) {
                    setOrbitPopoverKey(platform.key);
                    setOrbitUrlInput(urls[platform.key] || "");
                    setOrbitUrlError("");
                  } else {
                    setOrbitPopoverKey(null);
                    setOrbitUrlInput("");
                    setOrbitUrlError("");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    ref={(el) => { iconRefs.current[platform.key] = el; }}
                    onMouseEnter={() => { if (orbitPopoverKey !== platform.key) setActiveTooltip(platform.key); }}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className="absolute z-20 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full transition-transform hover:scale-[1.3] cursor-pointer overflow-hidden bg-background/80 dark:bg-background/60 orbit-item animate-[orbit-counter-spin_25s_linear_infinite]"
                    style={orbitStyle}
                  >
                    {imageContent}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="center"
                  className="w-72 p-4 z-[10003]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full"
                      style={{ backgroundColor: `${platform.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: platform.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{platform.label}</p>
                      <p className="text-[11px] text-muted-foreground">Nhập link trang cá nhân của bạn (có thể bỏ qua)</p>
                    </div>
                  </div>
                  <Input
                    value={orbitUrlInput}
                    onChange={(e) => {
                      setOrbitUrlInput(e.target.value);
                      setOrbitUrlError("");
                    }}
                    placeholder="https://..."
                    className="text-xs h-9 mb-2"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleOrbitSave(platform.key)}
                  />
                  {orbitUrlError && (
                    <p className="text-[10px] text-destructive mb-2">{orbitUrlError}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOrbitUrlInput("");
                        setOrbitUrlError("");
                      }}
                      className="h-8 px-3 text-xs gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOrbitSave(platform.key)}
                      disabled={!orbitUrlInput || saving}
                      className="h-8 px-3 text-xs bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white border-0"
                    >
                      Lưu
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          // No URL + not own profile → just display with tooltip
          return (
            <div
              key={platform.key}
              ref={(el) => { iconRefs.current[platform.key] = el; }}
              onMouseEnter={() => setActiveTooltip(platform.key)}
              onMouseLeave={() => setActiveTooltip(null)}
              className="absolute z-20 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full transition-transform hover:scale-[1.1] overflow-hidden bg-background/80 dark:bg-background/60 orbit-item animate-[orbit-counter-spin_25s_linear_infinite]"
              style={orbitStyle}
            >
              {imageContent}
            </div>
          );
        })}
      </div>

      {/* Custom tooltip - rendered OUTSIDE orbit container, always horizontal */}
      {activeTooltip && activeTooltipPlatform && tooltipPos && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <div
              className="px-3 py-1.5 text-white font-bold text-center text-xs rounded-md shadow-lg w-fit whitespace-nowrap"
              style={{ backgroundColor: activeTooltipPlatform.key === 'tiktok' ? '#000000' : activeTooltipPlatform.color }}
            >
              {activeTooltipPlatform.label}
            </div>
            <div className="px-3 py-1.5 bg-white rounded-md shadow-lg">
              <span className="text-[11px] whitespace-nowrap" style={{ color: urls[activeTooltip] ? '#2563EB' : '#999' }}>
                {urls[activeTooltip]
                  ? (urls[activeTooltip] || "").replace(/^https?:\/\/(www\.)?/, "")
                  : "Nhấp vào để thêm link"
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fixed "+" button at 10 o'clock position - only show if there are missing platforms and is own profile */}
      {isOwnProfile && missingPlatforms.length > 0 && (
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
  );
};

// Sub-component for orbit images with fallback
const OrbitImage = ({ src, alt, color, fallbackSrc, FallbackIcon }: { 
  src: string; 
  alt: string; 
  color: string;
  fallbackSrc?: string;
  FallbackIcon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) => {
  const [stage, setStage] = useState<'primary' | 'fallback' | 'icon'>('primary');

  if (stage === 'icon' || (stage === 'fallback' && !fallbackSrc)) {
    return FallbackIcon ? (
      <FallbackIcon className="w-4 h-4 md:w-5 md:h-5" style={{ color }} />
    ) : (
      <div
        className="w-full h-full flex items-center justify-center text-[10px] font-bold"
        style={{ color }}
      >
        {alt.charAt(0)}
      </div>
    );
  }

  if (stage === 'fallback' && fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setStage('icon')}
        loading="lazy"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => {
        if (fallbackSrc && fallbackSrc !== src) {
          setStage('fallback');
        } else {
          setStage('icon');
        }
      }}
      loading="lazy"
    />
  );
};
