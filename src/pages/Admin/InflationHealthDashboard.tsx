import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Heart,
  Lock,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HealthMetrics {
  metric_date: string;
  value_expansion_ratio: number;
  utility_absorption_ratio: number;
  retention_quality_ratio: number;
  fraud_pressure_ratio: number;
  locked_stability_ratio: number;
  supply_growth_rate: number;
  total_supply: number;
  circulating_supply: number;
  locked_supply: number;
  active_quality_users: number;
  safe_mode_triggered: boolean;
  details: any;
}

interface EpochMetric {
  epoch_id: string;
  base_expansion: number;
  contribution_expansion: number;
  ecosystem_expansion: number;
  final_mint: number;
  discipline_modulator: number;
  guardrail_flags: string[];
  computed_at: string;
}

interface VaultBalance {
  vault_name: string;
  balance: number;
}

export default function InflationHealthDashboard() {
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [epochs, setEpochs] = useState<EpochMetric[]>([]);
  const [vaults, setVaults] = useState<VaultBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [healthRes, epochsRes, vaultsRes] = await Promise.all([
        supabase
          .from("inflation_health_metrics")
          .select("*")
          .order("metric_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("epoch_metrics")
          .select("*")
          .order("computed_at", { ascending: false })
          .limit(10),
        supabase
          .from("treasury_vault_balances")
          .select("*")
          .order("vault_name"),
      ]);

      if (healthRes.data) setHealth(healthRes.data as unknown as HealthMetrics);
      if (epochsRes.data) setEpochs(epochsRes.data as unknown as EpochMetric[]);
      if (vaultsRes.data) setVaults(vaultsRes.data as unknown as VaultBalance[]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const ratioCard = (
    label: string,
    value: number,
    icon: any,
    threshold: { good: number; warn: number },
    invert = false
  ) => {
    const Icon = icon;
    const pct = Math.round(value * 100);
    let color = "text-green-400";
    if (invert) {
      if (value > threshold.warn) color = "text-red-400";
      else if (value > threshold.good) color = "text-yellow-400";
    } else {
      if (value < threshold.warn) color = "text-red-400";
      else if (value < threshold.good) color = "text-yellow-400";
    }

    return (
      <div className="p-3 rounded-lg bg-muted/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {label}
          </span>
          <span className={`text-sm font-bold ${color}`}>{pct}%</span>
        </div>
        <Progress value={Math.min(100, pct)} className="h-1.5" />
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Inflation Health Dashboard
      </h1>

      {/* Safe Mode Alert */}
      {health?.safe_mode_triggered && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <p className="font-bold text-red-400">⚠️ SAFE MODE RECOMMENDED</p>
              <p className="text-sm text-muted-foreground">Multiple critical thresholds breached. Consider reducing issuance.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Ratios */}
      {health && (
        <Card className="bg-card/50 backdrop-blur border-border/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Health Ratios — {health.metric_date}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ratioCard("Value Expansion", health.value_expansion_ratio, TrendingUp, { good: 0.7, warn: 0.5 })}
            {ratioCard("Utility Absorption", health.utility_absorption_ratio, Zap, { good: 0.5, warn: 0.3 })}
            {ratioCard("Retention Quality", health.retention_quality_ratio, Users, { good: 0.6, warn: 0.4 })}
            {ratioCard("Fraud Pressure", health.fraud_pressure_ratio, Shield, { good: 0.1, warn: 0.2 }, true)}
            {ratioCard("Locked Stability", health.locked_stability_ratio, Lock, { good: 0.6, warn: 0.4 })}
          </CardContent>
        </Card>
      )}

      {/* Supply Overview */}
      {health && (
        <Card className="bg-card/50 backdrop-blur border-border/30">
          <CardHeader>
            <CardTitle className="text-sm">Supply Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Total Supply</p>
              <p className="text-lg font-bold">{health.total_supply?.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <p className="text-xs text-muted-foreground">Circulating</p>
              <p className="text-lg font-bold text-green-400">{health.circulating_supply?.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10">
              <p className="text-xs text-muted-foreground">Locked</p>
              <p className="text-lg font-bold text-blue-400">{health.locked_supply?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treasury Vaults */}
      {vaults.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/30">
          <CardHeader>
            <CardTitle className="text-sm">Treasury Vaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vaults.map((v) => (
              <div key={v.vault_name} className="flex justify-between items-center p-2 rounded bg-muted/20">
                <span className="text-sm">{v.vault_name}</span>
                <span className="text-sm font-mono font-bold">{Math.round(v.balance).toLocaleString()} FUN</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Epochs */}
      {epochs.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/30">
          <CardHeader>
            <CardTitle className="text-sm">Recent Mint Epochs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {epochs.map((e) => (
              <div key={e.epoch_id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{e.epoch_id}</span>
                  <span className="text-sm font-bold">{Math.round(e.final_mint).toLocaleString()} FUN</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-green-400" />
                    Base: {Math.round(e.base_expansion).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-blue-400" />
                    Contrib: {Math.round(e.contribution_expansion).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-purple-400" />
                    Mod: {e.discipline_modulator?.toFixed(4)}
                  </div>
                </div>
                {e.guardrail_flags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {e.guardrail_flags.map((flag: string) => (
                      <Badge key={flag} variant="outline" className="text-[9px] text-yellow-400 border-yellow-500/30">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
