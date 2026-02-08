import { useState, useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Users, Copy, CheckCircle2, Gift, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface ReferralStats { totalReferrals: number; totalEarned: number; activeReferrals: number; }

export default function Referral() {
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, totalEarned: 0, activeReferrals: 0 });
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const referralCode = user?.id.slice(0, 8) || "";
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  useEffect(() => { if (user) setStats({ totalReferrals: 0, totalEarned: 0, activeReferrals: 0 }); }, [user]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Đã sao chép!", description: "Link giới thiệu đã được sao chép vào clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="w-12 h-12 text-yellow-400 animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">Giới Thiệu Bạn Bè</h1>
            <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg">Mời bạn bè tham gia và nhận CAMLY rewards khi họ hoạt động</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, value: stats.totalReferrals, label: "Tổng người giới thiệu", color: "text-cyan-400", border: "border-cyan-500/50" },
            { icon: Gift, value: stats.totalEarned.toFixed(3), label: "CAMLY đã nhận", color: "text-yellow-400", border: "border-yellow-500/60" },
            { icon: CheckCircle2, value: stats.activeReferrals, label: "Đang hoạt động", color: "text-green-400", border: "border-green-500/50" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * (i + 1) }}
              className={`bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-2 ${item.border} rounded-xl p-6 text-center shadow-[0_0_20px_rgba(0,231,255,0.3)]`}>
              <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
              <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-sm text-gray-400 mt-1">{item.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-2 border-cyan-400/50 rounded-xl p-6 mb-8 shadow-[0_0_20px_rgba(0,231,255,0.3)]">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><Users className="w-6 h-6 text-cyan-400" />Link Giới Thiệu Của Bạn</h2>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-cyan-500/10 border-cyan-400/50 text-foreground" />
            <Button onClick={copyReferralLink} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">Mã giới thiệu: <span className="font-mono text-cyan-400">{referralCode}</span></p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-2 border-cyan-400/50 rounded-xl p-6 shadow-[0_0_20px_rgba(0,231,255,0.3)]">
          <h2 className="text-xl font-bold text-foreground mb-4">Cách Thức Hoạt Động</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Chia sẻ link", desc: "Gửi link giới thiệu cho bạn bè qua mạng xã hội" },
              { step: "2", title: "Bạn bè đăng ký", desc: "Bạn nhận 10 CAMLY khi họ tạo tài khoản thành công" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold">{item.step}</div>
                <div><div className="font-semibold text-foreground">{item.title}</div><div className="text-sm text-muted-foreground">{item.desc}</div></div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
