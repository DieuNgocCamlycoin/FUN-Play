import { useSystemReport } from "@/hooks/useSystemReport";
import { SCORING_RULES_V1 } from "@/lib/fun-money/scoring-config-v1";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, Sparkles, Coins, Calendar, ShieldCheck, ArrowRight,
  Clock, Zap, TrendingUp, Scale, Eye, BookOpen, Layers
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

const LEVEL_COLORS: Record<string, string> = {
  seed: "#94a3b8",
  sprout: "#22c55e",
  builder: "#3b82f6",
  guardian: "#a855f7",
  architect: "#f59e0b",
};

const LEVEL_LABELS: Record<string, string> = {
  seed: "🌱 Seed (0+)",
  sprout: "🌿 Sprout (50+)",
  builder: "🔨 Builder (200+)",
  guardian: "🛡️ Guardian (500+)",
  architect: "🏛️ Architect (1200+)",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  approved: "#22c55e",
  minted: "#3b82f6",
  rejected: "#ef4444",
};

export function SystemReportTab() {
  const { funMoney, transparency, epoch, platform, loading, refetch } = useSystemReport();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // --- Section 1: System Health ---
  const healthCards = [
    { label: "Tổng Users", value: platform?.totalUsers?.toLocaleString() ?? "—", icon: Users, color: "text-blue-500" },
    { label: "Tổng Light Score", value: transparency?.total_light?.toLocaleString() ?? "—", icon: Sparkles, color: "text-yellow-500" },
    { label: "Tổng FUN Minted", value: funMoney?.totalMinted?.toLocaleString() ?? transparency?.total_fun_minted?.toLocaleString() ?? "—", icon: Coins, color: "text-green-500" },
    { label: "Epoch hiện tại", value: epoch?.status === "draft" ? "Draft" : epoch?.status === "finalized" ? "Finalized" : epoch?.status ?? "—", icon: Calendar, color: "text-purple-500" },
    { label: "Rule Version", value: transparency?.active_rule?.rule_version ?? SCORING_RULES_V1.rule_version, icon: ShieldCheck, color: "text-primary" },
  ];

  // --- Section 3 data ---
  const levelData = transparency?.level_distribution_pct
    ? Object.entries(transparency.level_distribution_pct).map(([key, pct]) => ({
        name: LEVEL_LABELS[key] ?? key,
        value: Number(pct),
        color: LEVEL_COLORS[key] ?? "#888",
      }))
    : [];

  const actionData = funMoney?.actionBreakdown?.map((a) => ({
    name: a.action,
    count: a.action_count,
    fun: a.total_fun,
  })) ?? [];

  const statusData = funMoney?.statusBreakdown?.map((s) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#888",
  })) ?? [];

  return (
    <div className="space-y-8">
      {/* Section 1: System Health Overview */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Tổng Quan Hệ Thống
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {healthCards.map((c) => (
            <Card key={c.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                </div>
                <p className="text-2xl font-black">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 2: Pipeline Status */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> PPLP Scoring Pipeline
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Pipeline steps */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quy Trình Tự Động (Cron)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Badge variant="outline">02:00</Badge> Build Features (hàng ngày)</div>
              <div className="flex items-center gap-2"><Badge variant="outline">02:30</Badge> Detect Sequences (hàng ngày)</div>
              <div className="flex items-center gap-2"><Badge variant="outline">4h</Badge> Tính Light Score (mỗi 4 giờ)</div>
              <div className="flex items-center gap-2"><Badge variant="outline">T2 03:00</Badge> Chốt Mint Epoch (hàng tuần)</div>
            </CardContent>
          </Card>

          {/* Epoch info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Epoch Hiện Tại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {epoch ? (
                <>
                  <p><span className="text-muted-foreground">Kỳ:</span> {new Date(epoch.period_start).toLocaleDateString("vi-VN")} → {new Date(epoch.period_end).toLocaleDateString("vi-VN")}</p>
                  <p><span className="text-muted-foreground">Status:</span> <Badge variant={epoch.status === "finalized" ? "default" : "secondary"}>{epoch.status}</Badge></p>
                  <p><span className="text-muted-foreground">Pool:</span> {epoch.mint_pool_amount?.toLocaleString()} FUN</p>
                </>
              ) : <p className="text-muted-foreground">Chưa có epoch</p>}
            </CardContent>
          </Card>

          {/* Anti-whale */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Chính Sách Bảo Vệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-yellow-500" /> Anti-Whale Cap: <strong>{SCORING_RULES_V1.mint.anti_whale_cap * 100}%</strong> / epoch</div>
              <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-blue-500" /> Min Light Threshold: <strong>{SCORING_RULES_V1.mint.min_light_threshold}</strong></div>
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> No-Ego Policy: Ẩn điểm thô</div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline diagram */}
        <Card className="mt-4">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2 flex-wrap text-sm font-medium">
              {["pplp_events", "features_user_day", "Light Score", "Mint Allocation"].map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1">{step}</Badge>
                  {i < 3 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 3: Charts */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Biểu Đồ & Phân Bổ
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Level distribution */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Phân Bổ Level</CardTitle></CardHeader>
            <CardContent>
              {levelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={levelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}%`}>
                      {levelData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground text-sm py-8 text-center">Chưa có dữ liệu</p>}
            </CardContent>
          </Card>

          {/* Action breakdown */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Breakdown theo Action</CardTitle></CardHeader>
            <CardContent>
              {actionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={actionData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="fun" fill="hsl(var(--primary))" name="FUN" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground text-sm py-8 text-center">Chưa có dữ liệu</p>}
            </CardContent>
          </Card>

          {/* Status donut */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Mint Requests theo Status</CardTitle></CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                      {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground text-sm py-8 text-center">Chưa có dữ liệu</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 4: Educational Cards */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Giải Thích Hệ Thống
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Light Score là gì?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>Light Score đo lường <strong>mức đóng góp thực sự</strong> của mỗi người dùng trong hệ sinh thái FUN Play.</p>
              <p>Công thức: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">LS = (40% Action + 60% Content) × Consistency × Sequence × Integrity × Reputation</code></p>
              <p>Điểm được tính theo chu kỳ tháng (epoch), không tích lũy vĩnh viễn — khuyến khích đóng góp liên tục.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4" /> 5 Cấp Độ</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              {Object.entries(SCORING_RULES_V1.levels).map(([key, threshold]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LEVEL_COLORS[key] }} />
                  <span className="capitalize font-medium">{key}</span>
                  <span className="text-muted-foreground">≥ {threshold} điểm</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Hệ Số Nhân (Multipliers)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p><strong>Consistency (β={SCORING_RULES_V1.consistency.beta}, λ={SCORING_RULES_V1.consistency.lambda}):</strong> Hoạt động đều đặn hàng ngày → tăng tới ~60% điểm.</p>
              <p><strong>Sequence (η={SCORING_RULES_V1.sequence.eta}, κ={SCORING_RULES_V1.sequence.kappa}):</strong> Kết hợp nhiều loại hành động trong ngày → thưởng thêm tới ~50%.</p>
              <p><strong>Integrity (θ={SCORING_RULES_V1.penalty.theta}):</strong> Hành vi spam/gian lận → giảm tối đa {SCORING_RULES_V1.penalty.max_penalty * 100}% điểm.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Scale className="w-4 h-4" /> Anti-Whale & No-Ego</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p><strong>Anti-Whale ({SCORING_RULES_V1.mint.anti_whale_cap * 100}% cap):</strong> Không ai nhận quá 3% tổng pool mỗi epoch. Phần dư tái phân bổ cho cộng đồng.</p>
              <p><strong>No-Ego Policy:</strong> Không hiển thị điểm thô hay bảng xếp hạng cạnh tranh. Chỉ hiện Level và Xu hướng (Growing/Stable/Reflecting).</p>
              <p><strong>Mint không tức thì:</strong> FUN được mint theo chu kỳ epoch, không phải real-time, tránh gamification ngắn hạn.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
