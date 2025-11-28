import { useState, useEffect } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, Medal, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { useNavigate } from "react-router-dom";

interface LeaderboardUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_camly_rewards: number;
}

export default function Leaderboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, total_camly_rewards")
        .order("total_camly_rewards", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTopUsers(data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="relative">
          <Crown className="w-8 h-8 text-yellow-400 animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
          <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-spin" />
        </div>
      );
    }
    if (rank === 2) {
      return <Medal className="w-7 h-7 text-gray-300 drop-shadow-[0_0_8px_rgba(192,192,192,0.8)]" />;
    }
    if (rank === 3) {
      return <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(205,127,50,0.8)]" />;
    }
    return (
      <div className="w-8 h-8 flex items-center justify-center">
        <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
      </div>
    );
  };

  const getRankGradient = (rank: number) => {
    if (rank === 1) return "from-yellow-400 via-yellow-300 to-yellow-500";
    if (rank === 2) return "from-gray-300 via-gray-200 to-gray-400";
    if (rank === 3) return "from-amber-600 via-amber-500 to-amber-700";
    return "from-blue-400 to-cyan-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Đang tải bảng xếp hạng...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-12 h-12 text-yellow-400 animate-pulse drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Bảng Xếp Hạng
              </h1>
              <Trophy className="w-12 h-12 text-yellow-400 animate-pulse drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
            </div>
            <p className="text-muted-foreground text-lg">
              Top 10 người dùng có tổng CAMLY Rewards cao nhất
            </p>
          </motion.div>

          {/* Leaderboard */}
          <div className="space-y-4">
            {topUsers.map((user, index) => {
              const rank = index + 1;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/@${user.username}`)}
                  className="cursor-pointer group"
                >
                  <div
                    className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] backdrop-blur-sm border-2 p-4 transition-all duration-300 hover:shadow-[0_0_30px_rgba(100,200,255,0.5)] ${
                      rank <= 3
                        ? "border-yellow-500/60 hover:border-yellow-400"
                        : "border-gray-600/40 hover:border-gray-500/60"
                    }`}
                  >
                    {/* Sparkle effect for top 3 */}
                    {rank <= 3 && (
                      <div className="absolute inset-0 pointer-events-none">
                        <Sparkles className="absolute top-2 right-2 w-5 h-5 text-yellow-300 animate-pulse" />
                        <Sparkles className="absolute bottom-2 left-2 w-4 h-4 text-yellow-300 animate-pulse delay-75" />
                        <Sparkles className="absolute top-1/2 right-1/4 w-3 h-3 text-yellow-300 animate-pulse delay-150" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 relative z-10">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">{getRankBadge(rank)}</div>

                      {/* Avatar */}
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-foreground font-semibold text-lg transition-all duration-300 group-hover:scale-110 ${
                          rank <= 3
                            ? `bg-gradient-to-br ${getRankGradient(rank)} shadow-lg`
                            : "bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta"
                        }`}
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.display_name || user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (user.display_name || user.username)[0].toUpperCase()
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate group-hover:text-cosmic-cyan transition-colors">
                          {user.display_name || user.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>

                      {/* Rewards */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-muted-foreground mb-1">Tổng Rewards</div>
                        <div
                          className={`text-2xl font-bold bg-gradient-to-br ${getRankGradient(
                            rank
                          )} bg-clip-text text-transparent tabular-nums`}
                        >
                          <CounterAnimation value={user.total_camly_rewards} decimals={3} />
                          <span className="text-sm ml-1">CAMLY</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {topUsers.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              Chưa có dữ liệu bảng xếp hạng
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
