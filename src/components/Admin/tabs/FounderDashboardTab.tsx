import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Sun,
  Coins,
  Users,
  Shield,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useFounderDashboard } from "@/hooks/useFounderDashboard";

const TRUST_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

function CollapsiblePanel({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
  badge,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{title}</CardTitle>
                {badge !== undefined && (
                  <Badge variant="secondary" className="ml-2">{badge}</Badge>
                )}
              </div>
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function KPICard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="bg-muted/30 border-border/30">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function FounderDashboardTab() {
  const { founderStats, adminStats, funMoneyStats, transparencyStats, loading, refetch } = useFounderDashboard();

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const platform = adminStats.platformStats;
  const funStats = funMoneyStats.stats;
  const transStats = transparencyStats.data;
  const fs = founderStats;

  // Pillar radar data
  const pillarData = fs?.pillar_averages
    ? [
        { pillar: "Transparent Truth", value: fs.pillar_averages.transparent_truth },
        { pillar: "Unity", value: fs.pillar_averages.unity_over_separation },
        { pillar: "Long-term Value", value: fs.pillar_averages.long_term_value },
        { pillar: "Serving Life", value: fs.pillar_averages.serving_life },
        { pillar: "Healing Love", value: fs.pillar_averages.healing_love },
      ]
    : [];

  // Trust distribution pie data
  const trustData = (fs?.trust_distribution || []).map((b) => ({
    name: `Level ${b.trust_level}`,
    value: b.count,
    fill: TRUST_COLORS[b.trust_level] || "#666",
  }));

  // Daily mint trend (from funMoneyStats)
  const dailyMints = funStats?.dailyMints || [];

  return (
    <div className="space-y-4">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </Button>
      </div>

      {/* Panel 1: Overview */}
      <CollapsiblePanel title="Tổng Quan" icon={Sun}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Total Light Score" value={transStats?.total_light || 0} icon={Sun} />
          <KPICard label="FUN Minted" value={transStats?.total_fun_minted || 0} icon={Coins} />
          <KPICard label="Active Users" value={platform?.activeUsersToday || 0} icon={Users} />
          <KPICard label="Total Users" value={platform?.totalUsers || 0} icon={Users} />
        </div>
      </CollapsiblePanel>

      {/* Panel 2: User Insights */}
      <CollapsiblePanel title="User Insights" icon={Users} defaultOpen={false}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trust Distribution */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Trust Level Distribution</h4>
            {trustData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={trustData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {trustData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Chưa có dữ liệu</p>
            )}
          </div>

          {/* Top Light Score Users */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Top Light Score</h4>
            <div className="space-y-2 max-h-60 overflow-auto">
              {(fs?.top_light_users || []).map((u, i) => (
                <div key={u.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={u.avatar_url || ""} />
                    <AvatarFallback>{(u.display_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1 truncate">{u.display_name || "Unnamed"}</span>
                  <Badge variant="outline" className="text-xs">{u.total_light_score.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Streak Leaders */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-3">🔥 Streak Leaders</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(fs?.streak_leaders || []).map((u) => (
              <div key={u.user_id} className="text-center p-2 rounded-lg bg-muted/20">
                <Avatar className="h-8 w-8 mx-auto mb-1">
                  <AvatarImage src={u.avatar_url || ""} />
                  <AvatarFallback>{(u.display_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <p className="text-xs truncate">{u.display_name || "Unnamed"}</p>
                <p className="text-sm font-bold text-primary">{u.consistency_days} ngày</p>
              </div>
            ))}
          </div>
        </div>
      </CollapsiblePanel>

      {/* Panel 3: PPLP Analytics */}
      <CollapsiblePanel title="PPLP Analytics" icon={Sparkles} defaultOpen={false}>
        {pillarData.length > 0 ? (
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={pillarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="pillar" className="text-xs" />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar name="Avg Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-muted-foreground">Chưa có dữ liệu PPLP validations</p>
        )}
        {pillarData.length > 0 && (
          <div className="grid grid-cols-5 gap-2 mt-4">
            {pillarData.map((p) => (
              <div key={p.pillar} className="text-center p-2 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground truncate">{p.pillar}</p>
                <p className="text-lg font-bold">{p.value}</p>
              </div>
            ))}
          </div>
        )}
      </CollapsiblePanel>

      {/* Panel 4: Anti-Fake Monitor */}
      <CollapsiblePanel title="Anti-Fake Monitor" icon={Shield} defaultOpen={false} badge={fs?.flagged_user_count || 0}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold">{fs?.flagged_user_count || 0}</p>
              <p className="text-xs text-muted-foreground">Flagged Users (score &gt; 50)</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{platform?.totalUsers || 0}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {platform?.totalUsers ? (((fs?.flagged_user_count || 0) / platform.totalUsers) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Flag Rate</p>
            </CardContent>
          </Card>
        </div>
      </CollapsiblePanel>

      {/* Panel 5: Event & Love House */}
      <CollapsiblePanel title="Event & Love House" icon={Calendar} defaultOpen={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Total Events" value={fs?.event_stats?.total_events || 0} icon={Calendar} />
          <KPICard label="Total Attendance" value={fs?.event_stats?.total_attendance || 0} icon={Users} />
          <KPICard label="Confirmed" value={fs?.event_stats?.confirmed_attendance || 0} icon={Shield} />
          <KPICard label="Avg Participation" value={`${fs?.event_stats?.avg_participation_factor || 0}`} icon={TrendingUp} />
        </div>
      </CollapsiblePanel>

      {/* Panel 6: Economy Flow */}
      <CollapsiblePanel title="Economy Flow" icon={TrendingUp} defaultOpen={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KPICard label="Total FUN Minted" value={funStats?.totalMinted || 0} icon={Coins} />
          <KPICard label="Total Potential" value={funStats?.totalPotential || 0} icon={Coins} />
          <KPICard label="Active Minters" value={funStats?.activeUserCount || 0} icon={Users} />
          <KPICard label="Total Requests" value={funStats?.requestCount || 0} icon={TrendingUp} />
        </div>

        {dailyMints.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Mint Trend (30 ngày)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyMints}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total_fun" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CollapsiblePanel>

      {/* Panel 7: Real-Time Alerts */}
      <CollapsiblePanel title="Cảnh Báo Hệ Thống" icon={AlertTriangle} defaultOpen={false}>
        <div className="space-y-2">
          {(fs?.flagged_user_count || 0) > 10 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium">Nhiều user bị flag</p>
                <p className="text-xs text-muted-foreground">{fs?.flagged_user_count} users có suspicious score &gt; 50</p>
              </div>
            </div>
          )}
          {(platform?.activeUsersToday || 0) === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Không có active user hôm nay</p>
                <p className="text-xs text-muted-foreground">Kiểm tra hệ thống tracking</p>
              </div>
            </div>
          )}
          {(fs?.flagged_user_count || 0) <= 10 && (platform?.activeUsersToday || 0) > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <Shield className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Hệ thống hoạt động bình thường</p>
                <p className="text-xs text-muted-foreground">Không có cảnh báo đáng chú ý</p>
              </div>
            </div>
          )}
        </div>
      </CollapsiblePanel>
    </div>
  );
}
