interface DiamondBadgeProps {
  lightScore: number;
  banned?: boolean;
  violationLevel?: number;
}

const getDiamondColor = (lightScore: number, banned?: boolean, violationLevel?: number): string => {
  if (banned) return "#9CA3AF"; // Gray
  if ((violationLevel ?? 0) >= 3) return "#1F2937"; // Black
  if (lightScore >= 80) return "#FFD700"; // Gold
  if (lightScore >= 60) return "#00E7FF"; // Cyan
  if (lightScore >= 40) return "#22C55E"; // Green
  return "#E5E7EB"; // Silver
};

const getDiamondGlow = (color: string): string => {
  if (color === "#9CA3AF" || color === "#1F2937") return "none";
  return `drop-shadow(0 0 6px ${color}80) drop-shadow(0 0 12px ${color}40)`;
};

export const DiamondBadge = ({ lightScore, banned, violationLevel }: DiamondBadgeProps) => {
  const color = getDiamondColor(lightScore, banned, violationLevel);
  const glow = getDiamondGlow(color);

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
            stroke={color === "#E5E7EB" ? "#D1D5DB" : color}
            strokeWidth="0.5"
          />
          {/* Top facet highlight */}
          <path
            d="M16 2L28 12L16 14L4 12L16 2Z"
            fill="white"
            fillOpacity="0.3"
          />
          {/* Left facet */}
          <path
            d="M4 12L16 14L16 30L4 12Z"
            fill="black"
            fillOpacity="0.1"
          />
        </svg>
        {/* Sparkle overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
          <div className="diamond-sparkle-ray" />
        </div>
      </div>
    </div>
  );
};
