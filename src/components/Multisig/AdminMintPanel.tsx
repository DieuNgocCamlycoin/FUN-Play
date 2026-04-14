import { useMintSubmit, type MintSubmitRequest } from '@/hooks/useMintSubmit';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket, CheckCircle2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatFunDisplay } from '@/lib/fun-money/web3-config';
import { useState } from 'react';

export function AdminMintPanel() {
  const { signedRequests, submitMint, isSubmitting, loading, refresh } = useMintSubmit();
  const { toast } = useToast();

  const handleSubmit = async (request: MintSubmitRequest) => {
    try {
      const result = await submitMint(request);
      toast({
        title: '✅ Mint thành công!',
        description: `TX: ${result.txHash.slice(0, 16)}...`,
      });
    } catch (err: any) {
      toast({
        title: 'Mint thất bại',
        description: err.message?.slice(0, 200),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Admin — Direct Mint On-chain</h3>
          <p className="text-sm text-muted-foreground">
            Requests sẵn sàng mint trực tiếp qua mintValidatedAction (99% user / 1% platform)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : signedRequests.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          Không có request nào sẵn sàng submit.
        </Card>
      ) : (
        <div className="space-y-3">
          {signedRequests.map((req) => {
            const isBusy = isSubmitting === req.id;

            return (
              <Card key={req.id} className="p-4 space-y-3 border-emerald-500/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {req.action_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-mono truncate text-muted-foreground">
                      → {req.recipient_address}
                    </p>
                    <p className="text-lg font-bold mt-1">
                      {formatFunDisplay(req.amount_wei)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleSubmit(req)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Rocket className="w-4 h-4 mr-1" />
                    {isBusy ? 'Submitting...' : 'Mint TX'}
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
