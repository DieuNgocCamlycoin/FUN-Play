import { useState, useEffect } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Users, Copy, CheckCircle2, Gift, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface ReferralStats {
  totalReferrals: number;
  totalEarned: number;
  activeReferrals: number;
}

export default function Referral() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarned: 0,
    activeReferrals: 0,
  });
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const referralCode = user?.id.slice(0, 8) || "";
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  useEffect(() => {
    if (user) {
      fetchReferralStats();
    }
  }, [user]);

  const fetchReferralStats = async () => {
    // This would fetch from a referrals table
    // For now, showing placeholder data
    setStats({
      totalReferrals: 0,
      totalEarned: 0,
      activeReferrals: 0,
    });
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Đã sao chép!",
      description: "Link giới thiệu đã được sao chép vào clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

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
              <Gift className="w-12 h-12 text-yellow-400 animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Giới Thiệu Bạn Bè
              </h1>
              <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-muted-foreground text-lg">
              Mời bạn bè tham gia và nhận CAMLY rewards khi họ hoạt động
            </p>
          </motion.div>

          {/* Referral Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border-2 border-cyan-500/40 rounded-xl p-6 text-center"
            >
              <Users className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-cyan-400">{stats.totalReferrals}</div>
              <div className="text-sm text-gray-400 mt-1">Tổng người giới thiệu</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border-2 border-yellow-500/60 rounded-xl p-6 text-center shadow-[0_0_30px_rgba(255,215,0,0.3)]"
            >
              <Gift className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-yellow-400">{stats.totalEarned.toFixed(3)}</div>
              <div className="text-sm text-gray-400 mt-1">CAMLY đã nhận</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border-2 border-green-500/40 rounded-xl p-6 text-center"
            >
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-400">{stats.activeReferrals}</div>
              <div className="text-sm text-gray-400 mt-1">Đang hoạt động</div>
            </motion.div>
          </div>

          {/* Referral Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border-2 border-gray-600/40 rounded-xl p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              Link Giới Thiệu Của Bạn
            </h2>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="bg-[#2a2a2a] border-gray-600 text-foreground"
              />
              <Button
                onClick={copyReferralLink}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Mã giới thiệu: <span className="font-mono text-cyan-400">{referralCode}</span>
            </p>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border-2 border-gray-600/40 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Cách Thức Hoạt Động</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold text-foreground">Chia sẻ link</div>
                  <div className="text-sm text-muted-foreground">
                    Gửi link giới thiệu cho bạn bè qua mạng xã hội
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold text-foreground">Bạn bè đăng ký</div>
                  <div className="text-sm text-muted-foreground">
                    Bạn nhận 10 CAMLY khi họ tạo tài khoản thành công
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold text-foreground">Nhận thưởng liên tục</div>
                  <div className="text-sm text-muted-foreground">
                    Nhận 5% CAMLY từ mọi hoạt động của người được giới thiệu
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
