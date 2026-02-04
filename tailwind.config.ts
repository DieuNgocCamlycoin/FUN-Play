import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        cosmic: {
          cyan: "hsl(var(--cosmic-cyan))",
          purple: "hsl(var(--cosmic-purple))",
          magenta: "hsl(var(--cosmic-magenta))",
          gold: "hsl(var(--cosmic-gold))",
          sapphire: "hsl(var(--cosmic-sapphire))",
        },
        divine: {
          pink: "hsl(var(--divine-pink))",
          "rose-gold": "hsl(var(--divine-rose-gold))",
          lavender: "hsl(var(--divine-lavender))",
        },
        glow: {
          gold: "hsl(var(--glow-gold))",
          cyan: "hsl(var(--glow-cyan))",
          magenta: "hsl(var(--glow-magenta))",
          sapphire: "hsl(var(--glow-sapphire))",
          white: "hsl(var(--glow-white))",
        },
        fun: {
          yellow: "hsl(var(--cosmic-gold))",
          blue: "hsl(var(--cosmic-sapphire))",
        },
        hover: {
          yellow: "hsl(var(--cosmic-cyan) / 0.15)",
          blue: "hsl(var(--cosmic-sapphire) / 0.15)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        sparkle: {
          "0%, 100%": { opacity: "0", transform: "scale(0) rotate(0deg)" },
          "50%": { opacity: "1", transform: "scale(1) rotate(180deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-20px) translateX(10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { filter: "brightness(1) drop-shadow(0 0 10px currentColor)" },
          "50%": { filter: "brightness(1.3) drop-shadow(0 0 20px currentColor)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "rainbow-border": {
          "0%": { borderColor: "hsl(216 100% 50%)", boxShadow: "0 0 40px hsl(216 100% 50% / 1)" },
          "25%": { borderColor: "hsl(180 100% 50%)", boxShadow: "0 0 40px hsl(180 100% 50% / 1)" },
          "50%": { borderColor: "hsl(291 100% 50%)", boxShadow: "0 0 40px hsl(291 100% 50% / 1)" },
          "75%": { borderColor: "hsl(51 100% 50%)", boxShadow: "0 0 40px hsl(51 100% 50% / 1)" },
          "100%": { borderColor: "hsl(216 100% 50%)", boxShadow: "0 0 40px hsl(216 100% 50% / 1)" },
        },
        "sparkle-sweep": {
          "0%": { transform: "translateX(-100%) translateY(-100%) rotate(45deg)" },
          "100%": { transform: "translateX(100%) translateY(100%) rotate(45deg)" },
        },
        "pulse-halo": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        "rainbow-sparkle": {
          "0%": { 
            boxShadow: "0 0 10px rgba(0,255,255,0.5), 0 0 20px rgba(0,255,255,0.3)" 
          },
          "25%": { 
            boxShadow: "0 0 15px rgba(168,85,247,0.5), 0 0 30px rgba(168,85,247,0.3)" 
          },
          "50%": { 
            boxShadow: "0 0 15px rgba(236,72,153,0.5), 0 0 30px rgba(236,72,153,0.3)" 
          },
          "75%": { 
            boxShadow: "0 0 15px rgba(251,191,36,0.5), 0 0 30px rgba(251,191,36,0.3)" 
          },
          "100%": { 
            boxShadow: "0 0 10px rgba(0,255,255,0.5), 0 0 20px rgba(0,255,255,0.3)" 
          },
        },
        "mini-player-border": {
          "0%, 100%": { borderColor: "rgba(0, 255, 255, 0.3)" },
          "33%": { borderColor: "rgba(168, 85, 247, 0.3)" },
          "66%": { borderColor: "rgba(236, 72, 153, 0.3)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        sparkle: "sparkle 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        shimmer: "shimmer 6s ease-in-out infinite",
        "rainbow-border": "rainbow-border 3s linear infinite",
        "sparkle-sweep": "sparkle-sweep 3s linear infinite",
        "pulse-halo": "pulse-halo 2s ease-in-out infinite",
        "rainbow-sparkle": "rainbow-sparkle 0.6s ease-out",
        "mini-player-border": "mini-player-border 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
