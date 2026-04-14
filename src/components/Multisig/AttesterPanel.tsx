import { useAttesterSigning } from '@/hooks/useAttesterSigning';
import { useMintSubmit, type MintSubmitRequest } from '@/hooks/useMintSubmit';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MultisigStatusBadge } from './MultisigStatusBadge';
import { ShieldAlert, ShieldCheck, RefreshCw, Rocket, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatFunDisplay } from '@/lib/fun-money/web3-config';
import { useState, useCallback } from 'react';

export function AttesterPanel() {
  const {
    pendingRequests,
    myGroup,
    myName,
    groupLabel,
    isAttester,
    loading,
    refresh,
  } = useAttesterSigning();
  const { toast } = useToast();
  const { submitMint, isSubmitting } = useMintSubmit();
  const [minting, setMinting] = useState<string | null>(null);

  const handleMint = useCallback(async (request: MintSubmitRequest) => {
    setMinting(request.id);
    try {
      const result = await submitMint(request);
      toast({
        title: '✅ Mint thành công!',
        description: `TX: ${result.txHash?.slice(0, 16)}...`,
      });
    } catch (err: any) {
      toast({
        title: '❌ Mint thất bại',
        description: err.message?.slice(0, 100),
        variant: 'destructive',
      });
    } finally {
      setMinting(null);
    }
  }, [submitMint, toast]);

  if (!isAttester) {
    return (
      <Card className="p-6 text-center">
        <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-semibold text-lg mb-1">Không phải Authorized Minter</h3>
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
            Authorized Minter Panel
          </h3>
          <p className="text-sm text-muted-foreground">
            Nhóm: <span className="font-medium text-foreground">{groupLabel}</span>
            {' · '}Tên: <span className="font-medium text-foreground">{myName}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mint trực tiếp qua FUNMoneyMinter — 99% user / 1% platform
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
          Không có request nào đang chờ mint.
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req) => {
            const isBusy = minting === req.id || isSubmitting === req.id;

            return (
              <Card key={req.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {req.action_type}
                      </Badge>
                      <MultisigStatusBadge status={req.status} />
                    </div>
                    <p className="text-xs font-mono truncate text-muted-foreground">
                      → {req.recipient_address}
                    </p>
                    <p className="text-lg font-bold mt-1">
                      {formatFunDisplay(req.amount_wei)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleMint(req)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isBusy ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Minting...</>
                    ) : (
                      <><Rocket className="w-4 h-4 mr-1" />Mint TX</>
                    )}
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  ID: {req.id.slice(0, 8)}... · {new Date(req.created_at).toLocaleString('vi-VN')}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
