import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function MintNotificationBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allocation, setAllocation] = useState<{ amount: number; epochId: string; createdAt: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchRecent = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('mint_allocations')
        .select('allocation_amount, epoch_id, created_at')
        .eq('user_id', user.id)
        .eq('eligible', true)
        .gt('allocation_amount', 0)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const key = `fun_mint_notification_dismissed_${data[0].epoch_id}`;
        if (localStorage.getItem(key)) {
          setDismissed(true);
          return;
        }
        setAllocation({
          amount: Number(data[0].allocation_amount),
          epochId: data[0].epoch_id,
          createdAt: data[0].created_at,
        });
      }
    };

    fetchRecent();
  }, [user]);

  if (!allocation || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(`fun_mint_notification_dismissed_${allocation.epochId}`, '1');
    setDismissed(true);
  };

  const dateStr = format(new Date(allocation.createdAt), 'dd/MM/yyyy', { locale: vi });

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 border border-primary/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              🎉 Bạn có{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-black">
                {allocation.amount.toLocaleString()} FUN
              </span>{' '}
              mới được phân bổ!
            </p>
            <p className="text-xs text-muted-foreground">Phân bổ ngày {dateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs"
            onClick={() => navigate('/fun-money')}
          >
            Xem chi tiết
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
