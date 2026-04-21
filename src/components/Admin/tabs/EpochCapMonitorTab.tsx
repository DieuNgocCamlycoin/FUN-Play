import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RefreshCw, TrendingUp, Users, Activity, Shield } from "lucide-react";

const PER_USER_DAILY_REQUESTS = 12; // hardcoded in pplp-mint-fun
const ON_CHAIN_DAILY_PER_ACTION = 1_000_000; // 1M FUN per registered action

interface ConfigRow {
  config_key: string;
  config_value: number;
  description: string | null;
  updated_at: string;
}

interface MintRequestRow {
  id: string;
  user_id: string;
  action_type: string;
  status: string;
  calculated_amount_atomic: string | null;
  calculated_amount_formatted: string | null;
  decision_reason: string | null;
  tx_hash: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface AuditRow {
  id: string;
  action_type: string;
  status: string;
  parameters: any;
  created_at: string;
  executed_at: string | null;
}

function formatNumber(n: number) {
  return n.toLocaleString("vi-VN");
}

function shortId(id: string) {
  return id.slice(0, 8);
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Approved", variant: "default" },
  minted: { label: "Minted", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  rejected: { label: "Rejected", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
};

export function EpochCapMonitorTab() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [recentRequests, setRecentRequests] = useState<MintRequestRow[]>([]);
  const [auditLog, setAuditLog] = useState<AuditRow[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [topUsersToday, setTopUsersToday] = useState<Array<{ user_id: string; count: number }>>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Configs
      const { data: cfg } = await (supabase as any)
        .from("epoch_config")
        .select("config_key, config_value, description, updated_at")
        .in("config_key", ["max_epoch_mint_policy"]);
      setConfigs((cfg || []) as ConfigRow[]);

      // 2. Recent mint requests (last 50)
      const { data: reqs } = await (supabase as any)
        .from("mint_requests")
        .select("id, user_id, action_type, status, calculated_amount_atomic, calculated_amount_formatted, decision_reason, tx_hash, created_at, reviewed_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setRecentRequests((reqs || []) as MintRequestRow[]);

      // 3. Audit log — cap changes
      const { data: audit } = await (supabase as any)
        .from("governance_actions")
        .select("id, action_type, status, parameters, created_at, executed_at")
        .like("action_type", "epoch.%")
        .order("created_at", { ascending: false })
        .limit(20);
      setAuditLog((audit || []) as AuditRow[]);

      // 4. Monthly stats — sum of approved+minted in current month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data: monthData } = await (supabase as any)
        .from("mint_requests")
        .select("calculated_amount_atomic, status")
        .in("status", ["approved", "minted"])
        .gte("created_at", monthStart.toISOString());
      const monthRows = (monthData || []) as Array<{ calculated_amount_atomic: string | null; status: string }>;
      const totalAtomic = monthRows.reduce((acc, r) => {
        if (!r.calculated_amount_atomic) return acc;
        try { return acc + Number(BigInt(r.calculated_amount_atomic) / BigInt(10 ** 12)) / 1e6; } catch { return acc; }
      }, 0);
      setMonthlyTotal(totalAtomic);
      setMonthlyCount(monthRows.length);

      // 5. Today stats — by user
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayData } = await (supabase as any)
        .from("mint_requests")
        .select("user_id")
        .gte("created_at", todayStart.toISOString());
      const todayRows = (todayData || []) as Array<{ user_id: string }>;
      setTodayCount(todayRows.length);
      const counts = new Map<string, number>();
      todayRows.forEach((r) => counts.set(r.user_id, (counts.get(r.user_id) || 0) + 1));
      const top = Array.from(counts.entries())
        .map(([user_id, count]) => ({ user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopUsersToday(top);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const monthlyCap = configs.find((c) => c.config_key === "max_epoch_mint_policy")?.config_value ?? 50_000_000;
  const monthlyPct = Math.min(100, (monthlyTotal / monthlyCap) * 100);

  if (loading && configs.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Monthly Epoch Cap</span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatNumber(monthlyCap)} <span className="text-sm text-muted-foreground">FUN</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used: {formatNumber(Math.round(monthlyTotal))} FUN</span>
              <span>{monthlyPct.toFixed(2)}%</span>
            </div>
            <Progress value={monthlyPct} className="h-2" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Per-User Daily Cap</span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {PER_USER_DAILY_REQUESTS} <span className="text-sm text-muted-foreground">requests/day</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Áp dụng per platform (fun_play / fun_angel / fun_main).
            Hardcoded trong <code className="text-[10px]">pplp-mint-fun</code>.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">On-chain Trần (per action)</span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatNumber(ON_CHAIN_DAILY_PER_ACTION)} <span className="text-sm text-muted-foreground">FUN/day</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Contract <code className="text-[10px]">0x39A1b047…</code> = ERC20 cơ bản, không có per-action cap on-chain. Cap thực thi off-chain.
          </p>
        </Card>
      </div>

      {/* Today activity */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Hoạt động hôm nay</h3>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Tổng request hôm nay</div>
            <div className="text-2xl font-bold">{formatNumber(todayCount)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Tháng này: {formatNumber(monthlyCount)} requests
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-2">Top 5 user (by request count today)</div>
            {topUsersToday.length === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa có request hôm nay.</p>
            ) : (
              <div className="space-y-1">
                {topUsersToday.map((u) => {
                  const pct = (u.count / PER_USER_DAILY_REQUESTS) * 100;
                  const overCap = u.count >= PER_USER_DAILY_REQUESTS;
                  return (
                    <div key={u.user_id} className="flex items-center gap-2 text-xs">
                      <code className="text-muted-foreground">{shortId(u.user_id)}</code>
                      <Progress value={Math.min(100, pct)} className="h-1.5 flex-1" />
                      <span className={overCap ? "text-destructive font-semibold" : "text-foreground"}>
                        {u.count}/{PER_USER_DAILY_REQUESTS}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Audit log */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4">Cap Change Audit Log</h3>
        {auditLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có thay đổi cap nào được ghi.</p>
        ) : (
          <div className="space-y-2">
            {auditLog.map((row) => {
              const p = row.parameters || {};
              return (
                <div key={row.id} className="border border-border/50 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{row.action_type}</Badge>
                      <Badge variant={row.status === "executed" ? "default" : "secondary"}>{row.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(row.executed_at || row.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  {p.config_key && (
                    <div className="text-xs text-muted-foreground">
                      <code>{p.config_key}</code>: {formatNumber(Number(p.before))} → <strong className="text-foreground">{formatNumber(Number(p.after))}</strong>
                    </div>
                  )}
                  {p.reason && (
                    <p className="text-xs text-muted-foreground mt-1">{p.reason}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent mint requests */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="text-lg font-semibold">Live Mint Requests (50 gần nhất)</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Verify status, amount và lý do reject. Sort theo thời gian giảm dần.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount (FUN)</TableHead>
              <TableHead>Reason / Tx</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentRequests.map((r) => {
              const badge = STATUS_BADGE[r.status] ?? { label: r.status, variant: "outline" as const };
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-xs">
                    <code>{shortId(r.user_id)}</code>
                  </TableCell>
                  <TableCell className="text-xs">{r.action_type}</TableCell>
                  <TableCell>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {r.calculated_amount_formatted || "—"}
                  </TableCell>
                  <TableCell className="text-xs max-w-[280px] truncate text-muted-foreground">
                    {r.tx_hash ? (
                      <a
                        href={`https://testnet.bscscan.com/tx/${r.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {r.tx_hash.slice(0, 14)}…
                      </a>
                    ) : (
                      r.decision_reason || "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {recentRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Chưa có mint request nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
