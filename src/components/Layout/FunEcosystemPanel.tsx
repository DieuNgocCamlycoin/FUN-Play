import { useState } from "react";
import { ChevronDown, ExternalLink, BookOpen, Zap, FileText } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  {
    name: "FUN PROFILE",
    url: "https://fun.rich",
    emoji: "👤",
    color: "from-violet-500/20 to-purple-500/20",
    glow: "hover:shadow-purple-300/40",
  },
  {
    name: "ANGEL AI",
    url: "https://angel.fun.rich",
    emoji: "👼",
    color: "from-sky-400/20 to-cyan-400/20",
    glow: "hover:shadow-cyan-300/40",
  },
  {
    name: "FUN TREASURY",
    url: "https://treasury.fun.rich",
    emoji: "🏛️",
    color: "from-amber-400/20 to-yellow-400/20",
    glow: "hover:shadow-yellow-300/40",
  },
  {
    name: "FUN FARM",
    url: "https://farm.fun.rich",
    emoji: "🌾",
    color: "from-green-400/20 to-emerald-400/20",
    glow: "hover:shadow-green-300/40",
  },
  {
    name: "FUN PLANET",
    url: "https://planet.fun.rich",
    emoji: "🌍",
    color: "from-blue-400/20 to-indigo-400/20",
    glow: "hover:shadow-blue-300/40",
  },
  {
    name: "FUN CHARITY",
    url: "https://charity.fun.rich",
    emoji: "❤️",
    color: "from-rose-400/20 to-pink-400/20",
    glow: "hover:shadow-pink-300/40",
  },
  {
    name: "FUN GREEN EARTH",
    url: "https://5DEarth.fun.rich",
    emoji: "🌿",
    color: "from-teal-400/20 to-green-400/20",
    glow: "hover:shadow-teal-300/40",
  },
  {
    name: "FUN ACADEMY",
    url: "https://academy.fun.rich",
    emoji: "🎓",
    color: "from-orange-400/20 to-amber-400/20",
    glow: "hover:shadow-orange-300/40",
  },
  {
    name: "CAMLY COIN",
    url: "https://camly.co",
    emoji: "🪙",
    color: "from-yellow-400/20 to-amber-500/20",
    glow: "hover:shadow-yellow-400/50",
  },
  {
    name: "FUN WALLET",
    url: "https://wallet.fun.rich",
    emoji: "💼",
    color: "from-violet-400/20 to-purple-400/20",
    glow: "hover:shadow-violet-300/40",
  },
];

const ABOUT_ITEMS = [
  { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Luật Ánh Sáng", url: "#" },
  { icon: <Zap className="w-3.5 h-3.5" />, label: "Build & Bounty", url: "/build-bounty" },
  { icon: <FileText className="w-3.5 h-3.5" />, label: "White Paper", url: "#" },
];

/**
 * FunEcosystemPanel – Left panel với 10 platform FUN PLAY + About FUN PLAY collapsible.
 */
export const FunEcosystemPanel = () => {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <GlassPanel className="h-full flex flex-col p-0 overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        
        {/* Tiêu đề */}
        <div className="text-center mb-1">
          <h2
            className="text-sm font-bold tracking-wider uppercase"
            style={{
              background: "linear-gradient(135deg, #00E7FF 0%, #7A2BFF 50%, #FFD700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            🌿 FUN ECOSYSTEM
          </h2>
        </div>

        {/* About FUN PLAY – Collapsible */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(122,43,255,0.10)",
            border: "1px solid rgba(122,43,255,0.25)",
          }}
        >
          <button
            onClick={() => setAboutOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left group"
          >
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              ℹ️ About FUN PLAY
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-purple-500 transition-transform duration-200",
                aboutOpen && "rotate-180"
              )}
            />
          </button>
          {aboutOpen && (
            <div className="px-3 pb-3 space-y-1.5">
              {ABOUT_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-purple-800 dark:text-purple-200 hover:bg-purple-100/40 transition-colors"
                >
                  <span className="text-purple-500">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Danh sách 10 Platform */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">
            🔗 Hệ sinh thái
          </p>
          {PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-2xl transition-all duration-200 group",
                "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
                p.glow,
                "hover:shadow-lg"
              )}
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))`,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              {/* Emoji logo */}
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.15))`,
                  backdropFilter: "blur(4px)",
                }}
              >
                {p.emoji}
              </span>
              {/* Tên */}
              <span className="text-[11px] font-semibold text-foreground/80 group-hover:text-foreground flex-1 leading-tight">
                {p.name}
              </span>
              {/* Mũi tên link ngoài */}
              <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0" />
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 text-center">
          <p className="text-[9px] text-muted-foreground/60">
            Powered by{" "}
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
