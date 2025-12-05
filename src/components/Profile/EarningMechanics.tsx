import { motion } from "framer-motion";
import { Upload, Eye, MessageSquare, Users, Coins, TrendingUp } from "lucide-react";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";

interface EarningMechanicsProps {
  uploadRewards: number;
  viewRewards: number;
  commentRewards: number;
  referralRewards: number;
  referralCount: number;
}

export const EarningMechanics = ({
  uploadRewards,
  viewRewards,
  commentRewards,
  referralRewards,
  referralCount,
}: EarningMechanicsProps) => {
  const earnings = [
    {
      icon: Upload,
      title: "Upload Video",
      description: "+100,000 CAMLY when video reaches 3+ views",
      earned: uploadRewards,
      color: "from-violet-500 to-purple-600",
      glow: "#8b5cf6",
    },
    {
      icon: Eye,
      title: "Video Views",
      description: "+50,000 CAMLY per 10 real views",
      earned: viewRewards,
      color: "from-cyan-500 to-blue-600",
      glow: "#06b6d4",
    },
    {
      icon: MessageSquare,
      title: "Comments Received",
      description: "+5,000 CAMLY per comment on your videos",
      earned: commentRewards,
      color: "from-green-500 to-emerald-600",
      glow: "#22c55e",
    },
    {
      icon: Users,
      title: "Referral Income",
      description: `${referralCount} referrals • 5% lifetime earnings from each`,
      earned: referralRewards,
      color: "from-pink-500 to-rose-600",
      glow: "#ec4899",
      isReferral: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent">
        Earning Breakdown
      </h3>

      <div className="grid gap-3">
        {earnings.map((earning, index) => (
          <motion.div
            key={earning.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            className="relative overflow-hidden rounded-xl p-4 backdrop-blur-xl border border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            }}
          >
            {/* Glow on left */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ background: `linear-gradient(to bottom, ${earning.glow}, transparent)` }}
            />

            <div className="flex items-center gap-4">
              {/* Icon */}
              <motion.div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${earning.color} flex items-center justify-center flex-shrink-0`}
                whileHover={{
                  boxShadow: `0 0 25px ${earning.glow}`,
                  scale: 1.1,
                }}
              >
                <earning.icon className="w-6 h-6 text-white" />
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground">{earning.title}</div>
                <div className="text-xs text-muted-foreground truncate">{earning.description}</div>
              </div>

              {/* Earned amount */}
              <div className="text-right">
                <motion.div
                  className="text-lg font-black text-[hsl(var(--cosmic-gold))]"
                  animate={earning.earned > 0 ? {
                    textShadow: [
                      '0 0 5px rgba(255,215,0,0.3)',
                      '0 0 15px rgba(255,215,0,0.5)',
                      '0 0 5px rgba(255,215,0,0.3)',
                    ],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  +<CounterAnimation value={earning.earned} duration={1000} />
                </motion.div>
                <div className="text-xs text-muted-foreground">CAMLY</div>
              </div>
            </div>

            {/* Referral badge */}
            {earning.isReferral && referralCount > 0 && (
              <motion.div
                className="absolute top-2 right-2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="px-2 py-1 rounded-full bg-[hsl(var(--cosmic-magenta)/0.2)] border border-[hsl(var(--cosmic-magenta)/0.5)] text-xs font-bold text-[hsl(var(--cosmic-magenta))]">
                  5% LIFETIME
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Total summary */}
      <motion.div
        className="p-4 rounded-xl bg-gradient-to-r from-[hsl(var(--cosmic-gold)/0.1)] to-[hsl(var(--cosmic-cyan)/0.1)] border border-[hsl(var(--cosmic-gold)/0.3)]"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[hsl(var(--cosmic-gold))]" />
            <span className="font-bold text-foreground">Total Earnings</span>
          </div>
          <motion.div
            className="text-2xl font-black text-[hsl(var(--cosmic-gold))]"
            animate={{
              textShadow: [
                '0 0 10px rgba(255,215,0,0.5)',
                '0 0 20px rgba(255,215,0,0.7)',
                '0 0 10px rgba(255,215,0,0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CounterAnimation 
              value={uploadRewards + viewRewards + commentRewards + referralRewards} 
              duration={1500} 
            /> CAMLY
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
