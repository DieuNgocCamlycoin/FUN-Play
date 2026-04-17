import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { getStabilityHistory, getStabilityIndex, recomputeStabilityIndex, STABILITY_BOUNDS, type StabilitySnapshot } from '@/lib/fun-money/stability-index';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';

interface Props {
  userId?: string;
  className?: string;
}

export const StabilityIndexCard = ({ userId, className }: Props) => {
  const { user } = useAuth();
  const targetId = userId ?? user?.id;
  const [current, setCurrent] = useState<number>(1.0);
  const [history, setHistory] = useState<StabilitySnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!targetId) return;
    setLoading(true);
    const [idx, hist] = await Promise.all([
      getStabilityIndex(targetId),
      getStabilityHistory(targetId, 30),
    ]);
    setCurrent(idx);
    setHistory(hist);
    setLoading(false);
  };

  useEffect(() => { load(); }, [targetId]);

  const recompute = async () => {
    if (!targetId) return;
    setLoading(true);
    await recomputeStabilityIndex(targetId);
    await load();
  };

  const pct = ((current - STABILITY_BOUNDS.floor) / (STABILITY_BOUNDS.ceiling - STABILITY_BOUNDS.floor)) * 100;
  const label = current >= 1.1 ? 'Rất ổn định' : current >= 0.95 ? 'Ổn định' : current >= 0.75 ? 'Biến động nhẹ' : 'Biến động cao';
  const variant = current >= 1.1 ? 'default' : current >= 0.95 ? 'secondary' : current >= 0.75 ? 'outline' : 'destructive';

  const chartData = history.map(h => ({
    date: h.snapshot_date.slice(5),
    stability: Number(h.stability_index),
    ls: Number(h.mean_ls_30d),
  }));

  return (
    <Card className={className}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Stability Index
          </CardTitle>
          <p className="text-xs text-muted-foreground">Đo độ ổn định Light Score 30 ngày — ảnh hưởng mint amount</p>
        </div>
        <Button size="icon" variant="ghost" onClick={recompute} disabled={loading} className="h-7 w-7">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-3xl font-bold font-mono">{current.toFixed(3)}</span>
            <Badge variant={variant as any}>{label}</Badge>
          </div>
          <Progress value={pct} className="h-2" />
          <p className="text-[10px] text-muted-foreground mt-1">
            Range: {STABILITY_BOUNDS.floor} (chaotic) – {STABILITY_BOUNDS.ceiling} (rock-solid) • Neutral: {STABILITY_BOUNDS.neutral}
          </p>
        </div>

        {chartData.length >= 2 && (
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0.5, 1.2]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="stability" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded">
          💡 Mint formula: <span className="font-mono">FUN = VVU × stability × phase_mul × 0.5</span><br/>
          Stability cao → bonus, biến động → reduction. Cần ít nhất 3 ngày dữ liệu.
        </div>
      </CardContent>
    </Card>
  );
};
