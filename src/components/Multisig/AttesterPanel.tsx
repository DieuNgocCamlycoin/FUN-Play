import { useAttesterSigning } from '@/hooks/useAttesterSigning';
import type { MintRequestV2 } from '@/hooks/useAttesterSigning';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MultisigStatusBadge } from './MultisigStatusBadge';
import { ShieldAlert, ShieldCheck, RefreshCw, PenLine, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatFunDisplay } from '@/lib/fun-money/web3-config';
import { useCallback } from 'react';

export function AttesterPanel() {
  const {
    pendingRequests,
    myName,
    groupLabel,
    isAttester,
    loading,
    isSigning,
    signRequest,
    refresh,
  } = useAttesterSigning();
  const { toast } = useToast();

  const handleSign = useCallback(async (request: MintRequestV2) => {
    try {
      const result = await signRequest(request);
      toast({
        title: '✅ Đã ký',
        description: result.ready_to_broadcast
          ? `Đủ ${result.threshold}/${result.threshold} chữ ký — sẽ broadcast trong 1 phút.`
          : `Hiện có ${result.signatures_count}/${result.threshold} chữ ký.`,
      });
    } catch (err: any) {
      toast({
        title: '❌ Ký thất bại',
        description: err?.message?.slice(0, 200),
        variant: 'destructive',
      });
    }
  }, [signRequest, toast]);

  if (!isAttester) {
    return (
      <Card className="p-6 text-center">
        <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-semibold text-lg mb-1">Không phải Attester</h3>
        <p className="text-muted-foreground text-sm">
          Ví hiện tại không nằm trong danh sách GOV. Hãy kết nối ví đúng.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Attester Signing Panel (v2)
          </h3>
          <p className="text-sm text-muted-foreground">
            Nhóm: <span className="font-medium text-foreground">{groupLabel}</span>
            {' · '}Tên: <span className="font-medium text-foreground">{myName}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ký EIP-712 PureLoveProof — đủ 3/3 sẽ tự broadcast lockWithPPLP
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : pendingRequests.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Không có request nào đang chờ chữ ký.
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req) => {
            const isBusy = isSigning === req.id;
            const alreadySigned = req.signatures.some(s => s.attester.toLowerCase() === (req as any).address?.toLowerCase?.());
            const sigsNeeded = 3;
            return (
              <Card key={req.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {req.action_name}
                      </Badge>
                      <MultisigStatusBadge status={req.status} />
                      <Badge variant="outline" className="text-xs">
                        {req.signatures_count}/{sigsNeeded} sigs
                      </Badge>
                    </div>
                    <p className="text-xs font-mono truncate text-muted-foreground">
                      → {req.recipient_address}
                    </p>
                    <p className="text-lg font-bold mt-1">
                      {formatFunDisplay(req.amount_wei)}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/70 mt-1 truncate">
                      digest: {req.digest.slice(0, 18)}…
                    </p>
                  </div>
                  {req.status === 'signed' || req.status === 'broadcasting' ? (
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1 py-1.5 px-3">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sẵn sàng broadcast
                    </Badge>
                  ) : alreadySigned ? (
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs gap-1 py-1.5 px-3">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Bạn đã ký
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleSign(req)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isBusy ? (
                        <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Signing...</>
                      ) : (
                        <><PenLine className="w-4 h-4 mr-1" />Sign</>
                      )}
                    </Button>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  ID: {req.id.slice(0, 8)}… · {new Date(req.created_at).toLocaleString('vi-VN')}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
