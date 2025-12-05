import { motion } from "framer-motion";
import { Users, Video, Eye, MessageSquare, Coins } from "lucide-react";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";

interface LuxuryStatsCardsProps {
  followers: number;
  videos: number;
  totalViews: number;
  comments: number;
  rewardsEarned: number;
}

export const LuxuryStatsCards = ({
  followers,
  videos,
  totalViews,
  comments,
  rewardsEarned,
}: LuxuryStatsCardsProps) => {
  const stats = [
    { icon: Users, label: "Followers", value: followers, color: "from-pink-500 to-rose-500", glow: "#ec4899" },
    { icon: Video, label: "Videos", value: videos, color: "from-violet-500 to-purple-500", glow: "#8b5cf6" },
    { icon: Eye, label: "Total Views", value: totalViews, color: "from-cyan-500 to-blue-500", glow: "#06b6d4" },
    { icon: MessageSquare, label: "Comments", value: comments, color: "from-green-500 to-emerald-500", glow: "#22c55e" },
    { icon: Coins, label: "Rewards", value: rewardsEarned, color: "from-yellow-400 to-amber-500", glow: "#fbbf24", suffix: " CAMLY" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative group"
        >
          {/* Glassmorphism card */}
          <div 
            className="relative overflow-hidden rounded-xl p-4 backdrop-blur-xl border border-white/20"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            }}
          >
            {/* Glow effect on hover */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
              style={{
                background: `radial-gradient(circle at center, ${stat.glow}33, transparent 70%)`,
              }}
            />

            {/* Icon */}
            <motion.div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}
              whileHover={{
                boxShadow: `0 0 20px ${stat.glow}`,
              }}
            >
              <stat.icon className="w-5 h-5 text-white" />
            </motion.div>

            {/* Value */}
            <div className="text-2xl font-black text-foreground">
              <CounterAnimation 
                value={stat.value} 
                suffix={stat.suffix}
                duration={1500}
              />
            </div>

            {/* Label */}
            <div className="text-xs text-muted-foreground font-medium">
              {stat.label}
            </div>

            {/* Decorative corner */}
            <div 
              className="absolute top-0 right-0 w-16 h-16 opacity-20"
              style={{
                background: `linear-gradient(135deg, ${stat.glow}, transparent)`,
                borderRadius: '0 0.75rem 0 100%',
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
