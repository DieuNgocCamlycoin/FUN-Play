import { useState, useCallback } from 'react';
import { useAttesterSigning } from '@/hooks/useAttesterSigning';
import { useMintSubmit } from '@/hooks/useMintSubmit';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MultisigStatusBadge } from './MultisigStatusBadge';
import { ShieldAlert, Pen, RefreshCw, ShieldCheck, PenLine, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatFunDisplay } from '@/lib/fun-money/web3-config';
import { REQUIRED_GROUPS } from '@/lib/fun-money/pplp-multisig-config';
import type { MultisigSignatures, PPLPMintRequest } from '@/lib/fun-money/pplp-multisig-types';
import type { GovGroupName } from '@/lib/fun-money/pplp-multisig-config';

export function AttesterPanel() {
  const {
    pendingRequests,
    signRequest,
    myGroup,
    myName,
    groupLabel,
    isAttester,
    loading,
    signing,
    refresh,
  } = useAttesterSigning();
  const { toast } = useToast();
  const { submitMint } = useMintSubmit();
  const [signingAll, setSigningAll] = useState(false);
  const [signAllProgress, setSignAllProgress] = useState({ done: 0, total: 0 });
  const [autoMinting, setAutoMinting] = useState<string | null>(null);

  // Get unsigned requests for this group
  const unsignedRequests = pendingRequests.filter((req) => {
    const sigs = (req.multisig_signatures || {}) as MultisigSignatures;
    return myGroup ? !sigs[myGroup] : false;
  });

  // Auto-mint helper: submit on-chain after 3/3 signatures
  const tryAutoMint = useCallback(async (request: any) => {
    setAutoMinting(request.id);
    toast({
      title: '⚡ Đủ 3/3 chữ ký — Tự động mint on-chain...',
      description: `Đang gửi giao dịch cho ${request.recipient_address?.slice(0, 10)}...`,
    });
    try {
      // Re-fetch the latest request data with all signatures
      const { data: freshReq } = await (await import('@/integrations/supabase/client')).supabase
        .from('pplp_mint_requests')
        .select('*')
        .eq('id', request.id)
        .single();

      if (freshReq && freshReq.status === 'signed') {
        const result = await submitMint(freshReq as unknown as PPLPMintRequest);
        toast({
          title: '✅ Mint on-chain thành công!',
          description: `TX: ${result.txHash?.slice(0, 16)}...`,
        });
      }
    } catch (err: any) {
      console.error('[AutoMint] Failed:', err);
      toast({
        title: '❌ Auto-mint thất bại',
        description: `${err.message?.slice(0, 100)}. Admin có thể thử lại từ bảng thống kê.`,
        variant: 'destructive',
      });
    } finally {
      setAutoMinting(null);
    }
  }, [submitMint, toast]);

  const handleSign = useCallback(async (request: any) => {
    try {
      const result = await signRequest(request);
      if (result.status === 'signed') {
        toast({
          title: 'Ký thành công! ✅',
          description: 'Đã đủ 3/3 chữ ký — đang tự động mint on-chain...',
        });
        // Auto-mint after 3/3
        await tryAutoMint(request);
      } else {
        toast({
          title: 'Ký thành công! ✅',
          description: `Chữ ký nhóm ${myGroup?.toUpperCase()} đã được lưu. Chờ nhóm khác ký tiếp.`,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Lỗi ký',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [signRequest, myGroup, toast, tryAutoMint]);

  const handleSignAll = useCallback(async () => {
    if (unsignedRequests.length === 0) return;
    if (!window.confirm(`Bạn sẽ ký ${unsignedRequests.length} request cùng lúc. Tiếp tục?`)) return;

    setSigningAll(true);
    setSignAllProgress({ done: 0, total: unsignedRequests.length });
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < unsignedRequests.length; i++) {
      try {
        await signRequest(unsignedRequests[i]);
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error(`[SignAll] Failed request ${unsignedRequests[i].id}:`, err.message);
      }
      setSignAllProgress({ done: i + 1, total: unsignedRequests.length });
    }

    setSigningAll(false);
    toast({
      title: 'Ký hàng loạt hoàn tất',
      description: `✅ Thành công: ${successCount} · ❌ Lỗi: ${failCount}`,
      variant: failCount > 0 ? 'destructive' : 'default',
    });
  }, [unsignedRequests, signRequest, toast]);

  if (!isAttester) {
    return (
      <Card className="p-6 text-center">
        <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-semibold text-lg mb-1">Không phải Attester</h3>
        <p className="text-muted-foreground text-sm">
          Ví hiện tại không nằm trong danh sách GOV Attester. Hãy kết nối ví đúng.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Attester Panel — Multisig 3/3
          </h3>
          <p className="text-sm text-muted-foreground">
            Nhóm: <span className="font-medium text-foreground">{groupLabel}</span>
            {' · '}Tên: <span className="font-medium text-foreground">{myName}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mỗi request cần 1 chữ ký từ MỖI nhóm (WILL + WISDOM + LOVE)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sign All Button */}
          {unsignedRequests.length > 0 && (
            <Button
              size="sm"
              onClick={handleSignAll}
              disabled={signingAll || !!signing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {signingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  {signAllProgress.done}/{signAllProgress.total}
                </>
              ) : (
                <>
                  <PenLine className="w-4 h-4 mr-1" />
                  Ký tất cả ({unsignedRequests.length})
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Requests */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : pendingRequests.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Không có request nào đang chờ ký.
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req) => {
            const sigs = (req.multisig_signatures || {}) as MultisigSignatures;
            const alreadySigned = myGroup ? !!sigs[myGroup] : false;
            const completedGroups = (req.multisig_completed_groups || []) as GovGroupName[];
            const remainingGroups = REQUIRED_GROUPS.filter(g => !completedGroups.includes(g));

            return (
              <Card key={req.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {req.action_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {completedGroups.length}/{REQUIRED_GROUPS.length} nhóm đã ký
                      </Badge>
                    </div>
                    {(req as any).user_display_name && (
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={(req as any).user_avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                            {((req as any).user_display_name as string).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {(req as any).user_display_name}
                      </p>
                    )}
                    <p className="text-xs font-mono truncate text-muted-foreground">
                      → {req.recipient_address}
                    </p>
                    <p className="text-lg font-bold mt-1">
                      {formatFunDisplay(req.amount_wei)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={alreadySigned || signing === req.id || signingAll}
                    onClick={() => handleSign(req)}
                    className={alreadySigned ? 'opacity-50' : ''}
                  >
                    <Pen className="w-4 h-4 mr-1" />
                    {signing === req.id ? 'Đang ký...' : alreadySigned ? 'Đã ký ✓' : 'Ký xác nhận'}
                  </Button>
                </div>

                <MultisigStatusBadge
                  signatures={sigs}
                  completedGroups={completedGroups}
                />

                {remainingGroups.length > 0 && (
                  <p className="text-xs text-amber-500">
                    ⏳ Chờ nhóm: {remainingGroups.map(g => g.toUpperCase()).join(', ')}
                  </p>
                )}

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
