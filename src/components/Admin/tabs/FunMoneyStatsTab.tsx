import { useAdminFunMoneyStats } from "@/hooks/useAdminFunMoneyStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Coins, Users, TrendingUp, FileText } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from "recharts";

const ACTION_COLORS: Record<string, string> = {
  UPLOAD: "hsl(262, 83%, 58%)",
  COMMENT: "hsl(172, 66%, 50%)",
  VIEW: "hsl(47, 100%, 50%)",
  LIKE: "hsl(340, 82%, 52%)",
  SHARE: "hsl(199, 89%, 48%)",
  SIGNUP: "hsl(120, 60%, 45%)",
  FIRST_UPLOAD: "hsl(280, 60%, 55%)",
  WALLET_CONNECT: "hsl(30, 90%, 50%)",
  BOUNTY: "hsl(60, 80%, 45%)",
  OTHER: "hsl(0, 0%, 60%)",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(47, 100%, 50%)",
  approved: "hsl(142, 76%, 36%)",
  minted: "hsl(262, 83%, 58%)",
  rejected: "hsl(0, 84%, 60%)",
  failed: "hsl(0, 0%, 45%)",
};

const ACTION_LABELS: Record<string, string> = {
  UPLOAD: "Upload (×100)",
  COMMENT: "Comment (×15)",
  VIEW: "View (×10)",
  LIKE: "Like (×5)",
  SHARE: "Share (×20)",
  SIGNUP: "Signup (×10)",
  FIRST_UPLOAD: "First Upload (×10)",
  WALLET_CONNECT: "Wallet Connect (×5)",
  BOUNTY: "Bounty",
};

export function FunMoneyStatsTab() {
  const { stats, loading, refetch } = useAdminFunMoneyStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!stats) return <p className="text-muted-foreground">Không thể tải dữ liệu.</p>;

  const mintRate = stats.totalPotential > 0
    ? ((stats.totalMinted / stats.totalPotential) * 100).toFixed(1)
    : "0";

  const barData = stats.actionBreakdown.map((a) => ({
    name: ACTION_LABELS[a.action] || a.action,
    "FUN Tiềm Năng": a.total_fun,
    action: a.action,
  }));

  const dailyData = stats.dailyMints.map((d) => ({
    date: d.date.slice(5),
    requests: d.request_count,
    fun: d.total_fun,
  }));

  return (
    <div className="space-y-6">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Coins} label="Tổng FUN Đã Mint" value={stats.totalMinted.toLocaleString()} color="text-primary" />
        <StatCard icon={TrendingUp} label="Tổng FUN Tiềm Năng" value={stats.totalPotential.toLocaleString()} sub={`${mintRate}% đã mint`} color="text-emerald-500" />
        <StatCard icon={Users} label="Users Đã Mint" value={stats.userCount.toString()} color="text-blue-500" />
        <StatCard icon={FileText} label="Mint Requests" value={stats.requestCount.toString()} color="text-amber-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: Action Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">FUN Tiềm Năng theo Action</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.actionBreakdown}
                  dataKey="total_fun"
                  nameKey="action"
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  label={({ action, percent }) => `${ACTION_LABELS[action] || action} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.actionBreakdown.map((a, i) => (
                    <Cell key={i} fill={ACTION_COLORS[a.action] || ACTION_COLORS.OTHER} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString() + " FUN"} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut: Status Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Mint Requests theo Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.statusBreakdown.map((s, i) => (
                    <Cell key={i} fill={STATUS_COLORS[s.status] || "hsl(0,0%,50%)"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart: FUN by action */}
      <Card>
        <CardHeader><CardTitle className="text-base">FUN Tiềm Năng theo Action Type</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => v.toLocaleString() + " FUN"} />
              <Legend />
              <Bar dataKey="FUN Tiềm Năng" radius={[4, 4, 0, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={ACTION_COLORS[d.action] || ACTION_COLORS.OTHER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Area Chart: Daily Mints */}
      <Card>
        <CardHeader><CardTitle className="text-base">Mint Requests 30 Ngày Gần Nhất</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="fun" name="FUN Minted" stroke="hsl(262, 83%, 58%)" fill="hsl(262, 83%, 58%)" fillOpacity={0.2} />
              <Area type="monotone" dataKey="requests" name="Requests" stroke="hsl(172, 66%, 50%)" fill="hsl(172, 66%, 50%)" fillOpacity={0.15} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Holders Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top 10 FUN Holders</CardTitle></CardHeader>
        <CardContent>
          {stats.topHolders.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa có dữ liệu.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">User</th>
                    <th className="pb-2 pr-4 text-right">Tổng FUN</th>
                    <th className="pb-2 pr-4 text-right">Requests</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topHolders.map((h, i) => (
                    <tr key={h.user_id} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">{i + 1}</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={h.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {(h.display_name || "?")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{h.display_name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-right font-bold text-primary">
                        {h.total_fun.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-right">{h.request_count}</td>
                      <td className="py-2">
                        <div className="flex gap-1 flex-wrap">
                          {h.action_types.map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
