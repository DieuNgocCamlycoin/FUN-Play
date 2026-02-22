interface DiamondBadgeProps {
  lightScore: number;
  suspiciousScore?: number;
  banned?: boolean;
  violationLevel?: number;
}

const getDiamondGlow = (
  lightScore: number,
  suspiciousScore?: number,
  banned?: boolean,
  violationLevel?: number
): string => {
  if (banned) return "none";
  if ((violationLevel ?? 0) >= 3 || (suspiciousScore ?? 0) >= 5) return "none";
  if (lightScore >= 80 && (suspiciousScore ?? 0) <= 1)
    return "drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 16px rgba(200,220,255,0.6)) drop-shadow(0 0 24px rgba(150,180,255,0.3))";
  if (lightScore >= 60)
    return "drop-shadow(0 0 6px rgba(59,130,246,0.5)) drop-shadow(0 0 12px rgba(59,130,246,0.25))";
  if (lightScore >= 40)
    return "drop-shadow(0 0 6px rgba(0,231,255,0.5)) drop-shadow(0 0 12px rgba(0,231,255,0.25))";
  if (lightScore >= 20)
    return "drop-shadow(0 0 6px rgba(34,197,94,0.5)) drop-shadow(0 0 12px rgba(34,197,94,0.25))";
  return "none";
};

const getDiamondFilter = (
  banned?: boolean,
  violationLevel?: number,
  suspiciousScore?: number
): string => {
  if (banned) return "grayscale(1) opacity(0.5)";
  if ((violationLevel ?? 0) >= 3 || (suspiciousScore ?? 0) >= 5) return "brightness(0.3)";
  return "none";
};

export const DiamondBadge = ({ lightScore, suspiciousScore, banned, violationLevel }: DiamondBadgeProps) => {
  const glow = getDiamondGlow(lightScore, suspiciousScore, banned, violationLevel);
  const imgFilter = getDiamondFilter(banned, violationLevel, suspiciousScore);

  return (
    <div
    className="absolute z-30 left-1/2 -translate-x-1/2 -top-10 md:-top-12"
      style={{ filter: glow }}
    >
      <img
        src="/images/diamond-badge.png"
        alt="Diamond Badge"
        className="w-[63px] h-[63px] md:w-[72px] md:h-[72px] object-contain"
        style={{ filter: imgFilter !== "none" ? imgFilter : undefined }}
      />
    </div>
  );
};