import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { toast } from 'sonner';

interface AllocationSummary {
  totalAllocated: number;
  totalClaimed: number;
  pendingClaim: number;
  latestTxHash: string | null;
  hasPendingRequest: boolean;
}

export function ClaimFUNButton() {
  const { user } = useAuth();
  const { isConnected, address } = useFunMoneyWallet();
  const [summary, setSummary] = useState<AllocationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchSummary();
  }, [user]);

  const fetchSummary = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get allocations
      const { data: allocations } = await supabase
        .from('mint_allocations')
        .select('allocation_amount, onchain_tx_hash, eligible')
        .eq('user_id', user.id)
        .eq('eligible', true);

      // Get pending claim requests
      const { data: claims } = await supabase
        .from('claim_requests')
        .select('status, amount, tx_hash')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const totalAllocated = allocations?.reduce((s, a) => s + Number(a.allocation_amount), 0) ?? 0;
      const totalClaimed = claims?.filter(c => c.status === 'success').reduce((s, c) => s + Number(c.amount), 0) ?? 0;
      const hasPendingRequest = claims?.some(c => c.status === 'pending') ?? false;
      const latestTxHash = allocations?.find(a => a.onchain_tx_hash)?.onchain_tx_hash ?? 
                           claims?.find(c => c.tx_hash)?.tx_hash ?? null;

      setSummary({
        totalAllocated,
        totalClaimed,
        pendingClaim: Math.max(0, totalAllocated - totalClaimed),
        latestTxHash,
        hasPendingRequest,
      });
    } catch {
      console.error('Failed to fetch claim summary');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!user || !address || !summary) return;
    setClaiming(true);
    try {
      const { error } = await supabase.from('claim_requests').insert({
        user_id: user.id,
        wallet_address: address,
        amount: summary.pendingClaim,
        claim_type: 'manual',
      });
      if (error) throw error;
      toast.success('Yêu cầu claim đã được gửi! Admin sẽ xử lý sớm.');
      fetchSummary();
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi yêu cầu claim');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải thông tin claim...
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalAllocated === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Coins className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Chưa có FUN được phân bổ</p>
            <p className="text-xs text-muted-foreground">Tiếp tục hoạt động để nhận FUN vào cuối tháng</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 border-primary/20">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl shadow-lg">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">FUN có thể claim</p>
              <p className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {summary.pendingClaim.toLocaleString()} FUN
              </p>
              <p className="text-xs text-muted-foreground">
                Tổng phân bổ: {summary.totalAllocated.toLocaleString()} · Đã claim: {summary.totalClaimed.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {summary.hasPendingRequest ? (
              <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang xử lý
              </Badge>
            ) : summary.pendingClaim > 0 ? (
              <Button
                onClick={handleClaim}
                disabled={claiming || !isConnected}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white gap-2"
              >
                {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                Yêu cầu Claim
              </Button>
            ) : (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                ✅ Đã claim hết
              </Badge>
            )}

            {summary.latestTxHash && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://testnet.bscscan.com/tx/${summary.latestTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  TX
                </a>
              </Button>
            )}
          </div>
        </div>

        {!isConnected && summary.pendingClaim > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-yellow-600 bg-yellow-500/10 rounded-lg p-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Kết nối ví BSC để claim FUN
          </div>
        )}
      </CardContent>
    </Card>
  );
}
