/**
 * RecoverySetup — 4-layer recovery configuration card.
 * Auto-detects primary (email confirmed) + wallet (linked address) layers,
 * and lets users configure guardian/governance via stub flow.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, KeyRound, Wallet, Users2, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { RECOVERY_LABELS, type RecoveryLayer } from '@/lib/identity/recovery-engine';

const ICONS: Record<RecoveryLayer, typeof KeyRound> = {
  primary: KeyRound, wallet: Wallet, guardian: Users2, governance: Crown,
};

const HINTS: Record<RecoveryLayer, string> = {
  primary: 'Email/Phone đã xác thực ở tài khoản',
  wallet: 'Liên kết ví backup khác ví chính',
  guardian: 'Chọn 2-of-3 người tin cậy để khôi phục',
  governance: 'Chỉ áp dụng cho tài khoản giá trị cao (T4)',
};

interface Props { userId: string; }

export function RecoverySetup({ userId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [layers, setLayers] = useState<Record<RecoveryLayer, boolean>>({
    primary: false, wallet: false, guardian: false, governance: false,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<RecoveryLayer | null>(null);

  const load = async () => {
    setLoading(true);
    // Auto-detect primary (email confirmed) + wallet (linked address)
    const [{ data: profile }, { data: recovered }] = await Promise.all([
      supabase.from('profiles').select('wallet_address').eq('id', userId).maybeSingle(),
      supabase.from('recovery_log')
        .select('recovery_layer, status').eq('user_id', userId).eq('status', 'completed'),
    ]);

    const setUp: Record<RecoveryLayer, boolean> = {
      primary: !!user?.email_confirmed_at || !!user?.phone_confirmed_at,
      wallet: !!profile?.wallet_address,
      guardian: false,
      governance: false,
    };
    (recovered || []).forEach((r: any) => {
      if (r.recovery_layer in setUp) setUp[r.recovery_layer as RecoveryLayer] = true;
    });
    setLayers(setUp);
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [userId, user?.email_confirmed_at]);

  const handleSetup = async (layer: RecoveryLayer) => {
    setBusy(layer);
    try {
      if (layer === 'primary') {
        toast({
          title: 'Xác thực email',
          description: 'Vào /settings để xác thực email/phone. Hoặc dùng Phone OTP ở thẻ DID L1→L2.',
        });
        return;
      }
      if (layer === 'wallet') {
        toast({
          title: 'Liên kết ví',
          description: 'Mở Wallet Hub để kết nối ví. Ví liên kết sẽ tự bật lớp recovery này.',
        });
        return;
      }
      if (layer === 'guardian') {
        // Insert pending guardian record — operator UI sẽ hoàn tất ở phase tiếp
        await supabase.from('recovery_log').insert({
          user_id: userId,
          recovery_layer: 'guardian',
          status: 'pending',
          metadata: { initiated_at: new Date().toISOString(), need: '2-of-3' },
        });
        toast({
          title: 'Đã tạo yêu cầu',
          description: 'Mời 2-of-3 guardian sẽ có ở phase tiếp. Yêu cầu được lưu pending.',
        });
        await load();
        return;
      }
      if (layer === 'governance') {
        toast({
          title: 'Chỉ áp dụng T4',
          description: 'Recovery governance dành cho tài khoản Core (T4). Liên hệ council để kích hoạt.',
        });
      }
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err?.message || 'Không thể bật lớp này', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
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
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="min-w-0">
                  <div className="text-sm">{RECOVERY_LABELS[layer]}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{HINTS[layer]}</div>
                </div>
              </div>
              {enabled ? (
                <Badge variant="secondary" className="text-[10px] shrink-0">Đã bật</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs shrink-0"
                  disabled={busy === layer}
                  onClick={() => handleSetup(layer)}
                >
                  {busy === layer ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Bật'}
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
