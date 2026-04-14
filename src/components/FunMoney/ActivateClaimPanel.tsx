/**
 * Locked Grants Panel (replaces ActivateClaimPanel)
 * Shows user's locked grants and allows releasing when vesting period ends.
 * No more 3-step flow — tokens are minted directly, with optional time-lock.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lock, Waves, Loader2, ExternalLink,
  Wallet, Fuel, CheckCircle2, Clock
} from 'lucide-react';
import { BrowserProvider } from 'ethers';
import { releaseLockedGrant, BSC_TESTNET_CONFIG } from '@/lib/fun-money/web3-config';
import { formatFunAmount } from '@/lib/fun-money/pplp-engine';
import { useOnChainAllocation } from '@/hooks/useOnChainAllocation';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FUN_COIN_LOGO = '/images/fun-money-coin.png';

export function ActivateClaimPanel() {
  const {
    isConnected, address, isCorrectChain,
    connect, switchToBscTestnet, getSigner
  } = useFunMoneyWallet();

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [releasingIndex, setReleasingIndex] = useState<number | null>(null);

  const ensureProvider = async (): Promise<BrowserProvider> => {
    const signer = await getSigner();
    const p = signer.provider as BrowserProvider;
    setProvider(p);
    return p;
  };

  const { allocation, loading, error, refresh } = useOnChainAllocation(
    isConnected && isCorrectChain ? address : null,
    provider
  );

  const handleConnect = async () => {
    if (!isConnected) { await connect(); return; }
    if (!isCorrectChain) { await switchToBscTestnet(); return; }
    const p = await ensureProvider();
    setProvider(p);
  };

  const handleRelease = async (index: number) => {
    setReleasingIndex(index);
    try {
      const p = await ensureProvider();
      const grant = allocation?.grants[index];
      if (!grant) return;

      toast.info('🔓 Đang release locked grant...');
      const txHash = await releaseLockedGrant(p, index);

      toast.success(
        <div className="flex flex-col gap-1">
          <span>🎉 Release thành công!</span>
          <span className="text-xs text-muted-foreground">
            {formatFunAmount(grant.amount.toString())} FUN đã về ví
          </span>
          <a href={BSC_TESTNET_CONFIG.explorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Xem trên BSCScan
          </a>
        </div>
      );
      await refresh();
    } catch (err: any) {
      toast.error(`❌ Release thất bại: ${err.reason || err.message?.slice(0, 100)}`);
    } finally {
      setReleasingIndex(null);
    }
  };

  const hasFlowing = allocation && allocation.flowing > 0n;
  const hasLocked = allocation && allocation.locked > 0n;
  const hasAnyTokens = allocation && allocation.total > 0n;
  const unclaimedGrants = allocation?.grants.filter(g => !g.claimed) || [];

  if (!isConnected) {
    return (
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-4 sm:p-6 text-center space-y-3">
          <Wallet className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-base sm:text-lg">FUN Money Wallet</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Kết nối ví để xem FUN tokens</p>
          <Button onClick={handleConnect} className="gap-2">
            <Wallet className="w-4 h-4" /> Kết nối ví
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isCorrectChain) {
    return (
      <Card className="overflow-hidden border-yellow-500/30">
        <CardContent className="p-4 sm:p-6 text-center space-y-3">
          <h3 className="font-bold">Sai mạng</h3>
          <Button onClick={() => switchToBscTestnet()} variant="outline">Chuyển sang BSC Testnet</Button>
        </CardContent>
      </Card>
    );
  }

  if (!provider && !loading) {
    return (
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-4 sm:p-6 text-center space-y-3">
          <h3 className="font-bold">FUN Money Wallet</h3>
          <Button onClick={handleConnect} className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold">
            <Waves className="w-5 h-5" /> Xem FUN Tokens
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-background via-background to-muted/20">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={FUN_COIN_LOGO} alt="FUN" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">FUN Money Wallet</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Token trực tiếp — không cần Activate/Claim</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} className="text-xs gap-1">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Waves className="w-3 h-3" />}
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>

        {loading && !allocation && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Đang đọc dữ liệu on-chain...</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {allocation && (
          <div className="space-y-4">
            {/* FLOWING balance */}
            <div className={cn(
              "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all",
              hasFlowing ? "bg-green-500/10 border-green-500/30" : "bg-muted/30 border-border/50"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 sm:p-2 rounded-full", hasFlowing ? "bg-green-500/20" : "bg-muted")}>
                  <Waves className={cn("w-4 h-4 sm:w-5 sm:h-5", hasFlowing ? "text-green-500" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className={cn("font-bold text-xs sm:text-sm", hasFlowing ? "text-green-500" : "text-muted-foreground")}>
                    BALANCE
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Đã về ví (ERC-20)</p>
                </div>
              </div>
              <p className={cn("font-black text-lg sm:text-xl", hasFlowing ? "text-green-500" : "text-muted-foreground")}>
                {formatFunAmount(allocation.flowing.toString())} <span className="text-sm">FUN</span>
              </p>
            </div>

            {/* LOCKED grants */}
            {hasLocked && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Lock className="w-4 h-4 text-yellow-500" />
                  Locked Grants ({unclaimedGrants.length})
                </div>
                {unclaimedGrants.map((grant, idx) => {
                  const originalIdx = allocation.grants.indexOf(grant);
                  const releaseDate = new Date(grant.releaseAt * 1000);
                  const isReleasable = Date.now() >= grant.releaseAt * 1000;

                  return (
                    <div key={idx} className={cn(
                      "flex items-center justify-between p-3 rounded-xl border",
                      isReleasable ? "bg-yellow-500/10 border-yellow-500/30" : "bg-muted/30 border-border/50"
                    )}>
                      <div>
                        <p className="font-bold text-sm">
                          {formatFunAmount(grant.amount.toString())} FUN
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {isReleasable ? 'Sẵn sàng release!' : `Release: ${releaseDate.toLocaleDateString('vi-VN')}`}
                        </p>
                      </div>
                      {isReleasable ? (
                        <Button
                          size="sm"
                          onClick={() => handleRelease(originalIdx)}
                          disabled={releasingIndex === originalIdx}
                          className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold"
                        >
                          {releasingIndex === originalIdx ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>🔓 Release</>
                          )}
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <Lock className="w-3 h-3 mr-1" /> Locked
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!hasAnyTokens && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <p>Chưa có FUN token nào trên ví này.</p>
                <p className="text-xs mt-1">Admin sẽ mint FUN trực tiếp vào ví bạn — không cần thao tác gì thêm!</p>
              </div>
            )}

            {/* Info notice */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✨ Mint trực tiếp — Không cần phí gas!</p>
                <p className="text-sm text-muted-foreground">
                  FUN Money được mint thẳng vào ví bạn. Bạn <strong>không cần tBNB</strong> hay thao tác gì thêm.
                  {hasLocked && ' Chỉ cần tBNB khi release locked grants.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
