import { Gem } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CredibilityDiamondProps {
  totalCamly: number;
}

const getTier = (camly: number) => {
  if (camly >= 5000) return { color: "#FFD700", glow: "rgba(255,215,0,0.6)", label: "Light Angel 🌟", sparkle: "#FFD700" };
  if (camly >= 1000) return { color: "#AB47BC", glow: "rgba(171,71,188,0.5)", label: "Purple Trust 💜", sparkle: "#CE93D8" };
  if (camly >= 100) return { color: "#4FC3F7", glow: "rgba(79,195,247,0.5)", label: "Blue Active 💙", sparkle: "#81D4FA" };
  return { color: "#C0C0C0", glow: "rgba(192,192,192,0.4)", label: "Silver New ⚪", sparkle: "#E0E0E0" };
};

export const CredibilityDiamond = ({ totalCamly }: CredibilityDiamondProps) => {
  const tier = getTier(totalCamly);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute z-20 -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{ filter: `drop-shadow(0 0 6px ${tier.glow})` }}
          >
            <Gem
              className="w-5 h-5 md:w-6 md:h-6 animate-pulse"
              style={{ color: tier.color }}
              strokeWidth={2.5}
            />
            {/* Sparkle particles */}
            <span
              className="absolute w-1.5 h-1.5 rounded-full animate-ping"
              style={{ backgroundColor: tier.sparkle, top: -2, right: -1, animationDuration: "1.5s" }}
            />
            <span
              className="absolute w-1 h-1 rounded-full animate-ping"
              style={{ backgroundColor: tier.sparkle, bottom: 0, left: -2, animationDuration: "2s", animationDelay: "0.5s" }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="text-center">
            <div className="font-semibold">{tier.label}</div>
            <div className="text-muted-foreground">{totalCamly.toLocaleString()} CAMLY</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
