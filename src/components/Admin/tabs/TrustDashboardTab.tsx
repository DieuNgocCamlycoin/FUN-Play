import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Shield, Users, AlertTriangle, Award } from 'lucide-react';

interface Buckets {
  didLevels: Record<string, number>;
  trustTiers: Record<string, number>;
  sybilBins: { label: string; count: number }[];
  topSbts: { sbt_type: string; count: number }[];
  totals: { dids: number; profiles: number; activeSbts: number; attestations: number };
}

const empty: Buckets = {
  didLevels: {}, trustTiers: {}, sybilBins: [], topSbts: [],
  totals: { dids: 0, profiles: 0, activeSbts: 0, attestations: 0 },
};

const TIER_COLORS: Record<string, string> = {
  T0: 'bg-muted', T1: 'bg-blue-500/30', T2: 'bg-emerald-500/40', T3: 'bg-amber-500/50', T4: 'bg-violet-500/60',
};

export function TrustDashboardTab() {
  const [data, setData] = useState<Buckets>(empty);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [didLvl, tiers, sybil, sbts, attest] = await Promise.all([
      supabase.from('did_registry').select('level').limit(10000),
      supabase.from('trust_profile').select('tier, sybil_risk').limit(10000),
      supabase.from('trust_profile').select('sybil_risk').limit(10000),
      supabase.from('sbt_registry').select('sbt_type').eq('status', 'active').limit(10000),
      supabase.from('attestation_log').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    const didLevels: Record<string, number> = {};
    (didLvl.data as { level: string }[] ?? []).forEach(r => { didLevels[r.level] = (didLevels[r.level] ?? 0) + 1; });

    const trustTiers: Record<string, number> = {};
    (tiers.data as { tier: string }[] ?? []).forEach(r => { trustTiers[r.tier] = (trustTiers[r.tier] ?? 0) + 1; });

    const bins = [
      { label: '0-20', count: 0 }, { label: '21-40', count: 0 }, { label: '41-60', count: 0 },
      { label: '61-80', count: 0 }, { label: '81-100', count: 0 },
    ];
    (sybil.data as { sybil_risk: number }[] ?? []).forEach(r => {
      const v = r.sybil_risk ?? 0;
      const idx = Math.min(4, Math.floor(v / 20));
      bins[idx].count += 1;
    });

    const sbtCount: Record<string, number> = {};
    (sbts.data as { sbt_type: string }[] ?? []).forEach(r => { sbtCount[r.sbt_type] = (sbtCount[r.sbt_type] ?? 0) + 1; });
    const topSbts = Object.entries(sbtCount).map(([sbt_type, count]) => ({ sbt_type, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);

    setData({
      didLevels,
      trustTiers,
      sybilBins: bins,
      topSbts,
      totals: {
        dids: didLvl.data?.length ?? 0,
        profiles: tiers.data?.length ?? 0,
        activeSbts: sbts.data?.length ?? 0,
        attestations: attest.count ?? 0,
      },
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const maxBin = Math.max(1, ...data.sybilBins.map(b => b.count));
  const maxSbt = Math.max(1, ...data.topSbts.map(s => s.count));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trust Engine Dashboard</h2>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Shield className="h-4 w-4" />} label="Total DIDs" value={data.totals.dids} />
            <StatCard icon={<Users className="h-4 w-4" />} label="Trust profiles" value={data.totals.profiles} />
            <StatCard icon={<Award className="h-4 w-4" />} label="Active SBTs" value={data.totals.activeSbts} />
            <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Attestations" value={data.totals.attestations} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">DID Level distribution</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {['L0','L1','L2','L3','L4'].map(lvl => {
                  const c = data.didLevels[lvl] ?? 0;
                  const pct = data.totals.dids > 0 ? (c / data.totals.dids) * 100 : 0;
                  return (
                    <div key={lvl}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-mono">{lvl}</span>
                        <span className="text-muted-foreground">{c} · {pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Trust Tier distribution</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {['T0','T1','T2','T3','T4'].map(t => {
                  const c = data.trustTiers[t] ?? 0;
                  const pct = data.totals.profiles > 0 ? (c / data.totals.profiles) * 100 : 0;
                  return (
                    <div key={t}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-mono">{t}</span>
                        <span className="text-muted-foreground">{c} · {pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${TIER_COLORS[t]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Sybil risk heatmap</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-32">
                  {data.sybilBins.map(b => {
                    const h = (b.count / maxBin) * 100;
                    const danger = b.label === '81-100' || b.label === '61-80';
                    return (
                      <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-[10px] text-muted-foreground">{b.count}</div>
                        <div className={`w-full rounded-t ${danger ? 'bg-destructive/70' : 'bg-emerald-500/60'}`} style={{ height: `${h}%`, minHeight: '4px' }} />
                        <div className="text-[10px] text-muted-foreground">{b.label}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Top SBTs minted</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {data.topSbts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có SBT nào được phát hành.</p>
                ) : data.topSbts.map(s => {
                  const pct = (s.count / maxSbt) * 100;
                  return (
                    <div key={s.sbt_type} className="flex items-center gap-2 text-xs">
                      <span className="w-40 truncate">{s.sbt_type}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                      </div>
                      <Badge variant="outline" className="font-mono w-12 justify-center">{s.count}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{icon}{label}</div>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
