import { useMintSubmit, type MintSubmitRequest } from '@/hooks/useMintSubmit';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Rocket, CheckCircle2, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatFunDisplay } from '@/lib/fun-money/web3-config';
import { useState } from 'react';

export function AdminMintPanel() {
  const { signedRequests, submitMint, isSubmitting, loading, refresh } = useMintSubmit();
  const { toast } = useToast();
  const [mismatchConfirmed, setMismatchConfirmed] = useState<Set<string>>(new Set());
  // Track submitted IDs locally to prevent double-click
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [mintingId, setMintingId] = useState<string | null>(null);

  const handleSubmit = async (request: MintSubmitRequest) => {
    if (submittedIds.has(request.id) || mintingId) return;
    
    setMintingId(request.id);
    setSubmittedIds(prev => new Set(prev).add(request.id));
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
      // Allow retry on failure
      setSubmittedIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    } finally {
      setMintingId(null);
    }
  };

  const confirmMismatch = (id: string) => {
    setMismatchConfirmed(prev => new Set(prev).add(id));
  };

  const hasWalletMismatch = (req: MintSubmitRequest) => {
    return req.current_wallet &&
      req.recipient_address.toLowerCase() !== req.current_wallet.toLowerCase();
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
            const isBusy = mintingId === req.id || isSubmitting === req.id;
            const mismatch = hasWalletMismatch(req);
            const confirmed = mismatchConfirmed.has(req.id);
            const alreadySubmitted = submittedIds.has(req.id);

            return (
              <Card key={req.id} className={`p-4 space-y-3 ${mismatch ? 'border-amber-500/50' : 'border-emerald-500/20'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {req.action_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {req.status}
                      </Badge>
                      {mismatch && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive" className="text-xs gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                ⚠️ Ví đã đổi
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs font-mono">
                                <strong>Ví trong request:</strong><br/>
                                {req.recipient_address}<br/><br/>
                                <strong>Ví hiện tại:</strong><br/>
                                {req.current_wallet}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-sm font-mono truncate text-muted-foreground">
                      → {req.recipient_address}
                    </p>
                    {mismatch && (
                      <p className="text-xs font-mono text-amber-500 truncate">
                        ✱ Ví mới: {req.current_wallet}
                      </p>
                    )}
                    <p className="text-lg font-bold mt-1">
                      {formatFunDisplay(req.amount_wei)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {alreadySubmitted ? (
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs gap-1 py-1.5 px-3">
                        {isBusy ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Đang mint...</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" />Đã submit</>
                        )}
                      </Badge>
                    ) : mismatch && !confirmed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmMismatch(req.id)}
                        className="border-amber-500 text-amber-600 hover:bg-amber-50 text-xs"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Xác nhận mint dù ví khác
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleSubmit(req)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isBusy ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Submitting...</>
                        ) : (
                          <><Rocket className="w-4 h-4 mr-1" />Mint TX</>
                        )}
                      </Button>
                    )}
                  </div>
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
