import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getCurrentPhase, getPhaseHistory, clearPhaseCache, type PhaseStateRow } from '@/lib/fun-money/system-phase';
import { TLS_PHASE_WEIGHTS, type SystemPhase } from '@/lib/fun-money/light-score-params-v1';
import { Activity, ArrowRight } from 'lucide-react';

const PHASE_COLOR: Record<SystemPhase, string> = {
  early: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40',
  growth: 'bg-blue-500/15 text-blue-700 border-blue-500/40',
  mature: 'bg-purple-500/15 text-purple-700 border-purple-500/40',
};

export const PhaseControlPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [current, setCurrent] = useState<PhaseStateRow | null>(null);
  const [history, setHistory] = useState<PhaseStateRow[]>([]);
  const [evaluating, setEvaluating] = useState(false);

  const load = async () => {
    const hist = await getPhaseHistory(20);
    setHistory(hist);
    setCurrent(hist.find(h => h.is_current) ?? null);
  };

  useEffect(() => { load(); }, []);

  const evaluate = async () => {
    setEvaluating(true);
    try {
      const { data, error } = await supabase.rpc('evaluate_phase_switch');
      if (error) throw error;
      const result = data as any;
      toast({
        title: result?.switched ? `🚀 Đã chuyển phase → ${result.current_phase}` : '✓ Vẫn giữ phase hiện tại',
        description: `DAU: ${result?.kpi?.dau} • Total mint: ${result?.kpi?.total_mint?.toLocaleString()} FUN`,
      });
      clearPhaseCache();
      await load();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setEvaluating(false);
    }
  };

  const toggleAuto = async (enabled: boolean) => {
    if (!current) return;
    const { error } = await supabase
      .from('system_phase_state')
      .update({ auto_switch_enabled: enabled })
      .eq('id', current.id);
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    load();
  };

  if (!current) return <Card><CardContent className="p-4 text-xs text-muted-foreground">Loading...</CardContent></Card>;

  const weights = TLS_PHASE_WEIGHTS[current.current_phase];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          System Phase Control
        </CardTitle>
        <p className="text-xs text-muted-foreground">Auto-switch theo KPI (DAU + total mint + active users)</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Phase hiện tại</span>
            <Badge className={PHASE_COLOR[current.current_phase]}>{current.current_phase.toUpperCase()}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-muted/30">
              <div className="text-muted-foreground text-[10px]">α (PLS)</div>
              <div className="font-mono font-semibold">{weights.alpha}</div>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <div className="text-muted-foreground text-[10px]">β (NLS)</div>
              <div className="font-mono font-semibold">{weights.beta}</div>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <div className="text-muted-foreground text-[10px]">γ (LLS)</div>
              <div className="font-mono font-semibold">{weights.gamma}</div>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="text-xs space-y-1 p-2 rounded bg-muted/20">
          <div className="font-semibold mb-1">📊 KPI Snapshot (lần chuyển gần nhất)</div>
          {Object.entries(current.kpi_snapshot ?? {}).map(([k, v]) => (
            <div key={k} className="flex justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">{k}</span>
              <span>{typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
            </div>
          ))}
        </div>

        {/* Auto switch */}
        <div className="flex items-center justify-between border rounded p-2">
          <Label className="text-xs cursor-pointer" htmlFor="auto-switch">Auto-switch enabled</Label>
          <Switch id="auto-switch" checked={current.auto_switch_enabled} onCheckedChange={toggleAuto} />
        </div>

        <Button size="sm" onClick={evaluate} disabled={evaluating} className="w-full">
          {evaluating ? 'Đang đánh giá...' : '🔄 Evaluate Phase Switch Now'}
        </Button>

        {/* History */}
        <div>
          <h4 className="text-xs font-semibold mb-1">Lịch sử chuyển phase</h4>
          <div className="space-y-1 max-h-[140px] overflow-y-auto">
            {history.map(h => (
              <div key={h.id} className="text-[11px] flex items-center gap-2 py-1 border-b border-border/20 last:border-0">
                {h.previous_phase && (
                  <>
                    <Badge variant="outline" className="text-[9px]">{h.previous_phase}</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
                <Badge className={PHASE_COLOR[h.current_phase] + ' text-[9px]'}>{h.current_phase}</Badge>
                <span className="text-muted-foreground ml-auto">{new Date(h.switched_at).toLocaleDateString('vi-VN')}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          Ngưỡng auto: early→growth (DAU≥1k, mint≥1M, users≥5k) | growth→mature (DAU≥10k, mint≥50M, users≥50k)
        </p>
      </CardContent>
    </Card>
  );
};
