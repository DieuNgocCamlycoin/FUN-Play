interface DiamondBadgeProps {
  lightScore: number;
  suspiciousScore?: number;
  banned?: boolean;
  violationLevel?: number;
}

const getDiamondColor = (
  lightScore: number, 
  suspiciousScore?: number, 
  banned?: boolean, 
  violationLevel?: number
): string => {
  if (banned) return "#9CA3AF"; // Gray - banned
  if ((violationLevel ?? 0) >= 3 || (suspiciousScore ?? 0) >= 5) return "#1F2937"; // Black - high risk
  if (lightScore >= 80 && (suspiciousScore ?? 0) <= 1) return "#FFFFFF"; // Sparkling White - PPLP verified
  if (lightScore >= 60) return "#3B82F6"; // Blue - actively sharing
  if (lightScore >= 40) return "#00E7FF"; // Cyan
  if (lightScore >= 20) return "#22C55E"; // Green
  return "#E5E7EB"; // Silver - default/new
};

const getDiamondGlow = (color: string): string => {
  if (color === "#9CA3AF" || color === "#1F2937") return "none";
  if (color === "#FFFFFF") {
    // Special sparkling white glow
    return "drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 16px rgba(200,220,255,0.6)) drop-shadow(0 0 24px rgba(150,180,255,0.3))";
  }
  return `drop-shadow(0 0 6px ${color}80) drop-shadow(0 0 12px ${color}40)`;
};

export const DiamondBadge = ({ lightScore, suspiciousScore, banned, violationLevel }: DiamondBadgeProps) => {
  const color = getDiamondColor(lightScore, suspiciousScore, banned, violationLevel);
  const glow = getDiamondGlow(color);
  const isWhiteDiamond = color === "#FFFFFF";

  return (
    <div
      className="absolute z-30 left-1/2 -translate-x-1/2 -top-5 md:-top-6"
      style={{ filter: glow }}
    >
      <div className="relative diamond-sparkle-container">
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          className="md:w-8 md:h-8"
        >
          {/* Diamond shape */}
          <path
            d="M16 2L28 12L16 30L4 12L16 2Z"
            fill={color}
            stroke={isWhiteDiamond ? "#B0C4DE" : (color === "#E5E7EB" ? "#D1D5DB" : color)}
            strokeWidth="0.5"
          />
          {/* Top facet highlight */}
          <path
            d="M16 2L28 12L16 14L4 12L16 2Z"
            fill="white"
            fillOpacity={isWhiteDiamond ? "0.5" : "0.3"}
          />
          {/* Left facet */}
          <path
            d="M4 12L16 14L16 30L4 12Z"
            fill="black"
            fillOpacity="0.1"
          />
          {/* Extra rainbow refraction for white diamond */}
          {isWhiteDiamond && (
            <path
              d="M16 14L28 12L16 30L16 14Z"
              fill="url(#rainbowGradient)"
              fillOpacity="0.15"
            />
          )}
          {isWhiteDiamond && (
            <defs>
              <linearGradient id="rainbowGradient" x1="16" y1="14" x2="28" y2="30">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="33%" stopColor="#4ECDC4" />
                <stop offset="66%" stopColor="#45B7D1" />
                <stop offset="100%" stopColor="#96CEB4" />
              </linearGradient>
            </defs>
          )}
        </svg>
        {/* Sparkle overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
          <div className="diamond-sparkle-ray" />
        </div>
      </div>
    </div>
  );
};
