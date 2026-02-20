import { Crown, Users, FileText, Image, Video, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { HonobarStats } from "@/hooks/useHonobarStats";
import { useNavigate } from "react-router-dom";
interface StatPillProps {
  icon: React.ElementType;
  label: string;
  value: number;
  loading: boolean;
  index: number;
  onClick?: () => void;
}
const StatPill = ({
  icon: Icon,
  label,
  value,
  loading,
  index,
  onClick
}: StatPillProps) => <motion.div initial={{
  opacity: 0,
  x: -20
}} animate={{
  opacity: 1,
  x: 0
}} transition={{
  delay: index * 0.08,
  type: "spring",
  stiffness: 200
}} whileHover={{
  x: 4,
  scale: 1.01
}} onClick={onClick} className={cn(
  "flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg",
  "bg-white/90 border border-[#00E7FF]/30",
  "shadow-sm hover:shadow-[0_0_12px_rgba(0,231,255,0.3)] hover:border-[#00E7FF]/50",
  "hover:bg-[#00E7FF]/5 transition-all duration-200",
  onClick && "cursor-pointer"
)}>
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="h-3.5 w-3.5 text-[#7A2BFF] shrink-0" />
      <span className="text-[10px] font-semibold text-[#7A2BFF] uppercase tracking-wider truncate">
        {label}
      </span>
    </div>
    <span className="text-sm font-bold text-[#00E7FF] whitespace-nowrap shrink-0 ml-1">
      {loading ? "..." : <CounterAnimation value={value} duration={800} compact />}
    </span>
  </motion.div>;
interface HonorBoardCardProps {
  stats: HonobarStats;
  loading: boolean;
  className?: string;
}
export const HonorBoardCard = ({
  stats,
  loading,
  className
}: HonorBoardCardProps) => {
  const navigate = useNavigate();
  const statItems = [{
    icon: Users,
    label: "TOTAL USERS",
    value: stats.totalUsers,
    onClick: () => navigate("/users")
  }, {
    icon: FileText,
    label: "TOTAL POSTS",
    value: stats.totalPosts,
    onClick: () => navigate("/")
  }, {
    icon: Image,
    label: "TOTAL PHOTOS",
    value: stats.totalPhotos,
    onClick: () => navigate("/")
  }, {
    icon: Video,
    label: "TOTAL VIDEOS",
    value: stats.totalVideos,
    onClick: () => navigate("/")
  }, {
    icon: Coins,
    label: "TOTAL REWARD",
    value: stats.totalRewards,
    onClick: () => navigate("/transactions")
  }];
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5,
    type: "spring"
  }} className={cn("relative p-3 rounded-2xl", "bg-white/85 backdrop-blur-xl", "border-2 border-transparent", "shadow-[0_0_30px_rgba(0,231,255,0.3)]", "hover:shadow-[0_0_50px_rgba(122,43,255,0.5)]", "transition-all duration-500", className)} style={{
    background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5) border-box"
  }}>
      {/* Shimmer effect on hover */}
      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 opacity-0 hover:opacity-100" animate={{
      x: ["-200%", "200%"]
    }} transition={{
      duration: 3,
      repeat: Infinity,
      ease: "linear"
    }} />

      {/* Header with Crown and Title */}
      <div className="relative flex items-center justify-center gap-1.5 mb-3">
        <motion.div animate={{
        rotate: [-5, 5, -5]
      }} transition={{
        duration: 2,
        repeat: Infinity
      }}>
          <Crown className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
        </motion.div>
        <h2 className="text-lg font-black italic bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
          HONOR BOARD
        </h2>
        <motion.div animate={{
        rotate: [5, -5, 5]
      }} transition={{
        duration: 2,
        repeat: Infinity
      }}>
          <Crown className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
        </motion.div>
      </div>

      {/* Stats Pills */}
      <div className="relative space-y-2">
        {statItems.map((stat, index) => <StatPill key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} loading={loading} index={index} onClick={stat.onClick} />)}
      </div>

      {/* Realtime indicator */}
      
    </motion.div>;
};