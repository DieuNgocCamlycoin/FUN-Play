/**
 * TrustCompletionPill — pill nhỏ cạnh DID badge trong ProfileHeader
 * Tự ẩn khi ≥2 guardian.
 */
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useTrustCompletion } from '@/hooks/useTrustCompletion';

interface Props { userId: string; }

export function TrustCompletionPill({ userId }: Props) {
  const { loading, isComplete } = useTrustCompletion(userId);
  if (loading || isComplete) return null;

  return (
    <Link
      to="/identity"
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-[11px] font-medium hover:bg-amber-500/25 transition-colors"
    >
      <ShieldAlert className="h-3 w-3" />
      Hoàn tất Trust
    </Link>
  );
}
