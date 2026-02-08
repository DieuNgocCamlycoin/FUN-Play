import { useState } from "react";
import { X } from "lucide-react";

const petals = [
  // Hoa đào (peach blossoms) - pink
  { left: 5, delay: 0, duration: 8, size: 14, type: "dao" as const },
  { left: 15, delay: 2.5, duration: 10, size: 10, type: "dao" as const },
  { left: 28, delay: 1, duration: 9, size: 16, type: "dao" as const },
  { left: 40, delay: 3.5, duration: 11, size: 12, type: "dao" as const },
  { left: 55, delay: 0.5, duration: 8.5, size: 14, type: "dao" as const },
  { left: 65, delay: 4, duration: 10.5, size: 10, type: "dao" as const },
  { left: 78, delay: 1.5, duration: 9.5, size: 16, type: "dao" as const },
  { left: 88, delay: 3, duration: 8, size: 12, type: "dao" as const },
  { left: 95, delay: 2, duration: 11, size: 14, type: "dao" as const },
  // Hoa mai (apricot blossoms) - yellow
  { left: 10, delay: 1.5, duration: 9, size: 12, type: "mai" as const },
  { left: 22, delay: 3, duration: 10, size: 16, type: "mai" as const },
  { left: 35, delay: 0, duration: 8.5, size: 10, type: "mai" as const },
  { left: 48, delay: 2, duration: 11, size: 14, type: "mai" as const },
  { left: 58, delay: 4.5, duration: 9, size: 12, type: "mai" as const },
  { left: 72, delay: 1, duration: 10.5, size: 16, type: "mai" as const },
  { left: 82, delay: 3.5, duration: 8, size: 10, type: "mai" as const },
  { left: 92, delay: 0.5, duration: 9.5, size: 14, type: "mai" as const },
];

export const TetDecorations = () => {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <>
      {/* Tet Banner */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-1.5 px-4 text-white text-sm font-medium"
          style={{
            background: "linear-gradient(90deg, #FF69B4, #FFD700, #FF69B4)",
            backgroundSize: "200% 100%",
            animation: "tet-banner-shimmer 3s linear infinite",
          }}
        >
          <span>🌸</span>
          <span>Chúc Mừng Năm Mới — Happy Tết 2025!</span>
          <span>🌼</span>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-2 p-0.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Đóng banner Tết"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Falling petals */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
        {petals.map((petal, i) => (
          <div
            key={i}
            className="absolute tet-petal"
            style={{
              left: `${petal.left}%`,
              top: "-20px",
              width: `${petal.size}px`,
              height: `${petal.size}px`,
              animationDelay: `${petal.delay}s`,
              animationDuration: `${petal.duration}s`,
              opacity: 0.7,
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background: petal.type === "dao"
                  ? "radial-gradient(circle at 30% 30%, #FFB7C5, #FF69B4)"
                  : "radial-gradient(circle at 30% 30%, #FFD700, #FFC107)",
                borderRadius: "50% 0 50% 50%",
                boxShadow: petal.type === "dao"
                  ? "0 0 4px rgba(255, 105, 180, 0.4)"
                  : "0 0 4px rgba(255, 215, 0, 0.4)",
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};
