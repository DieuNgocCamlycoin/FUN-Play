/**
 * Activate & Claim Panel
 * Allows users to move tokens through the lifecycle:
 * LOCKED → ACTIVATED → FLOWING (ERC20)
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lock, Zap, Waves, Loader2, ExternalLink,
  AlertCircle, Wallet, ArrowDown, Fuel
} from 'lucide-react';
import { BrowserProvider } from 'ethers';
import { activateTokens, claimTokens, BSC_TESTNET_CONFIG } from '@/lib/fun-money/web3-config';
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
  const [isActivating, setIsActivating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Get provider from signer when connected
  const ensureProvider = async (): Promise<BrowserProvider> => {
    const signer = await getSigner();
    const p = signer.provider as BrowserProvider;
    setProvider(p);
    return p;
  };

  // Auto-get provider when connected
  const getProvider = async (): Promise<BrowserProvider | null> => {
    if (provider) return provider;
    if (!isConnected) return null;
    try {
      return await ensureProvider();
    } catch {
      return null;
    }
  };

  const { allocation, loading, error, refresh } = useOnChainAllocation(
    isConnected && isCorrectChain ? address : null,
    provider
  );

  // Initialize provider on mount if connected
  const handleConnect = async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    if (!isCorrectChain) {
      await switchToBscTestnet();
      return;
    }
    const p = await ensureProvider();
    setProvider(p);
  };

  const handleActivate = async () => {
    if (!allocation || allocation.locked === 0n) return;
    
    setIsActivating(true);
    try {
      const p = await ensureProvider();
      
      toast.info('🔓 Đang Activate tokens...', {
        description: `${formatFunAmount(allocation.locked.toString())} FUN: LOCKED → ACTIVATED`
      });

      const txHash = await activateTokens(p, allocation.locked);

      toast.success(
        <div className="flex flex-col gap-1">
          <span>✅ Activate thành công!</span>
          <span className="text-xs text-muted-foreground">
            {formatFunAmount(allocation.locked.toString())} FUN đã chuyển sang ACTIVATED
          </span>
          <a
            href={BSC_TESTNET_CONFIG.explorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Xem trên BSCScan
          </a>
        </div>
      );

      await refresh();
    } catch (err: any) {
      console.error('[ActivateClaimPanel] Activate error:', err);
      const msg = err.reason || err.message?.slice(0, 100) || 'Unknown error';
      toast.error(`❌ Activate thất bại: ${msg}`);
    } finally {
      setIsActivating(false);
    }
  };

  const handleClaim = async () => {
    if (!allocation || allocation.activated === 0n) return;

    setIsClaiming(true);
    try {
      const p = await ensureProvider();

      toast.info('💎 Đang Claim tokens...', {
        description: `${formatFunAmount(allocation.activated.toString())} FUN: ACTIVATED → VÍ CỦA BẠN`
      });

      const txHash = await claimTokens(p, allocation.activated);

      toast.success(
        <div className="flex flex-col gap-1">
          <span>🎉 Claim thành công!</span>
          <span className="text-xs text-muted-foreground">
            {formatFunAmount(allocation.activated.toString())} FUN đã về ví của bạn
          </span>
          <a
            href={BSC_TESTNET_CONFIG.explorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Xem trên BSCScan
          </a>
        </div>
      );

      await refresh();
    } catch (err: any) {
      console.error('[ActivateClaimPanel] Claim error:', err);
      const msg = err.reason || err.message?.slice(0, 100) || 'Unknown error';
      toast.error(`❌ Claim thất bại: ${msg}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const hasLocked = allocation && allocation.locked > 0n;
  const hasActivated = allocation && allocation.activated > 0n;
  const hasFlowing = allocation && allocation.flowing > 0n;
  const hasAnyTokens = allocation && allocation.total > 0n;

  // Not connected state
  if (!isConnected) {
    return (
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center">
            <div className="p-3 sm:p-4 rounded-full bg-muted/50">
              <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg">Activate & Claim FUN</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Kết nối ví để xem và nhận FUN tokens
            </p>
          </div>
          <Button onClick={handleConnect} className="gap-2 w-full sm:w-auto h-11 sm:h-10 rounded-xl sm:rounded-md active:scale-[0.98] transition-transform">
            <Wallet className="w-4 h-4" />
            Kết nối ví
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Wrong chain
  if (!isCorrectChain) {
    return (
      <Card className="overflow-hidden border-yellow-500/30">
        <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
          <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500 mx-auto" />
          <div>
            <h3 className="font-bold text-base sm:text-lg">Sai mạng</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Vui lòng chuyển sang BSC Testnet</p>
          </div>
          <Button onClick={() => switchToBscTestnet()} variant="outline" className="gap-2 w-full sm:w-auto h-11 sm:h-10 border-yellow-500/50 rounded-xl sm:rounded-md active:scale-[0.98] transition-transform">
            Chuyển sang BSC Testnet
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Need to initialize provider
  if (!provider && !loading) {
    return (
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
          <h3 className="font-bold text-base sm:text-lg">Activate & Claim FUN</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Bấm để bắt đầu nhận FUN tokens về ví
          </p>
          <Button onClick={handleConnect} className="gap-2 w-full sm:w-auto h-12 sm:h-10 rounded-xl sm:rounded-md bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold active:scale-[0.98] transition-transform">
            <Zap className="w-5 h-5" />
            Activate & Claim
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-background via-background to-muted/20">
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <img src={FUN_COIN_LOGO} alt="FUN" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Activate & Claim</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Nhận FUN tokens về ví của bạn
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="text-xs gap-1 h-8 px-2 sm:px-3"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>

        {/* Loading */}
        {loading && !allocation && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Đang đọc dữ liệu on-chain...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Allocation Display */}
        {allocation && (
          <div className="space-y-4">
            {/* 3 States */}
            <div className="space-y-3">
              {/* LOCKED */}
              <div className={cn(
                "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all",
                hasLocked
                  ? "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                  : "bg-muted/30 border-border/50"
              )}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn(
                    "p-1.5 sm:p-2 rounded-full",
                    hasLocked ? "bg-yellow-500/20" : "bg-muted"
                  )}>
                    <Lock className={cn("w-4 h-4 sm:w-5 sm:h-5", hasLocked ? "text-yellow-500" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("font-bold text-xs sm:text-sm", hasLocked ? "text-yellow-500" : "text-muted-foreground")}>
                      LOCKED
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Chờ activate</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-black text-lg sm:text-xl",
                    hasLocked ? "text-yellow-500" : "text-muted-foreground"
                  )}>
                    {formatFunAmount(allocation.locked.toString())}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">FUN</p>
                </div>
              </div>

              {/* Activate Button */}
              {hasLocked && (
                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  <Button
                    onClick={handleActivate}
                    disabled={isActivating}
                    className={cn(
                      "w-full h-12 sm:h-14 gap-2 font-bold text-sm sm:text-base rounded-xl active:scale-[0.98] transition-transform",
                      "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black"
                    )}
                  >
                    {isActivating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang Activate...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Activate {formatFunAmount(allocation.locked.toString())} FUN
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    Cần tBNB để trả phí gas
                  </p>
                </div>
              )}

              {/* ACTIVATED */}
              <div className={cn(
                "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all",
                hasActivated
                  ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "bg-muted/30 border-border/50"
              )}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn(
                    "p-1.5 sm:p-2 rounded-full",
                    hasActivated ? "bg-blue-500/20" : "bg-muted"
                  )}>
                    <Zap className={cn("w-4 h-4 sm:w-5 sm:h-5", hasActivated ? "text-blue-500" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("font-bold text-xs sm:text-sm", hasActivated ? "text-blue-500" : "text-muted-foreground")}>
                      ACTIVATED
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Sẵn sàng claim</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-black text-lg sm:text-xl",
                    hasActivated ? "text-blue-500" : "text-muted-foreground"
                  )}>
                    {formatFunAmount(allocation.activated.toString())}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">FUN</p>
                </div>
              </div>

              {/* Claim Button */}
              {hasActivated && (
                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  <Button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className={cn(
                      "w-full h-12 sm:h-14 gap-2 font-bold text-sm sm:text-base rounded-xl active:scale-[0.98] transition-transform",
                      "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                    )}
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang Claim...
                      </>
                    ) : (
                      <>
                        <Waves className="w-5 h-5" />
                        Claim {formatFunAmount(allocation.activated.toString())} FUN
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    Cần tBNB để trả phí gas
                  </p>
                </div>
              )}

              {/* FLOWING */}
              <div className={cn(
                "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all",
                hasFlowing
                  ? "bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                  : "bg-muted/30 border-border/50"
              )}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn(
                    "p-1.5 sm:p-2 rounded-full",
                    hasFlowing ? "bg-green-500/20" : "bg-muted"
                  )}>
                    <Waves className={cn("w-4 h-4 sm:w-5 sm:h-5", hasFlowing ? "text-green-500" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("font-bold text-xs sm:text-sm", hasFlowing ? "text-green-500" : "text-muted-foreground")}>
                      FLOWING
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Đã về ví (ERC-20)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-black text-lg sm:text-xl",
                    hasFlowing ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {formatFunAmount(allocation.flowing.toString())}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">FUN</p>
                </div>
              </div>
            </div>

            {/* No tokens message */}
            {!hasAnyTokens && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <p>Chưa có FUN token nào trên ví này.</p>
                <p className="text-xs mt-1">Hãy gửi yêu cầu Mint từ trang FUN Money để Admin duyệt.</p>
              </div>
            )}

            {/* tBNB Notice */}
            {(hasLocked || hasActivated) && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
                <Fuel className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">⛽ Phí gas tBNB</p>
                  <p className="text-xs text-muted-foreground">
                    Mỗi bước <strong className="text-foreground">Activate</strong> và <strong className="text-foreground">Claim</strong> cần một ít tBNB để trả phí gas trên BSC Testnet.
                    Nhận tBNB miễn phí tại{' '}
                    <a
                      href="https://www.bnbchain.org/en/testnet-faucet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      BNB Testnet Faucet
                    </a>.
                  </p>
                </div>
              </div>
            )}

            {/* Action Links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              {(hasLocked || hasActivated || !hasAnyTokens) && (
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto gap-2 h-10 sm:h-9 border-yellow-500/40 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 rounded-xl sm:rounded-md">
                  <a
                    href="https://www.bnbchain.org/en/testnet-faucet"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Fuel className="w-4 h-4" />
                    Nhận tBNB miễn phí
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
              {address && (
                <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto gap-2 h-10 sm:h-9 text-xs text-muted-foreground rounded-xl sm:rounded-md">
                  <a
                    href={`${BSC_TESTNET_CONFIG.explorerAddressUrl(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Xem ví trên BSCScan
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
