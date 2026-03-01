import { motion } from "framer-motion";
import { getLightLevelLabel, getLightLevelEmoji } from "@/lib/fun-money/pplp-engine";

const LIGHT_LEVELS = [
  {
    key: "seed",
    threshold: 0,
    description: "Bắt đầu hành trình ánh sáng. Mỗi hành động nhỏ đều tạo nên giá trị.",
    gradient: "from-emerald-400/30 to-emerald-600/20",
    border: "border-emerald-500/40",
    textColor: "text-emerald-700 dark:text-emerald-300",
    glow: "shadow-emerald-500/20",
    barColor: "bg-gradient-to-r from-emerald-400 to-emerald-500",
    iconBg: "bg-emerald-500/15",
  },
  {
    key: "sprout",
    threshold: 50,
    description: "Đã nảy mầm! Bạn đang đóng góp tích cực cho cộng đồng.",
    gradient: "from-cyan-400/30 to-blue-500/20",
    border: "border-cyan-500/40",
    textColor: "text-cyan-700 dark:text-cyan-300",
    glow: "shadow-cyan-500/20",
    barColor: "bg-gradient-to-r from-cyan-400 to-blue-500",
    iconBg: "bg-cyan-500/15",
  },
  {
    key: "builder",
    threshold: 200,
    description: "Người xây dựng! Bạn tạo ra giá trị bền vững cho hệ sinh thái.",
    gradient: "from-violet-400/30 to-purple-500/20",
    border: "border-violet-500/40",
    textColor: "text-violet-700 dark:text-violet-300",
    glow: "shadow-violet-500/20",
    barColor: "bg-gradient-to-r from-violet-400 to-purple-500",
    iconBg: "bg-violet-500/15",
  },
  {
    key: "guardian",
    threshold: 500,
    description: "Người bảo hộ! Bạn gìn giữ và lan tỏa giá trị cốt lõi.",
    gradient: "from-amber-400/30 to-orange-500/20",
    border: "border-amber-500/40",
    textColor: "text-amber-700 dark:text-amber-300",
    glow: "shadow-amber-500/20",
    barColor: "bg-gradient-to-r from-amber-400 to-orange-500",
    iconBg: "bg-amber-500/15",
  },
  {
    key: "architect",
    threshold: 1200,
    description: "Kiến trúc sư ánh sáng! Bạn là trụ cột của cộng đồng.",
    gradient: "from-yellow-300/30 to-amber-400/20",
    border: "border-yellow-500/50",
    textColor: "text-yellow-700 dark:text-yellow-300",
    glow: "shadow-yellow-500/20",
    barColor: "bg-gradient-to-r from-yellow-300 to-amber-400",
    iconBg: "bg-yellow-500/15",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
};

export const LightLevelGuide = () => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={containerVariants}
      className="mx-4 lg:mx-0 mb-6"
    >
      {/* Card container */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Holographic border */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-pink-500/60 via-cyan-400/60 to-purple-500/60 blur-[1px]" />

        <div className="relative rounded-2xl bg-background/80 dark:bg-background/60 backdrop-blur-xl backdrop-saturate-[1.8] p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-500/30">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Cấp Độ Ánh Sáng
              </h3>
              <p className="text-xs text-muted-foreground">
                Hành trình của bạn trong hệ sinh thái FUN
              </p>
            </div>
          </div>

          {/* Level rows */}
          <div className="space-y-2.5">
            {LIGHT_LEVELS.map((level, index) => {
              const emoji = getLightLevelEmoji(level.key);
              const label = getLightLevelLabel(level.key);
              const maxThreshold = LIGHT_LEVELS[LIGHT_LEVELS.length - 1].threshold;
              const progressWidth = Math.min(
                100,
                ((level.threshold || 1) / maxThreshold) * 100
              );

              return (
                <motion.div
                  key={level.key}
                  variants={rowVariants}
                  className={`group relative flex items-center gap-3 sm:gap-4 rounded-xl border ${level.border} bg-gradient-to-r ${level.gradient} p-3 sm:p-4 transition-all duration-300 hover:shadow-lg hover:${level.glow} hover:scale-[1.01]`}
                >
                  {/* Rank number */}
                  <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-foreground/5 text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </div>

                  {/* Emoji icon */}
                  <div
                    className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${level.iconBg} text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110`}
                  >
                    {emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold text-sm sm:text-base ${level.textColor}`}>
                        {label}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground">
                        {level.threshold}+ LS
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-1 sm:line-clamp-none">
                      {level.description}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-2 h-1 rounded-full bg-foreground/5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${level.barColor}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(8, progressWidth)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: index * 0.1 + 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="mt-4 text-[10px] sm:text-xs text-center text-muted-foreground/70">
            Light Score được tính tự động dựa trên hoạt động & đóng góp hàng tháng
          </p>
        </div>
      </div>
    </motion.div>
  );
};
