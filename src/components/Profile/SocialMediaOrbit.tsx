import { useState } from "react";
import { Facebook, Youtube, Send, Linkedin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  { key: "funplay", icon: FunProfileIcon, color: "#00E7FF", label: "Fun Profile" },
  { key: "angelai", icon: AngelAIIcon, color: "#FFD700", label: "Angel AI" },
  { key: "facebook", icon: Facebook, color: "#1877F2", label: "Facebook" },
  { key: "youtube", icon: Youtube, color: "#FF0000", label: "YouTube" },
  { key: "twitter", icon: XIcon, color: "#1DA1F2", label: "X / Twitter" },
  { key: "telegram", icon: Send, color: "#0088cc", label: "Telegram" },
  { key: "tiktok", icon: TikTokIcon, color: "#69C9D0", label: "TikTok" },
  { key: "linkedin", icon: Linkedin, color: "#0A66C2", label: "LinkedIn" },
  { key: "zalo", icon: ZaloIcon, color: "#0068FF", label: "Zalo" },
] as const;

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
}: SocialMediaOrbitProps) => {
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
  if (activePlatforms.length === 0) return null;

  // Distribute evenly across 360°, starting from 12h (270°)
  const count = activePlatforms.length;
  const step = 360 / count;
  // 1 item: top (270°). 2 items: symmetric across vertical axis. 3+: offset half-step from 12h to avoid diamond badge
  const baseAngle = count === 1 ? 270 : (count === 2 ? 225 : 270 + step / 2);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="absolute inset-0 animate-[orbit-spin_25s_linear_infinite]"
        style={{ transformOrigin: "center center" }}
      >
        {activePlatforms.map((platform, index) => {
          const Icon = platform.icon;
          const angle = baseAngle + step * index;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * 58;
          const y = Math.sin(rad) * 58;
          const avatarUrl = socialAvatars?.[platform.key];

          return (
            <Tooltip key={platform.key}>
              <TooltipTrigger asChild>
                <a
                  href={urls[platform.key]!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute z-20 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full shadow-lg transition-transform hover:scale-[1.3] cursor-pointer overflow-hidden bg-background/80 dark:bg-background/60 animate-[orbit-counter-spin_25s_linear_infinite]"
                  style={{
                    border: `3px solid ${platform.color}`,
                    left: `calc(50% + ${x}%)`,
                    top: `calc(50% + ${y}%)`,
                    transform: "translate(-50%, -50%)",
                    boxShadow: `0 0 8px ${platform.color}40`,
                  }}
                >
                  {avatarUrl ? (
                    <OrbitImage src={avatarUrl} alt={platform.label} color={platform.color} />
                  ) : (
                    <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: platform.color }} />
                  )}
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[280px] p-2">
                <div className="font-semibold">{platform.label}</div>
                <div className="text-muted-foreground truncate text-[10px] mt-0.5">
                  {urls[platform.key]}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
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
