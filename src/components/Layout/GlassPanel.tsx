import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "holo";
  style?: React.CSSProperties;
}

/**
 * GlassPanel – Component panel trong suốt theo chuẩn glassmorphism FUN PLAY.
 * Variant "default": viền trắng mờ nhẹ.
 * Variant "holo": viền gradient 7 màu nhẹ (hologram tinh tế, không lòe loẹt).
 */
export const GlassPanel = ({
  children,
  className,
  variant = "default",
  style,
}: GlassPanelProps) => {
  if (variant === "holo") {
    return (
      <div
        className={cn("relative rounded-[20px] p-[1.5px]", className)}
        style={style}
      >
        {/* Viền hologram 7 màu gradient nhẹ */}
        <div
          className="absolute inset-0 rounded-[20px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,231,255,0.5) 0%, rgba(122,43,255,0.4) 20%, rgba(255,215,0,0.4) 35%, rgba(0,200,80,0.4) 50%, rgba(255,80,180,0.4) 65%, rgba(0,150,255,0.5) 80%, rgba(0,231,255,0.5) 100%)",
            opacity: 0.7,
          }}
        />
        {/* Nội dung bên trong – nền glass */}
        <div
          className="relative rounded-[19px] h-full w-full overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.13)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-[20px] overflow-hidden", className)}
      style={{
        background: "rgba(255,255,255,0.14)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1.5px solid rgba(255,255,255,0.30)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
