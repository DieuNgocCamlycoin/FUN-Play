/**
 * IdentityTrustNavItem — menu item cố định "Identity & Trust" cho Sidebar/MobileDrawer.
 * Tự ẩn khi user đã có ≥2 guardian.
 */
import { ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTrustCompletion } from '@/hooks/useTrustCompletion';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  variant?: 'sidebar' | 'drawer';
  onNavigate?: () => void;
}

export function IdentityTrustNavItem({ variant = 'sidebar', onNavigate }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isComplete } = useTrustCompletion();

  if (!user || loading || isComplete) return null;

  const active = location.pathname === '/identity';
  const handleClick = () => {
    navigate('/identity');
    onNavigate?.();
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn(
        'w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300',
        active && 'bg-primary/10 text-primary font-semibold',
        variant === 'sidebar' && 'text-[#004eac]'
      )}
    >
      <ShieldCheck className={cn('h-5 w-5', variant === 'sidebar' && 'text-[#004eac]')} />
      <span className={cn('font-medium', variant === 'sidebar' && 'text-[#004eac]')}>
        Identity &amp; Trust
      </span>
      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
        Mới
      </span>
    </Button>
  );
}
