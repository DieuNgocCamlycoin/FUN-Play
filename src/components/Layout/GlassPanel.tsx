import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "holo" | "liquid";
  style?: React.CSSProperties;
}

/**
 * GlassPanel – Component panel Liquid Glass chuẩn FUN PLAY.
 * Variant "default": viền hologram 7 màu nhẹ (left panel).
 * Variant "liquid": Liquid Glass sáng hơn, viền hologram đậm.
 * Variant "holo": viền hologram cầu vồng rực rỡ (right panel).
 */
export const GlassPanel = ({
  children,
  className,
  variant = "default",
  style,
}: GlassPanelProps) => {
  // ── Holo (Right Panel) – viền cầu vồng rực rỡ nhất ───────────────────────
  if (variant === "holo") {
    return (
      <div
        className={cn("relative rounded-[22px] p-[2.5px]", className)}
        style={style}
      >
        {/* Lớp viền hologram cầu vồng rực – animated shimmer */}
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{
            background:
              "linear-gradient(135deg, #FF6B9D 0%, #FF3CAC 10%, #7A2BFF 22%, #00E7FF 36%, #00FF88 50%, #FFD700 65%, #FF6B00 78%, #FF6B9D 90%, #00E7FF 100%)",
            opacity: 1,
          }}
        />
        {/* Glow bên ngoài */}
        <div
          className="absolute inset-0 rounded-[22px] blur-[6px]"
          style={{
            background:
              "linear-gradient(135deg, #FF6B9D40 0%, #7A2BFF40 25%, #00E7FF40 50%, #FFD70040 75%, #FF6B9D40 100%)",
          }}
        />
        {/* Nội dung – Liquid Glass */}
        <div
          className="relative rounded-[20px] h-full w-full overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(22px) saturate(200%)",
            WebkitBackdropFilter: "blur(22px) saturate(200%)",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // ── Liquid (Left Panel) – viền hologram đậm vừa ───────────────────────────
  if (variant === "liquid") {
    return (
      <div
        className={cn("relative rounded-[22px] p-[2px]", className)}
        style={style}
      >
        {/* Lớp viền hologram */}
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{
            background:
              "linear-gradient(135deg, #00E7FF 0%, #7A2BFF 20%, #FF6B9D 38%, #FFD700 55%, #00FF88 70%, #00E7FF 85%, #7A2BFF 100%)",
            opacity: 0.9,
          }}
        />
        {/* Glow mờ ngoài */}
        <div
          className="absolute inset-0 rounded-[22px] blur-[4px]"
          style={{
            background:
              "linear-gradient(135deg, #00E7FF30 0%, #7A2BFF30 33%, #FF6B9D30 66%, #FFD70030 100%)",
          }}
        />
        {/* Nội dung */}
        <div
          className="relative rounded-[20px] h-full w-full overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.60)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // ── Default – viền hologram nhẹ ────────────────────────────────────────────
  return (
    <div
      className={cn("relative rounded-[22px] p-[2px]", className)}
      style={style}
    >
      {/* Viền hologram nhẹ */}
      <div
        className="absolute inset-0 rounded-[22px]"
        style={{
          background:
            "linear-gradient(135deg, #00E7FF 0%, #7A2BFF 25%, #FF6B9D 50%, #FFD700 75%, #00E7FF 100%)",
          opacity: 0.75,
        }}
      />
      {/* Nội dung */}
      <div
        className={cn("relative rounded-[20px] h-full w-full overflow-hidden")}
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(18px) saturate(180%)",
          WebkitBackdropFilter: "blur(18px) saturate(180%)",
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};
