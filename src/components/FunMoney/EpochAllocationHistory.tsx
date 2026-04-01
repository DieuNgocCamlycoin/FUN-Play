/**
 * Epoch Allocation History
 * Shows user's monthly FUN allocation history from mint_allocations + mint_epochs
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, TrendingUp, AlertCircle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface EpochAllocation {
  id: string;
  epoch_id: string;
  allocation_amount: number;
  eligible: boolean;
  light_score_at_epoch: number;
  level_at_epoch: string;
  reason_codes: string[];
  anti_whale_capped: boolean;
  created_at: string;
  // Joined from mint_epochs
  period_start: string;
  period_end: string;
  epoch_status: string;
  mint_pool_amount: number;
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  qualified: { label: 'Đủ điều kiện', color: 'text-green-500' },
  pplp_not_accepted: { label: 'Chưa chấp nhận PPLP', color: 'text-red-500' },
  no_activity_in_epoch: { label: 'Không hoạt động trong kỳ', color: 'text-orange-500' },
  anti_farm_flagged: { label: 'Bị đánh dấu anti-farm', color: 'text-red-500' },
  level_too_low: { label: 'Cấp độ chưa đủ', color: 'text-yellow-500' },
  anti_whale_capped: { label: 'Giới hạn anti-whale (3%)', color: 'text-blue-500' },
};

const LEVEL_LABELS: Record<string, { label: string; emoji: string }> = {
  seed: { label: 'Light Seed', emoji: '🌱' },
  presence: { label: 'Presence', emoji: '✨' },
  builder: { label: 'Light Builder', emoji: '🔨' },
  guardian: { label: 'Light Guardian', emoji: '🛡️' },
  leader: { label: 'Light Leader', emoji: '👑' },
  cosmic: { label: 'Cosmic', emoji: '🌌' },
};

export function EpochAllocationHistory() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<EpochAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAllocations = async () => {
      setLoading(true);
      try {
        // Fetch user's allocations
        const { data: allocs, error: allocErr } = await (supabase as any)
          .from('mint_allocations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (allocErr) throw allocErr;
        if (!allocs?.length) {
          setAllocations([]);
          setLoading(false);
          return;
        }

        // Fetch corresponding epochs
        const epochIds = [...new Set(allocs.map((a: any) => a.epoch_id))];
        const { data: epochs } = await (supabase as any)
          .from('mint_epochs')
          .select('epoch_id, period_start, period_end, status, mint_pool_amount')
          .in('epoch_id', epochIds);

        const epochMap = new Map((epochs || []).map((e: any) => [e.epoch_id, e]));

        const merged: EpochAllocation[] = allocs.map((a: any) => {
          const epoch = (epochMap.get(a.epoch_id) || {}) as any;
          return {
            ...a,
            period_start: epoch.period_start || '',
            period_end: epoch.period_end || '',
            epoch_status: epoch.status || 'unknown',
            mint_pool_amount: epoch.mint_pool_amount || 0,
          };
        });

        setAllocations(merged);
      } catch (err) {
        console.error('Error fetching epoch allocations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const formatMonth = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="w-5 h-5 text-primary" />
          Lịch sử phân bổ FUN theo tháng
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allocations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Chưa có dữ liệu phân bổ</p>
            <p className="text-sm mt-1">Hệ thống sẽ tính toán vào cuối mỗi tháng</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allocations.map((alloc) => {
              const levelInfo = LEVEL_LABELS[alloc.level_at_epoch] || LEVEL_LABELS.seed;
              const isEligible = alloc.eligible;

              return (
                <div
                  key={alloc.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    isEligible
                      ? "bg-gradient-to-r from-green-500/5 to-cyan-500/5 border-green-500/20"
                      : "bg-muted/30 border-border"
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {formatMonth(alloc.period_start)}
                      </span>
                      <Badge variant={alloc.epoch_status === 'finalized' ? 'default' : 'secondary'} className="text-[10px]">
                        {alloc.epoch_status === 'finalized' ? 'Đã chốt' : alloc.epoch_status === 'draft' ? 'Đang tính' : alloc.epoch_status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-xl font-black",
                        isEligible && alloc.allocation_amount > 0 ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {alloc.allocation_amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">FUN</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Light Score</p>
                      <p className="font-semibold">{alloc.light_score_at_epoch}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Cấp độ</p>
                      <p className="font-semibold">
                        {levelInfo.emoji} {levelInfo.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Quỹ thưởng</p>
                      <p className="font-semibold">{(alloc.mint_pool_amount || 0).toLocaleString()} FUN</p>
                    </div>
                  </div>

                  {/* Reason codes */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(alloc.reason_codes || []).map((code, i) => {
                      const info = REASON_LABELS[code] || { label: code, color: 'text-muted-foreground' };
                      const Icon = code === 'qualified' ? CheckCircle2
                        : code.includes('anti_whale') ? ShieldAlert
                        : code.includes('not_accepted') || code.includes('flagged') ? XCircle
                        : AlertCircle;

                      return (
                        <Badge
                          key={i}
                          variant="outline"
                          className={cn("gap-1 text-[10px] font-normal", info.color)}
                        >
                          <Icon className="w-3 h-3" />
                          {info.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
