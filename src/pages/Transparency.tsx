import { useTransparencyStats } from "@/hooks/useTransparencyStats";
import { SCORING_RULES_V1 } from "@/lib/fun-money/scoring-config-v1";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sun, Coins, Users, Zap, Shield, Sprout, Hammer, Eye, Crown, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const LEVEL_COLORS: Record<string, string> = {
  seed: "#a3a3a3",
  sprout: "#4ade80",
  builder: "#60a5fa",
  guardian: "#a78bfa",
  architect: "#f59e0b",
};

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  seed: <Sprout className="w-4 h-4" />,
  sprout: <Sprout className="w-4 h-4 text-green-400" />,
  builder: <Hammer className="w-4 h-4 text-blue-400" />,
  guardian: <Shield className="w-4 h-4 text-violet-400" />,
  architect: <Crown className="w-4 h-4 text-amber-400" />,
};

const LEVEL_THRESHOLDS = SCORING_RULES_V1.levels;

export default function Transparency() {
  const { data, loading, error } = useTransparencyStats();
  const navigate = useNavigate();

  const levelData = data?.level_distribution_pct
    ? Object.entries(data.level_distribution_pct).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Number(value),
        color: LEVEL_COLORS[name] || "#888",
      }))
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">FUN Play Transparency</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Eye className="w-4 h-4" /> Minh bạch hoàn toàn
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Hệ sinh thái <span className="text-primary">FUN Play</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Mọi số liệu tổng hợp của hệ thống — không hiển thị thông tin cá nhân, không xếp hạng, không nuôi Ego.
          </p>
        </section>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="py-6 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Sun className="w-5 h-5 text-amber-500" />} label="Tổng Light Score" value={data?.total_light?.toLocaleString() ?? "—"} />
            <StatCard icon={<Coins className="w-5 h-5 text-emerald-500" />} label="FUN đã Mint" value={data?.total_fun_minted?.toLocaleString() ?? "—"} />
            <StatCard icon={<Users className="w-5 h-5 text-blue-500" />} label="Người dùng có Light" value={data?.total_users_with_light?.toLocaleString() ?? "—"} />
            <StatCard icon={<Zap className="w-5 h-5 text-violet-500" />} label="Sequence hoàn thành" value={data?.total_sequences_completed?.toLocaleString() ?? "—"} />
          </div>
        )}

        {/* Level Distribution */}
        {!loading && !error && levelData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Phân bổ cấp độ người dùng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={levelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}%`}>
                        {levelData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 w-full md:w-1/2">
                  {Object.entries(LEVEL_THRESHOLDS).map(([level, threshold]) => (
                    <div key={level} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: LEVEL_COLORS[level] }} />
                      {LEVEL_ICONS[level]}
                      <span className="font-medium capitalize">{level}</span>
                      <span className="text-muted-foreground ml-auto">≥ {threshold} Light</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scoring Rule */}
        {!loading && !error && data?.active_rule && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Info className="w-3.5 h-3.5" />
            Phiên bản quy tắc: <span className="font-mono font-semibold">{data.active_rule.rule_version}</span> — {data.active_rule.name}
          </div>
        )}

        {/* Educational Cards */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold">Hệ thống hoạt động như thế nào?</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <InfoCard title="Light Score là gì?" description="Điểm đánh giá đóng góp tổng thể dựa trên hành động thực (đăng video, bình luận, chia sẻ...). Điểm được tính tự động theo công thức toán học với các hệ số nhân Consistency, Sequence và Integrity." />
            <InfoCard title="5 Cấp độ" description={`Seed (0+) → Sprout (50+) → Builder (200+) → Guardian (500+) → Architect (1200+). Mỗi cấp phản ánh mức đóng góp bền vững, không phải cuộc đua.`} />
            <InfoCard title="Không nuôi Ego" description="FUN Play không hiển thị bảng xếp hạng cạnh tranh hay điểm số thô. Chỉ cấp độ và xu hướng cá nhân (Growing, Stable, Reflecting, Rebalancing) được công khai — để bạn tập trung vào phát triển bản thân." />
            <InfoCard title="Anti-Whale & Công bằng" description={`Mỗi người dùng tối đa nhận ${SCORING_RULES_V1.mint.anti_whale_cap * 100}% tổng pool mỗi chu kỳ mint. Ngưỡng tối thiểu ${SCORING_RULES_V1.mint.min_light_threshold} Light để được mint FUN — đảm bảo phân phối công bằng.`} />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-5 gap-2 text-center">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="py-5 space-y-1.5">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
