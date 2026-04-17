/**
 * GovernanceGate — wraps any UI that requires a governance permission
 * (governance_vote / proposal_submit / reviewer / sbt_issuer ...).
 *
 * If the user passes the permission check the children render normally.
 * If not, a friendly upgrade card explains exactly what is missing
 * (DID level, TC, SBT) and links to /identity to upgrade.
 */
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Loader2, ArrowRight, Lock } from 'lucide-react';
import { useTrustPermission } from '@/hooks/useTrustPermission';
import { ACTIVATION_MATRIX } from '@/lib/identity/permission-matrix';

interface GovernanceGateProps {
  action: string;
  children: ReactNode;
  /** When true the gate renders nothing instead of an upgrade card if blocked. */
  silentWhenBlocked?: boolean;
  /** Optional fallback node when blocked. Overrides default upgrade card. */
  fallback?: ReactNode;
}

export function GovernanceGate({
  action,
  children,
  silentWhenBlocked = false,
  fallback,
}: GovernanceGateProps) {
  const perm = useTrustPermission(action);
  const requirement = ACTIVATION_MATRIX.find((r) => r.action === action);

  if (perm.loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-3">
        <Loader2 className="h-3 w-3 animate-spin" />
        Đang kiểm tra quyền…
      </div>
    );
  }

  if (perm.allowed) return <>{children}</>;

  if (silentWhenBlocked) return null;
  if (fallback) return <>{fallback}</>;

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">
                {requirement?.description ?? 'Hành động này yêu cầu Trust cao hơn'}
              </p>
              <Badge variant="outline" className="text-[10px] h-5">
                {action}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {perm.reason ?? 'Bạn chưa đủ điều kiện thực hiện hành động này.'}
            </p>
            {requirement && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="secondary" className="text-[10px]">
                  Cần DID ≥ {requirement.min_did_level} · hiện {perm.did_level}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Cần TC ≥ {requirement.min_tc.toFixed(2)} · hiện {perm.tc.toFixed(2)}
                </Badge>
                {requirement.sbt_required && (
                  <Badge
                    variant={perm.has_sbt ? 'secondary' : 'destructive'}
                    className="text-[10px]"
                  >
                    {perm.has_sbt ? 'SBT ✓' : 'Cần ≥ 1 SBT'}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <Button asChild size="sm" variant="default" className="w-full gap-2">
          <Link to="/identity">
            <ShieldAlert className="h-3.5 w-3.5" />
            Nâng Trust để mở khoá
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
