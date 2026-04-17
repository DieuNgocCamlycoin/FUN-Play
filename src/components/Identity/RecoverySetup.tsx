import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, KeyRound, Wallet, Users2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RECOVERY_LABELS, type RecoveryLayer } from '@/lib/identity/recovery-engine';

const ICONS: Record<RecoveryLayer, typeof KeyRound> = {
  primary: KeyRound, wallet: Wallet, guardian: Users2, governance: Crown,
};

interface Props { userId: string; }

export function RecoverySetup({ userId }: Props) {
  const [layers, setLayers] = useState<Record<RecoveryLayer, boolean>>({
    primary: false, wallet: false, guardian: false, governance: false,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('recovery_log')
        .select('recovery_layer, status').eq('user_id', userId).eq('status', 'completed');
      const setUp: Record<RecoveryLayer, boolean> = { primary: false, wallet: false, guardian: false, governance: false };
      (data || []).forEach((r: any) => { if (r.recovery_layer in setUp) setUp[r.recovery_layer as RecoveryLayer] = true; });
      setLayers(setUp);
      setLoading(false);
    })();
  }, [userId]);

  const handleSetup = async (layer: RecoveryLayer) => {
    toast({ title: 'Sắp ra mắt', description: `Setup ${RECOVERY_LABELS[layer]} sẽ có trong phase tiếp theo.` });
  };

  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-40 animate-pulse bg-muted rounded" /></CardContent></Card>;
  }

  const setupCount = Object.values(layers).filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Identity Recovery
        </CardTitle>
        <Badge variant={setupCount >= 2 ? 'default' : 'outline'}>{setupCount}/4 lớp</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {(Object.keys(RECOVERY_LABELS) as RecoveryLayer[]).map(layer => {
          const Icon = ICONS[layer];
          const enabled = layers[layer];
          return (
            <div key={layer} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm">{RECOVERY_LABELS[layer]}</span>
              </div>
              {enabled ? (
                <Badge variant="secondary" className="text-[10px]">Đã bật</Badge>
              ) : (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleSetup(layer)}>
                  Bật
                </Button>
              )}
            </div>
          );
        })}
        {setupCount < 2 && (
          <p className="text-xs text-muted-foreground pt-2">
            Khuyến nghị bật ít nhất 2 lớp khôi phục để bảo vệ danh tính.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
