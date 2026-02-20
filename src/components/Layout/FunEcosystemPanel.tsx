import { useState } from "react";
import { ChevronDown, Home, Zap, BookOpen, FileText, Music, Heart } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  {
    name: "FUN PROFILE",
    url: "https://fun.rich",
    emoji: "👤",
    gradientFrom: "#8B5CF6",
    gradientTo: "#A78BFA",
  },
  {
    name: "ANGEL AI",
    url: "https://angel.fun.rich",
    emoji: "👼",
    gradientFrom: "#06B6D4",
    gradientTo: "#22D3EE",
  },
  {
    name: "FUN TREASURY",
    url: "https://treasury.fun.rich",
    emoji: "🏛️",
    gradientFrom: "#F59E0B",
    gradientTo: "#FCD34D",
  },
  {
    name: "FUN FARM",
    url: "https://farm.fun.rich",
    emoji: "🌾",
    gradientFrom: "#10B981",
    gradientTo: "#34D399",
  },
  {
    name: "FUN PLANET",
    url: "https://planet.fun.rich",
    emoji: "🌍",
    gradientFrom: "#3B82F6",
    gradientTo: "#60A5FA",
  },
  {
    name: "FUN CHARITY",
    url: "https://charity.fun.rich",
    emoji: "❤️",
    gradientFrom: "#F43F5E",
    gradientTo: "#FB7185",
  },
  {
    name: "FUN GREEN EARTH",
    url: "https://5DEarth.fun.rich",
    emoji: "🌿",
    gradientFrom: "#059669",
    gradientTo: "#10B981",
  },
  {
    name: "FUN ACADEMY",
    url: "https://academy.fun.rich",
    emoji: "🎓",
    gradientFrom: "#F97316",
    gradientTo: "#FB923C",
  },
  {
    name: "CAMLY COIN",
    url: "https://camly.co",
    emoji: "🪙",
    gradientFrom: "#EAB308",
    gradientTo: "#FACC15",
  },
  {
    name: "FUN WALLET",
    url: "https://wallet.fun.rich",
    emoji: "💼",
    gradientFrom: "#7C3AED",
    gradientTo: "#8B5CF6",
  },
];

const ABOUT_ITEMS = [
  { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Luật Ánh Sáng", url: "#" },
  { icon: <Zap className="w-3.5 h-3.5" />, label: "Build & Bounty", url: "/build-bounty" },
  { icon: <FileText className="w-3.5 h-3.5" />, label: "White Paper", url: "#" },
];

const NAV_ITEMS = [
  { icon: <Home className="w-4 h-4" />, label: "Trang chủ", url: "/" },
  { icon: <Zap className="w-4 h-4" />, label: "Shorts", url: "/shorts" },
  { icon: <Heart className="w-4 h-4" />, label: "Kênh đăng ký", url: "/subscriptions" },
  { icon: <Music className="w-4 h-4" />, label: "Thiền cùng Cha", url: "/meditation" },
  { icon: <Music className="w-4 h-4" />, label: "Tạo Nhạc Ánh Sáng", url: "/ai-music" },
];

/**
 * FunEcosystemPanel – Left panel Liquid Glass với viền Hologram.
 * Layout theo thiết kế: logo tròn lớn + tên đậm + section Điều hướng collapsible.
 */
export const FunEcosystemPanel = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(true);

  return (
    <GlassPanel variant="liquid" className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">

        {/* ── TIÊU ĐỀ ─────────────────────────────────────────── */}
        <div className="text-center pb-1">
          <h2
            className="text-sm font-extrabold tracking-widest uppercase"
            style={{
              background: "linear-gradient(135deg, #7A2BFF 0%, #00E7FF 50%, #FF6B9D 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            🌿 FUN ECOSYSTEM
          </h2>
        </div>

        {/* ── ABOUT FUN PLAY – Collapsible ────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(122,43,255,0.10), rgba(0,231,255,0.07))",
            border: "1px solid rgba(122,43,255,0.25)",
          }}
        >
          <button
            onClick={() => setAboutOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left"
          >
            <span className="text-xs font-bold" style={{ color: "#7A2BFF" }}>
              ℹ️ About FUN PLAY
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                aboutOpen && "rotate-180"
              )}
              style={{ color: "#7A2BFF" }}
            />
          </button>
          {aboutOpen && (
            <div className="px-3 pb-3 space-y-1">
              {ABOUT_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-purple-100/50"
                  style={{ color: "#7A2BFF" }}
                >
                  <span style={{ color: "#00E7FF" }}>{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── PLATFORM LIST ────────────────────────────────────── */}
        <div className="space-y-2">
          <p
            className="text-[10px] font-bold uppercase tracking-widest px-1"
            style={{ color: "#7A2BFF" }}
          >
            🔗 Hệ sinh thái
          </p>
          {PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group hover:-translate-y-0.5"
              style={{
                background: "rgba(255,255,255,0.70)",
                border: "1px solid rgba(255,255,255,0.90)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${p.gradientFrom}40`;
                (e.currentTarget as HTMLElement).style.border = `1px solid ${p.gradientFrom}60`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
                (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.90)";
              }}
            >
              {/* Logo tròn 40px */}
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})`,
                }}
              >
                {p.emoji}
              </span>
              {/* Tên platform */}
              <span
                className="text-[13px] font-bold leading-tight flex-1"
                style={{ color: "#2D1B6E" }}
              >
                {p.name}
              </span>
            </a>
          ))}
        </div>

        {/* ── ĐIỀU HƯỚNG – Collapsible ─────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(0,231,255,0.08), rgba(122,43,255,0.06))",
            border: "1px solid rgba(0,231,255,0.25)",
          }}
        >
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left"
          >
            <span className="text-xs font-bold" style={{ color: "#00C4D4" }}>
              🧭 Điều hướng
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                navOpen && "rotate-180"
              )}
              style={{ color: "#00C4D4" }}
            />
          </button>
          {navOpen && (
            <div className="px-3 pb-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-cyan-50/60"
                  style={{ color: "#0F5460" }}
                >
                  <span style={{ color: "#00C4D4" }}>{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-1 text-center">
          <p className="text-[9px]" style={{ color: "rgba(0,0,0,0.35)" }}>
            Powered by{" "}
            <span
              className="font-bold"
              style={{
                background: "linear-gradient(90deg, #7A2BFF, #00E7FF, #FFD700)",
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
