import { Users, Film, Image, Award, Star, Crown } from "lucide-react";
import { GlassPanel } from "./GlassPanel";

// ── Mock data ─────────────────────────────────────────────────────────────────
const HONOR_STATS = [
  { icon: <Users className="w-4 h-4" />, label: "TOTAL USERS", value: "12,481", color: "#7A2BFF" },
  { icon: <Film className="w-4 h-4" />, label: "TOTAL POSTS", value: "3,204", color: "#00E7FF" },
  { icon: <Image className="w-4 h-4" />, label: "TOTAL PHOTOS", value: "8,917", color: "#FF6B9D" },
  { icon: <Award className="w-4 h-4" />, label: "TOTAL REWARD", value: "245K CAMLY", color: "#FFD700" },
];

const TOP_RANKING = [
  { rank: 1, name: "Angel Quế Anh", score: "🌿 9.8M", avatar: "🥇", badge: "#FFD700" },
  { rank: 2, name: "Vinh Nguyễn",   score: "🌿 8.5M", avatar: "🥈", badge: "#C0C0C0" },
  { rank: 3, name: "Thu Hương",     score: "🌿 7.6M", avatar: "🥉", badge: "#CD7F32" },
  { rank: 4, name: "Minh Khang",    score: "🌿 6.9M", avatar: "⭐", badge: "#7A2BFF" },
  { rank: 5, name: "Lan Anh",       score: "🌿 6.2M", avatar: "⭐", badge: "#7A2BFF" },
];

const TOP_SPONSORS = [
  { name: "FUN Treasury",   amount: "50,000 CAMLY", avatar: "🏛️" },
  { name: "Angel Quế Anh",  amount: "12,500 CAMLY", avatar: "👼" },
  { name: "Camly Coin",     amount: "8,000 CAMLY",  avatar: "🪙" },
];

/**
 * HonorRightPanel – Right panel Liquid Glass + HoloBorder cầu vồng rực rỡ.
 * Honor Board theo layout dọc (icon + label + số cyan).
 * Top Ranking với avatar tròn + số CAMLY định dạng cây.
 */
export const HonorRightPanel = () => {
  return (
    <GlassPanel variant="holo" className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">

        {/* ── CARD 1: HONOR BOARD ──────────────────────────────── */}
        <StatCard title="🏆 HONOR BOARD" titleGradient="linear-gradient(90deg, #FFD700, #FF6B9D)">
          <div className="space-y-2">
            {HONOR_STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.80), rgba(255,255,255,0.40))",
                  border: "1px solid rgba(255,255,255,0.70)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {/* Icon + Label (bên trái) */}
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
                  style={{ background: `${s.color}22`, color: s.color }}
                >
                  {s.icon}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex-1"
                  style={{ color: "#7A2BFF" }}
                >
                  {s.label}
                </span>
                {/* Số nổi bật bên phải (cyan) */}
                <span
                  className="text-xs font-extrabold shrink-0"
                  style={{ color: "#00C4D4" }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </StatCard>

        {/* ── CARD 2: TOP RANKING ──────────────────────────────── */}
        <StatCard title="🎖️ TOP RANKING" titleGradient="linear-gradient(90deg, #00E7FF, #7A2BFF)">
          <div className="space-y-2">
            {TOP_RANKING.map((r) => (
              <div
                key={r.rank}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl"
                style={{
                  background:
                    r.rank === 1
                      ? "linear-gradient(135deg, rgba(255,215,0,0.18), rgba(255,180,0,0.08))"
                      : r.rank === 2
                      ? "linear-gradient(135deg, rgba(192,192,192,0.18), rgba(160,160,160,0.08))"
                      : r.rank === 3
                      ? "linear-gradient(135deg, rgba(205,127,50,0.18), rgba(180,100,20,0.08))"
                      : "rgba(255,255,255,0.50)",
                  border: `1px solid ${r.badge}33`,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                {/* Avatar tròn (emoji huy hiệu) */}
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${r.badge}30, ${r.badge}10)`,
                    border: `1.5px solid ${r.badge}60`,
                  }}
                >
                  {r.avatar}
                </span>
                {/* Tên */}
                <span
                  className="flex-1 text-[11px] font-bold leading-tight"
                  style={{ color: "#2D1B6E" }}
                >
                  {r.name}
                </span>
                {/* Số CAMLY – màu cam */}
                <span
                  className="text-[10px] font-extrabold shrink-0"
                  style={{ color: "#FF8C00" }}
                >
                  {r.score}
                </span>
              </div>
            ))}
          </div>
        </StatCard>

        {/* ── CARD 3: TOP SPONSORS ─────────────────────────────── */}
        <StatCard title="💎 TOP SPONSORS" titleGradient="linear-gradient(90deg, #FF6B9D, #FFD700)">
          <div className="space-y-2">
            {TOP_SPONSORS.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255,105,180,0.12), rgba(122,43,255,0.08))",
                  border: "1px solid rgba(255,105,180,0.25)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                {/* Avatar */}
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,105,180,0.25), rgba(122,43,255,0.15))",
                  }}
                >
                  {s.avatar}
                </span>
                <span className="flex-1 text-[11px] font-bold" style={{ color: "#2D1B6E" }}>
                  {s.name}
                </span>
                <span className="text-[10px] font-extrabold" style={{ color: "#FFD700" }}>
                  {s.amount}
                </span>
              </div>
            ))}
          </div>
        </StatCard>

        {/* Footer */}
        <div className="text-center pt-1">
          <p className="text-[9px]" style={{ color: "rgba(0,0,0,0.35)" }}>
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

// ─── Component phụ: StatCard ──────────────────────────────────────────────────
function StatCard({
  title,
  titleGradient,
  children,
}: {
  title: string;
  titleGradient: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-3 space-y-2.5"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.70), rgba(255,255,255,0.35))",
        border: "1px solid rgba(255,255,255,0.80)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      <h3
        className="text-xs font-extrabold tracking-wide"
        style={{
          background: titleGradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
