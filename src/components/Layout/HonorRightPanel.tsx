import { Users, Film, Image, Award, Trophy, Star, Crown, Heart } from "lucide-react";
import { GlassPanel } from "./GlassPanel";

// Mock data để preview – sẽ thay bằng dữ liệu thật khi áp dụng
const HONOR_STATS = [
  { icon: <Users className="w-4 h-4" />, label: "Thành viên", value: "12,481", color: "#7A2BFF" },
  { icon: <Film className="w-4 h-4" />, label: "Video", value: "3,204", color: "#00E7FF" },
  { icon: <Image className="w-4 h-4" />, label: "Ảnh & Post", value: "8,917", color: "#FF69B4" },
  { icon: <Award className="w-4 h-4" />, label: "Phần thưởng", value: "245K CAMLY", color: "#FFD700" },
];

const TOP_RANKING = [
  { rank: 1, name: "Angel Quế Anh", score: "9,840", avatar: "👑" },
  { rank: 2, name: "Vinh Nguyễn", score: "8,210", avatar: "🥈" },
  { rank: 3, name: "Thu Hương", score: "7,650", avatar: "🥉" },
  { rank: 4, name: "Minh Khang", score: "6,900", avatar: "⭐" },
  { rank: 5, name: "Lan Anh", score: "6,200", avatar: "⭐" },
];

const TOP_SPONSORS = [
  { name: "FUN Treasury", amount: "50,000 CAMLY", avatar: "🏛️" },
  { name: "Angel Quế Anh", amount: "12,500 CAMLY", avatar: "👼" },
  { name: "Camly Coin", amount: "8,000 CAMLY", avatar: "🪙" },
];

/**
 * HonorRightPanel – Right panel glass + HoloBorder gradient 7 màu nhẹ.
 * Tích hợp: Honor Board, Top Ranking, Top Sponsors.
 */
export const HonorRightPanel = () => {
  return (
    <GlassPanel variant="holo" className="h-full flex flex-col">
      {/* Nội dung bên trong */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">

        {/* === CARD 1: HONOR BOARD === */}
        <StatCard title="🏆 Honor Board" titleColor="#FFD700">
          <div className="grid grid-cols-2 gap-2">
            {HONOR_STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-2.5 flex flex-col gap-1"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <span style={{ color: s.color }}>{s.icon}</span>
                <span className="text-xs font-bold text-foreground/90">{s.value}</span>
                <span className="text-[9px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </StatCard>

        {/* === CARD 2: TOP RANKING === */}
        <StatCard title="🎖️ Top Ranking" titleColor="#00E7FF">
          <div className="space-y-1.5">
            {TOP_RANKING.map((r) => (
              <div
                key={r.rank}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
                style={{
                  background:
                    r.rank === 1
                      ? "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,180,0,0.08))"
                      : r.rank === 2
                      ? "linear-gradient(135deg, rgba(192,192,192,0.15), rgba(160,160,160,0.08))"
                      : r.rank === 3
                      ? "linear-gradient(135deg, rgba(205,127,50,0.15), rgba(180,100,20,0.08))"
                      : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <span className="text-base w-6 text-center">{r.avatar}</span>
                <span className="flex-1 text-[11px] font-medium text-foreground/80">{r.name}</span>
                <span className="text-[10px] font-bold text-amber-500">{r.score}</span>
              </div>
            ))}
          </div>
        </StatCard>

        {/* === CARD 3: TOP SPONSORS === */}
        <StatCard title="💎 Top Sponsors" titleColor="#FF69B4">
          <div className="space-y-1.5">
            {TOP_SPONSORS.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255,105,180,0.10), rgba(122,43,255,0.08))",
                  border: "1px solid rgba(255,105,180,0.20)",
                }}
              >
                <span className="text-base w-6 text-center">{s.avatar}</span>
                <span className="flex-1 text-[11px] font-medium text-foreground/80">{s.name}</span>
                <span className="text-[10px] font-bold" style={{ color: "#FFD700" }}>{s.amount}</span>
              </div>
            ))}
          </div>
        </StatCard>

        {/* Footer */}
        <div className="text-center pt-1">
          <p className="text-[9px] text-muted-foreground/60">
            Cập nhật mỗi giờ •{" "}
            <span
              className="font-bold"
              style={{
                background: "linear-gradient(90deg, #00E7FF, #7A2BFF, #FFD700)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              FUN Play
            </span>
          </p>
        </div>
      </div>
    </GlassPanel>
  );
};

// ─── Component phụ: StatCard ───────────────────────────────────────────────
function StatCard({
  title,
  titleColor,
  children,
}: {
  title: string;
  titleColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-3 space-y-2"
      style={{
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <h3
        className="text-xs font-bold"
        style={{ color: titleColor }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
