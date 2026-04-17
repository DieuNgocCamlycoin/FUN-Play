import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Building2, Bot, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stats {
  zkCommitments: number;
  zkActiveCommitments: number;
  zkRoots: number;
  zkLatestRoot: { commitment_type: string; leaf_count: number; published_at: string } | null;
  orgs: number;
  orgsVerified: number;
  agents: number;
  agentsActive: number;
  aiAttestations: number;
  capHits: number;
}

const empty: Stats = {
  zkCommitments: 0, zkActiveCommitments: 0, zkRoots: 0, zkLatestRoot: null,
  orgs: 0, orgsVerified: 0, agents: 0, agentsActive: 0,
  aiAttestations: 0, capHits: 0,
};

export function IdentityMonitorTab() {
  const [stats, setStats] = useState<Stats>(empty);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [
      zkAll, zkActive, zkRoots, latestRoot,
      orgsAll, orgsVerified,
      agentsAll, agentsActive,
      aiAttest,
    ] = await Promise.all([
      supabase.from('zk_commitments').select('*', { count: 'exact', head: true }),
      supabase.from('zk_commitments').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('zk_merkle_roots').select('*', { count: 'exact', head: true }),
      supabase.from('zk_merkle_roots').select('commitment_type, leaf_count, published_at')
        .eq('is_active', true).order('published_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('did_registry').select('*', { count: 'exact', head: true }).eq('entity_type', 'organization'),
      supabase.from('did_registry').select('*', { count: 'exact', head: true })
        .eq('entity_type', 'organization').eq('verified_org_badge', true),
      supabase.from('ai_operators').select('*', { count: 'exact', head: true }),
      supabase.from('ai_operators').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('attestation_log').select('weight', { count: 'exact' }).eq('ai_origin', true).limit(500),
    ]);

    const aiRows = (aiAttest.data ?? []) as { weight: number }[];
    const capHits = aiRows.filter(r => Number(r.weight) === 0.05).length;

    setStats({
      zkCommitments: zkAll.count ?? 0,
      zkActiveCommitments: zkActive.count ?? 0,
      zkRoots: zkRoots.count ?? 0,
      zkLatestRoot: (latestRoot.data as any) ?? null,
      orgs: orgsAll.count ?? 0,
      orgsVerified: orgsVerified.count ?? 0,
      agents: agentsAll.count ?? 0,
      agentsActive: agentsActive.count ?? 0,
      aiAttestations: aiAttest.count ?? 0,
      capHits,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Identity & Trust Monitor
          </h2>
          <p className="text-sm text-muted-foreground">
            Phase 4A — ZK commitments, Org identity, AI agents
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* ZK section */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Zero-Knowledge Commitments
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Lock} label="Total commitments" value={stats.zkCommitments} />
          <StatCard icon={Lock} label="Active" value={stats.zkActiveCommitments} accent="primary" />
          <StatCard icon={Sparkles} label="Merkle roots built" value={stats.zkRoots} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">Latest active root</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.zkLatestRoot ? (
                <>
                  <Badge variant="outline" className="mb-1">{stats.zkLatestRoot.commitment_type}</Badge>
                  <p className="text-2xl font-bold">{stats.zkLatestRoot.leaf_count}</p>
                  <p className="text-[10px] text-muted-foreground">leaves</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Org section */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Organizations
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Building2} label="Total orgs" value={stats.orgs} />
          <StatCard icon={Building2} label="Verified" value={stats.orgsVerified} accent="primary" />
        </div>
      </section>

      {/* AI section */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          AI Agents
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Bot} label="Registered" value={stats.agents} />
          <StatCard icon={Bot} label="Active" value={stats.agentsActive} accent="primary" />
          <StatCard icon={Bot} label="AI attestations" value={stats.aiAttestations} />
          <StatCard icon={ShieldAlert} label="Weight cap hits" value={stats.capHits} accent="warning" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Cap hit = AI attestation có weight = 0.05 (giới hạn cứng từ trigger DB).
        </p>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, accent,
}: { icon: any; label: string; value: number; accent?: 'primary' | 'warning' }) {
  const accentClass =
    accent === 'primary' ? 'text-primary' :
    accent === 'warning' ? 'text-amber-600 dark:text-amber-400' :
    'text-foreground';
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
        <Icon className={`w-4 h-4 ${accentClass}`} />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${accentClass}`}>{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
