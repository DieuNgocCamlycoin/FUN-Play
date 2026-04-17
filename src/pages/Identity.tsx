import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DIDLevelCard } from '@/components/Identity/DIDLevelCard';
import { TrustScoreCard } from '@/components/Identity/TrustScoreCard';
import { SBTGallery } from '@/components/Identity/SBTGallery';
import { AttestationPanel } from '@/components/Identity/AttestationPanel';
import { RecoverySetup } from '@/components/Identity/RecoverySetup';
import { ZKCommitmentPanel } from '@/components/Identity/ZKCommitmentPanel';
import { OrgPanel } from '@/components/Identity/OrgPanel';
import { AIAgentPanel } from '@/components/Identity/AIAgentPanel';
import { DIBVaultPanel } from '@/components/Identity/DIBVaultPanel';
import { getDID, type DIDRecord } from '@/lib/identity/did-registry';
import { tcToTier, type TrustTier } from '@/lib/identity/trust-tier';

interface TrustProfileRow {
  tc: number;
  trust_tier: TrustTier;
  vs: number; bs: number; ss: number; os: number; hs: number; rf: number;
  sybil_risk: number;
  fraud_risk: number;
}

export default function Identity() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [did, setDid] = useState<DIDRecord | null>(null);
  const [trust, setTrust] = useState<TrustProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const didRecord = await getDID(user.id);
    setDid(didRecord);

    const { data: tp } = await supabase.from('trust_profile').select('*').eq('user_id', user.id).maybeSingle();
    if (tp) {
      const tcVal = Number(tp.tc) || 0.3;
      setTrust({
        tc: tcVal,
        trust_tier: (tp.tier as TrustTier) || tcToTier(tcVal),
        vs: Number(tp.vs) || 0, bs: Number(tp.bs) || 0, ss: Number(tp.ss) || 0,
        os: Number(tp.os) || 0, hs: Number(tp.hs) || 0, rf: Number(tp.rf) || 1,
        sybil_risk: Number(tp.sybil_risk) || 0,
        fraud_risk: Number(tp.fraud_risk) || 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const handleRecompute = async () => {
    if (!user) return;
    setRecomputing(true);
    try {
      const [didRes, trustRes, sbtRes] = await Promise.all([
        supabase.functions.invoke('did-registry-engine', { body: { action: 'evaluate' } }),
        supabase.functions.invoke('trust-engine-v1', { body: { user_id: user.id } }),
        supabase.functions.invoke('sbt-issuance-engine', { body: { user_id: user.id } }),
      ]);
      if (didRes.error) throw didRes.error;
      if (trustRes.error) throw trustRes.error;
      if (sbtRes.error) throw sbtRes.error;
      const newSbts = (sbtRes.data as any)?.newly_issued ?? 0;
      await load();
      toast({
        title: 'Đã cập nhật',
        description: newSbts > 0
          ? `DID + Trust Score tính lại. 🎖 Cấp ${newSbts} SBT mới!`
          : 'DID + Trust Score được tính lại.',
      });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err?.message || 'Không thể tính lại', variant: 'destructive' });
    } finally {
      setRecomputing(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải…</div>;
  }

  return (
    <>
      {(() => {
        if (typeof document !== 'undefined') {
          document.title = 'Identity & Trust — FUN Play';
          let meta = document.querySelector('meta[name="description"]');
          if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
          meta.setAttribute('content', 'Quản lý DID, Trust Confidence, SBT và Recovery của bạn trong hệ FUN.');
        }
        return null;
      })()}


      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" /> Identity & Trust
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              DID là gốc · Trust là dòng chảy · SBT là dấu neo · DIB là ngân hàng uy tín
            </p>
          </div>
          <Button onClick={handleRecompute} disabled={recomputing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${recomputing ? 'animate-spin' : ''}`} />
            Tính lại Trust
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DIDLevelCard did={did} loading={loading} />
          <TrustScoreCard profile={trust} loading={loading} />
        </div>

        <SBTGallery userId={user.id} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DIBVaultPanel userId={user.id} />
          <AttestationPanel userId={user.id} />
        </div>

        <RecoverySetup userId={user.id} />

        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Phase 4 — ZK · Org · AI Agent
          </h2>
          <p className="text-xs text-muted-foreground">
            Zero-knowledge commitments, định danh tổ chức, và AI agent có operator chịu trách nhiệm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ZKCommitmentPanel />
          <OrgPanel didLevel={did?.level} />
          <AIAgentPanel didLevel={did?.level} />
        </div>

        <Card>
          <CardContent className="p-4 text-xs text-muted-foreground">
            <p><strong className="text-foreground">Spec v1.0:</strong> 3 layer (DID, SBT, DIB) + Trust Engine. Trust Confidence quyết định Light Score được tin và quyền mint/governance.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
