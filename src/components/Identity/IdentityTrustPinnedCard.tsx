/**
 * IdentityTrustPinnedCard — card nổi bật pin trên đầu sidebar.
 * Tự ẩn khi user đã có ≥2 guardian. Có pulse animation thu hút.
 */
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useTrustCompletion } from '@/hooks/useTrustCompletion';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Props {
  compact?: boolean;
  mobileInline?: boolean;
}

export function IdentityTrustPinnedCard({ compact = false, mobileInline = false }: Props) {
  const { user } = useAuth();
  const { loading, isComplete, guardianCount, hasPrimary, hasWallet } = useTrustCompletion();

  if (loading) return null;
  if (!user || isComplete) return null;

  const completed = [hasPrimary, hasWallet, guardianCount >= 2].filter(Boolean).length;

  if (compact) {
    return (
      <Link
        to="/identity"
        className="relative flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 hover:scale-110 transition-transform shadow-lg shadow-amber-500/40"
        title="Hoàn tất Định danh & Trust"
      >
        <ShieldCheck className="h-5 w-5 text-white" />
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
      </Link>
    );
  }

  return (
    <Link
      to="/identity"
      className={cn(
        'group relative block rounded-lg overflow-hidden',
        'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-primary/10',
        'border border-amber-500/40 hover:border-amber-500/70',
        'transition-all hover:shadow-lg hover:shadow-amber-500/20',
        mobileInline ? 'mx-0 mb-0' : 'mx-2 mb-2'
      )}
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-lg ring-2 ring-amber-500/40 animate-pulse pointer-events-none" />

      <div className="relative p-3">
        <div className="flex items-start gap-2.5">
          <div className="rounded-full bg-amber-500/20 p-1.5 shrink-0">
            <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-xs text-foreground">Định danh & Trust</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">
                MỚI
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              Hoàn tất {completed}/3 bước · Mở khoá full mint FUN
            </p>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              Xác minh ngay <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
