/**
 * MintSandboxBanner — shown on /fun-money for T0/T1 users (sandbox mode max 100 FUN).
 */
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles, ShieldAlert } from 'lucide-react';
import { useTrustPermission } from '@/hooks/useTrustPermission';

export function MintSandboxBanner() {
  const { loading, tier, did_level, tc, allowed } = useTrustPermission('mint_full');

  if (loading) return null;
  // Show only when in sandbox tiers
  if (tier !== 'T0' && tier !== 'T1') return null;
  if (allowed) return null;

  return (
    <Alert className="border-amber-500/40 bg-amber-500/10">
      <ShieldAlert className="h-4 w-4 text-amber-600" />
      <AlertTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        Sandbox Mode — Trust Tier {tier}
      </AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        <p>
          Tài khoản đang ở <strong>chế độ sandbox</strong> (DID {did_level} · TC {tc.toFixed(2)}).
          Mỗi lần mint tối đa <strong>100 FUN</strong>. Nâng DID lên <strong>L2 (Verified)</strong> để mở
          full mint, governance vote và nhận thưởng giới thiệu.
        </p>
        <Button asChild size="sm" variant="default" className="gap-2">
          <Link to="/identity">
            <Sparkles className="h-3.5 w-3.5" />
            Nâng cấp DID ngay
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
