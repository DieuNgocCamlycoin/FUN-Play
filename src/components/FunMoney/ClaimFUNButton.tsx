import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ExternalLink, Loader2, AlertCircle, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { toast } from 'sonner';

interface ClaimRow {
  id: string;
  amount: number;
  status: string;
  tx_hash: string | null;
  gov_required: boolean;
  gov_signatures_count: number;
  token_state: string;
  epoch_id: string | null;
  created_at: string;
}

interface AllocationSummary {
  totalAllocated: number;
  totalClaimed: number;
  pendingClaim: number;
  latestTxHash: string | null;
  // 4-state machine
  activeClaim: ClaimRow | null;        // claim đang ở trạng thái nào đó của pipeline
  hasUnclaimedAllocation: boolean;     // có allocation eligible nhưng chưa tạo claim
}

export function ClaimFUNButton() {
  const { user } = useAuth();
  const { isConnected, address } = useFunMoneyWallet();
  const [summary, setSummary] = useState<AllocationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: allocations } = await supabase
        .from('mint_allocations')
        .select('allocation_amount, onchain_tx_hash, eligible')
        .eq('user_id', user.id)
        .eq('eligible', true);

      const { data: claims } = await supabase
        .from('claim_requests')
        .select('id, amount, status, tx_hash, gov_required, gov_signatures_count, token_state, epoch_id, created_at')
        .eq('user_id', user.id)
        .eq('claim_type', 'fun_money')
        .order('created_at', { ascending: false });

      const totalAllocated = allocations?.reduce((s, a) => s + Number(a.allocation_amount), 0) ?? 0;
      const totalClaimed = (claims || [])
        .filter(c => c.status === 'success' && (c.token_state === 'active' || c.token_state === 'claimed'))
        .reduce((s, c) => s + Number(c.amount), 0);

      // Active claim = claim mới nhất chưa hoàn thành chu trình
      const activeClaim = (claims || []).find(c =>
        c.tx_hash === null || c.token_state === 'locked'
      ) as ClaimRow | undefined;

      const latestTxHash = (claims || []).find(c => c.tx_hash)?.tx_hash
        ?? allocations?.find(a => a.onchain_tx_hash)?.onchain_tx_hash
        ?? null;

      const pendingClaim = Math.max(0, totalAllocated - totalClaimed);

      setSummary({
        totalAllocated,
        totalClaimed,
        pendingClaim,
        latestTxHash,
        activeClaim: (activeClaim ?? null) as ClaimRow | null,
        hasUnclaimedAllocation: pendingClaim > 0 && !activeClaim,
      });
    } catch (e) {
      console.error('[ClaimFUNButton] fetchSummary error', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchSummary();
    const ch = supabase
      .channel(`claim-status-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'claim_requests', filter: `user_id=eq.${user.id}` },
        () => fetchSummary())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchSummary]);

  const handleClaim = async () => {
    if (!user || !address || !summary) return;
    setBusy(true);
    try {
      // Compute current epoch_id
      const now = new Date();
      const epochId = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

      const { data: inserted, error } = await supabase.from('claim_requests').insert({
        user_id: user.id,
        wallet_address: address,
        amount: summary.pendingClaim,
        claim_type: 'fun_money',
        epoch_id: epochId,
        gov_required: true,
        token_state: 'locked',
      }).select('id').single();
      if (error) throw error;

      toast.success('✅ Đã gửi yêu cầu — chờ 3/3 GOV ký duyệt, sau đó FUN sẽ tự về ví.');
      fetchSummary();
    } catch (err: any) {
      const msg = err?.message || 'Không thể gửi yêu cầu claim';
      if (msg.includes('duplicate') || msg.includes('uq_claim_requests')) {
        toast.error('Bạn đã có 1 claim cho chu kỳ này — chờ xử lý xong mới claim được tiếp.');
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async () => {
    if (!user || !summary?.activeClaim) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('activate-fun-claim', {
        body: { claim_id: summary.activeClaim.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success('⚡ Đã Activate! FUN giờ đã sẵn sàng trong ví của bạn.');
      fetchSummary();
    } catch (err: any) {
      toast.error(err?.message || 'Activate thất bại');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải thông tin claim...
        </CardContent>
      </Card>
    );
  }

  if (!summary || (summary.totalAllocated === 0 && !summary.activeClaim)) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Coins className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Chờ chốt chu kỳ</p>
            <p className="text-xs text-muted-foreground">
              Tiếp tục hoạt động — quỹ 30M FUN sẽ phân bổ cuối tháng theo Light Score.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ac = summary.activeClaim;
  // ─── State 1: Có active claim đang chờ GOV ───
  const waitingGov = ac && ac.gov_required && ac.gov_signatures_count < 3 && !ac.tx_hash;
  // ─── State 2: GOV đủ 3/3 nhưng chưa transfer ───
  const waitingChain = ac && (ac.gov_signatures_count >= 3 || !ac.gov_required) && !ac.tx_hash;
  // ─── State 3: Đã transfer, locked → cần Activate ───
  const needActivate = ac && !!ac.tx_hash && ac.token_state === 'locked';

  return (
    <Card className="bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 border-primary/20">
      <CardContent className="py-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl shadow-lg">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {ac ? `Claim #${ac.id.slice(0, 8)} · ${ac.epoch_id ?? '—'}` : 'FUN có thể claim'}
              </p>
              <p className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {(ac ? Number(ac.amount) : summary.pendingClaim).toLocaleString()} FUN
              </p>
              <p className="text-xs text-muted-foreground">
                Tổng phân bổ: {summary.totalAllocated.toLocaleString()} · Đã về ví: {summary.totalClaimed.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* === State badges + actions === */}
            {waitingGov && (
              <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/40 gap-1">
                <ShieldCheck className="w-3 h-3" />
                Chờ GOV ({ac!.gov_signatures_count}/3)
              </Badge>
            )}
            {waitingChain && !needActivate && (
              <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/40 gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Cron đang gửi on-chain
              </Badge>
            )}
            {needActivate && (
              <Button
                onClick={handleActivate}
                disabled={busy}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                ⚡ Activate
              </Button>
            )}
            {!ac && summary.hasUnclaimedAllocation && (
              <Button
                onClick={handleClaim}
                disabled={busy || !isConnected}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                Yêu cầu Claim
              </Button>
            )}
            {ac && ac.token_state === 'active' && (
              <Badge className="bg-green-500/20 text-green-700 border-green-500/40">
                ✅ FUN đã ở ví bạn
              </Badge>
            )}

            {(summary.latestTxHash || ac?.tx_hash) && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://bscscan.com/tx/${ac?.tx_hash || summary.latestTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> TX
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Hints */}
        {waitingGov && (
          <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-500/10 rounded-lg p-2">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            Đang chờ 3 nhóm GOV (Will + Wisdom + Love) ký duyệt. Mỗi nhóm 1 chữ ký off-chain.
          </div>
        )}
        {needActivate && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-500/10 rounded-lg p-2">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            FUN đã được chuyển on-chain ở trạng thái <strong>Locked</strong>. Bấm Activate để mở khoá sử dụng.
          </div>
        )}
        {!isConnected && summary.hasUnclaimedAllocation && (
          <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-500/10 rounded-lg p-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Kết nối ví BSC để claim FUN
          </div>
        )}
      </CardContent>
    </Card>
  );
}
