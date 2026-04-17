/**
 * TCProgressionCard — shows next-step actions to upgrade to T2 + 30d TC delta history.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Wallet, Users, FileSignature, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { tcToTier, type TrustTier } from '@/lib/identity/trust-tier';
import type { DIDLevel } from '@/lib/identity/did-registry';

interface Step {
  key: string;
  label: string;
  hint: string;
  icon: typeof Phone;
  done: boolean;
  cta?: string;
}

interface Props {
  tier: TrustTier;
  tc: number;
  didLevel: DIDLevel;
  onActionClick?: (key: string) => void;
}

export function TCProgressionCard({ tier, tc, didLevel, onActionClick }: Props) {
  const { user } = useAuth();
  const [steps, setSteps] = useState<Step[]>([]);
  const [delta30d, setDelta30d] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [profileRes, attestRes, sbtRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('phone_verified_at, wallet_address, pplp_accepted_at').eq('id', user.id).maybeSingle(),
        supabase.from('attestation_log').select('id', { count: 'exact', head: true })
          .eq('to_user_id', user.id).eq('status', 'active'),
        supabase.from('sbt_registry').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('status', 'active'),
        supabase.from('identity_events').select('tc_delta').eq('user_id', user.id).gte('created_at', since),
      ]);

      if (cancelled) return;

      const profile = profileRes.data as { phone_verified_at?: string | null; wallet_address?: string | null; pplp_accepted_at?: string | null } | null;
      const attestCount = attestRes.count ?? 0;
      const sbtCount = sbtRes.count ?? 0;
      const totalDelta = (eventsRes.data || []).reduce((sum, e: { tc_delta: number | null }) => sum + (Number(e.tc_delta) || 0), 0);

      setDelta30d(totalDelta);
      setSteps([
        {
          key: 'phone',
          label: 'Xác minh điện thoại (OTP)',
          hint: 'Nâng DID L1 → L2, +0.15 TC',
          icon: Phone,
          done: !!profile?.phone_verified_at || (didLevel === 'L2' || didLevel === 'L3' || didLevel === 'L4'),
          cta: 'verify_phone',
        },
        {
          key: 'wallet',
          label: 'Liên kết ví Web3',
          hint: 'Tăng on-chain score (OS), +0.10 TC',
          icon: Wallet,
          done: !!profile?.wallet_address,
          cta: 'link_wallet',
        },
        {
          key: 'attestations',
          label: 'Nhận ≥ 3 attestations từ peer',
          hint: `Hiện có ${attestCount}/3 — tăng Social Score (SS)`,
          icon: Users,
          done: attestCount >= 3,
        },
        {
          key: 'sbt',
          label: 'Có ≥ 1 SBT active',
          hint: `Hiện có ${sbtCount} SBT — bắt buộc cho governance`,
          icon: FileSignature,
          done: sbtCount >= 1,
        },
      ]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, didLevel]);

  const currentTier = tier;
  const nextTier: TrustTier | null = currentTier === 'T4' ? null
    : currentTier === 'T3' ? 'T4'
    : currentTier === 'T2' ? 'T3'
    : currentTier === 'T1' ? 'T2'
    : 'T1';

  const completedCount = steps.filter(s => s.done).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Lộ trình nâng Trust
        </CardTitle>
        <Badge variant={delta30d >= 0 ? 'default' : 'destructive'} className="font-mono">
          {delta30d >= 0 ? '+' : ''}{delta30d.toFixed(3)} (30d)
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">
            Hiện tại: <strong className="text-foreground">{currentTier}</strong> (TC {tc.toFixed(3)})
          </span>
          {nextTier && (
            <span className="text-muted-foreground">
              Tiếp theo: <strong className="text-primary">{nextTier}</strong>
            </span>
          )}
        </div>

        {loading ? (
          <div className="h-32 animate-pulse bg-muted rounded" />
        ) : (
          <ul className="space-y-2">
            {steps.map(s => {
              const Icon = s.icon;
              return (
                <li key={s.key} className="flex items-start gap-3 p-2 rounded-md bg-muted/40">
                  {s.done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={`text-sm font-medium ${s.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.hint}</p>
                  </div>
                  {!s.done && s.cta && onActionClick && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onActionClick(s.cta!)}>
                      Làm
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-muted-foreground border-t pt-2">
          Đã hoàn thành <strong className="text-foreground">{completedCount}/{steps.length}</strong> bước.
          Trust Confidence cập nhật mỗi khi có hành động mới.
        </p>
      </CardContent>
    </Card>
  );
}

// Re-export helper
export { tcToTier };
