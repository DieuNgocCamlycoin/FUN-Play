import { useMintSubmit } from '@/hooks/useMintSubmit';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MultisigStatusBadge } from './MultisigStatusBadge';
import { Rocket, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatFunDisplay, BSC_TESTNET_CONFIG } from '@/lib/fun-money/web3-config';
import type { MultisigSignatures } from '@/lib/fun-money/pplp-multisig-types';
import type { GovGroupName } from '@/lib/fun-money/pplp-multisig-config';
import { useState } from 'react';

export function AdminMintPanel() {
  const { signedRequests, submitMint, verifyNonce, isSubmitting, loading, refresh } = useMintSubmit();
  const { toast } = useToast();
  const [verifyingNonce, setVerifyingNonce] = useState<string | null>(null);

  const handleSubmit = async (request: any) => {
    try {
      // Verify nonce first
      setVerifyingNonce(request.id);
      const nonceValid = await verifyNonce(request.recipient_address, request.nonce || '0');
      setVerifyingNonce(null);

      if (!nonceValid) {
        toast({
          title: '⚠️ Nonce không khớp!',
          description: 'Nonce on-chain khác DB. Cần tạo lại request.',
          variant: 'destructive',
        });
        return;
      }

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
          <h3 className="text-lg font-bold">Admin Submit On-chain</h3>
          <p className="text-sm text-muted-foreground">
            Requests đã đủ 3/3 chữ ký, sẵn sàng submit lockWithPPLP
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
            const sigs = (req.multisig_signatures || {}) as MultisigSignatures;
            const completedGroups = (req.multisig_completed_groups || []) as GovGroupName[];
            const isBusy = isSubmitting === req.id || verifyingNonce === req.id;

            return (
              <Card key={req.id} className="p-4 space-y-3 border-emerald-500/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        ✅ Đủ chữ ký
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {req.action_type}
                      </Badge>
                    </div>
                    <p className="text-sm font-mono truncate text-muted-foreground">
                      → {req.recipient_address}
                    </p>
                    <p className="text-lg font-bold mt-1">
                      {formatFunDisplay(req.amount_wei)}
                    </p>
                    {req.nonce && (
                      <p className="text-xs text-muted-foreground">Nonce: {req.nonce}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleSubmit(req)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Rocket className="w-4 h-4 mr-1" />
                    {isSubmitting === req.id ? 'Submitting...' : verifyingNonce === req.id ? 'Verifying...' : 'Submit TX'}
                  </Button>
                </div>

                <MultisigStatusBadge signatures={sigs} completedGroups={completedGroups} />

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
