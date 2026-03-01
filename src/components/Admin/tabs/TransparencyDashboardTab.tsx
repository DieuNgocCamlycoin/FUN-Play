import { useTransparencyStats } from "@/hooks/useTransparencyStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sun, Coins, Users, Link2, RefreshCw, ShieldCheck } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const LEVEL_COLORS: Record<string, string> = {
  seed: "#94a3b8",
  sprout: "#4ade80",
  builder: "#38bdf8",
  guardian: "#a78bfa",
  architect: "#f59e0b",
};

const LEVEL_LABELS: Record<string, string> = {
  seed: "Seed",
  sprout: "Sprout",
  builder: "Builder",
  guardian: "Guardian",
  architect: "Architect",
};

export function TransparencyDashboardTab() {
  const { data, loading, error, refetch } = useTransparencyStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[350px]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive mb-4">{error || "Không tải được dữ liệu"}</p>
        <Button variant="outline" onClick={refetch}>Thử lại</Button>
      </Card>
    );
  }

  const pieData = Object.entries(data.level_distribution_pct).map(([level, pct]) => ({
    name: LEVEL_LABELS[level] || level,
    value: pct,
    color: LEVEL_COLORS[level] || "#64748b",
  }));

  const statCards = [
    { label: "Tổng Light Score", value: data.total_light.toLocaleString(), icon: Sun, accent: "text-amber-500" },
    { label: "Tổng FUN Minted", value: data.total_fun_minted.toLocaleString(), icon: Coins, accent: "text-emerald-500" },
    { label: "Users có Light > 0", value: data.total_users_with_light.toLocaleString(), icon: Users, accent: "text-sky-500" },
    { label: "Sequences hoàn thành", value: data.total_sequences_completed.toLocaleString(), icon: Link2, accent: "text-violet-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-muted ${s.accent}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Level distribution chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Phân bổ Level toàn hệ</CardTitle>
            <CardDescription>Tỷ lệ % theo cấp độ — Không hiển thị cá nhân</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refetch}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={60}
                  paddingAngle={3}
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Active rule */}
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Scoring Rule đang áp dụng</p>
            <p className="font-semibold">{data.active_rule.name} — <span className="text-muted-foreground font-mono text-sm">{data.active_rule.rule_version}</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
