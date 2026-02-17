import { Facebook, Youtube, Send } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SocialMediaOrbitProps {
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  twitterUrl?: string | null;
  tiktokUrl?: string | null;
  telegramUrl?: string | null;
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

const platforms = [
  { key: "facebook", icon: Facebook, color: "#1877F2", label: "Facebook" },
  { key: "youtube", icon: Youtube, color: "#FF0000", label: "YouTube" },
  { key: "twitter", icon: XIcon, color: "#000000", label: "X / Twitter" },
  { key: "tiktok", icon: TikTokIcon, color: "#000000", label: "TikTok" },
  { key: "telegram", icon: Send, color: "#0088cc", label: "Telegram" },
] as const;

export const SocialMediaOrbit = ({
  facebookUrl,
  youtubeUrl,
  twitterUrl,
  tiktokUrl,
  telegramUrl,
}: SocialMediaOrbitProps) => {
  const urls: Record<string, string | null | undefined> = {
    facebook: facebookUrl,
    youtube: youtubeUrl,
    twitter: twitterUrl,
    tiktok: tiktokUrl,
    telegram: telegramUrl,
  };

  const activePlatforms = platforms.filter((p) => urls[p.key]);
  if (activePlatforms.length === 0) return null;

  // Position icons along bottom arc of avatar
  // Spread evenly from -70deg to +70deg (bottom arc)
  const totalAngle = 140; // degrees spread
  const startAngle = 200; // start from bottom-left (200deg on circle)
  const step = activePlatforms.length > 1 ? totalAngle / (activePlatforms.length - 1) : 0;

  return (
    <TooltipProvider delayDuration={200}>
      {activePlatforms.map((platform, index) => {
        const Icon = platform.icon;
        const angle = activePlatforms.length === 1
          ? 270 // single icon at bottom center
          : startAngle + step * index;
        const rad = (angle * Math.PI) / 180;
        // Position relative to avatar center, radius ~58% of avatar size
        const x = Math.cos(rad) * 58;
        const y = Math.sin(rad) * 58;

        return (
          <Tooltip key={platform.key}>
            <TooltipTrigger asChild>
              <a
                href={urls[platform.key]!}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute z-20 flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-background shadow-lg transition-transform hover:scale-125 cursor-pointer"
                style={{
                  backgroundColor: platform.color,
                  left: `calc(50% + ${x}%)`,
                  top: `calc(50% + ${y}%)`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {platform.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </TooltipProvider>
  );
};
