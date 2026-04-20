/**
 * GOV Sign Claims Page — Quy trình mới: ký off-chain EIP-191 cho FUN Money claims
 * Mỗi nhóm GOV (Will/Wisdom/Love) ký 1 lần, đủ 3 nhóm → cron auto transfer
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAccount, useSignMessage } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useGovAttesters } from '@/hooks/useGovAttesters';
import { toast } from 'sonner';

type GovGroup = 'will' | 'wisdom' | 'love';

interface ClaimRow {
  id: string;
  user_id: string;
  amount: number;
  epoch_id: string | null;
  wallet_address: string;
  gov_signatures_count: number;
  gov_completed_groups: string[];
  gov_signatures: Record<string, any>;
  status: string;
  tx_hash: string | null;
  created_at: string;
}

const GROUP_META: Record<GovGroup, { label: string; emoji: string; color: string }> = {
  will: { label: 'Ý Chí (WILL)', emoji: '💪', color: 'bg-blue-500/20 text-blue-700 border-blue-500/40' },
  wisdom: { label: 'Trí Tuệ (WISDOM)', emoji: '🌟', color: 'bg-amber-500/20 text-amber-700 border-amber-500/40' },
  love: { label: 'Yêu Thương (LOVE)', emoji: '❤️', color: 'bg-rose-500/20 text-rose-700 border-rose-500/40' },
};

function buildSignMessage(claim: { id: string; user_id: string; amount: number; epoch_id: string | null }) {
  return [
    'FUN Money — GOV Approval',
    `claim_id: ${claim.id}`,
    `user_id: ${claim.user_id}`,
    `epoch: ${claim.epoch_id ?? 'n/a'}`,
    `amount: ${claim.amount} FUN`,
  ].join('\n');
}

export default function GovSignClaimsPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { attesters, loading: attLoading } = useGovAttesters();
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<string | null>(null);

  // Detect: is connected wallet a GOV attester? Which group?
  const myAttester = useMemo(() => {
    if (!address) return null;
    const a = attesters.find(x => x.wallet_address.toLowerCase() === address.toLowerCase() && x.is_active);
    return a ?? null;
  }, [address, attesters]);

  const myGroup = (myAttester?.gov_group ?? null) as GovGroup | null;

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('claim_requests')
      .select('id, user_id, amount, epoch_id, wallet_address, gov_signatures_count, gov_completed_groups, gov_signatures, status, tx_hash, created_at')
      .eq('claim_type', 'fun_money')
      .eq('gov_required', true)
      .is('tx_hash', null)
      .lt('gov_signatures_count', 3)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) {
      toast.error('Không tải được danh sách claim');
      setClaims([]);
    } else {
      setClaims((data || []) as ClaimRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClaims();
    const channel = supabase
      .channel('gov-sign-claims')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claim_requests' }, () => fetchClaims())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchClaims]);

  const handleSign = async (claim: ClaimRow) => {
    if (!myGroup || !address) {
      toast.error('Ví của bạn không thuộc nhóm GOV nào');
      return;
    }
    if ((claim.gov_completed_groups || []).includes(myGroup)) {
      toast.info(`Nhóm ${myGroup.toUpperCase()} đã ký claim này rồi`);
      return;
    }

    setSigningId(claim.id);
    try {
      const message = buildSignMessage(claim);
      const signature = await signMessageAsync({ account: address, message });

      const { data, error } = await supabase.functions.invoke('gov-sign-claim', {
        body: {
          claim_id: claim.id,
          signature,
          gov_group: myGroup,
          signer_address: address,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const ready = (data as any)?.ready_for_chain;
      toast.success(
        ready
          ? `✅ Đủ 3/3 chữ ký — cron sẽ tự gửi on-chain trong vài phút`
          : `Đã ký với nhóm ${myGroup.toUpperCase()} (${(data as any)?.signatures_count}/3)`
      );
      fetchClaims();
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || 'Ký thất bại');
    } finally {
      setSigningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">GOV — Ký duyệt FUN Claims</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Quy trình 3/3: Will + Wisdom + Love. Đủ 3 chữ ký → cron 30 phút tự chuyển FUN từ treasury về ví user.
            </p>
          </div>
        </div>

        {/* Connection status */}
        {!isConnected ? (
          <Card className="p-6 text-center space-y-3 border-amber-500/40 bg-amber-500/5">
            <p className="text-sm">Vui lòng kết nối ví GOV để xem và ký</p>
            <w3m-button />
          </Card>
        ) : !myAttester ? (
          <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm">
            ⚠️ Ví <code className="font-mono">{address}</code> không nằm trong danh sách GOV Attester đang hoạt động.
          </Card>
        ) : (
          <Card className={`p-4 ${GROUP_META[myGroup!].color} border`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{GROUP_META[myGroup!].emoji}</span>
              <div>
                <p className="font-semibold">Bạn đang ký với nhóm: {GROUP_META[myGroup!].label}</p>
                <p className="text-xs opacity-80">{myAttester.name} · {address?.slice(0, 6)}…{address?.slice(-4)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Claims list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Claims đang chờ duyệt</span>
              <Badge variant="outline">{claims.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || attLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p>Không có claim nào đang chờ ký 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => {
                  const completed = (claim.gov_completed_groups || []) as GovGroup[];
                  const myAlreadySigned = myGroup ? completed.includes(myGroup) : false;
                  const canSign = !!myGroup && !myAlreadySigned && signingId !== claim.id;
                  return (
                    <div key={claim.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-lg">
                              {Number(claim.amount).toLocaleString()} FUN
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {claim.epoch_id || 'no-epoch'}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {claim.gov_signatures_count}/3 chữ ký
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono break-all">
                            user: {claim.user_id.slice(0, 8)}… · ví: {claim.wallet_address.slice(0, 8)}…{claim.wallet_address.slice(-6)}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(claim.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          disabled={!canSign}
                          onClick={() => handleSign(claim)}
                          className="shrink-0"
                        >
                          {signingId === claim.id ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Đang ký…</>
                          ) : myAlreadySigned ? (
                            <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Đã ký</>
                          ) : myGroup ? (
                            <>Ký với {GROUP_META[myGroup].emoji} {myGroup.toUpperCase()}</>
                          ) : (
                            'Không phải GOV'
                          )}
                        </Button>
                      </div>

                      <Separator />

                      <div className="flex items-center gap-2 flex-wrap">
                        {(['will', 'wisdom', 'love'] as GovGroup[]).map((g) => {
                          const signed = completed.includes(g);
                          return (
                            <Badge
                              key={g}
                              variant={signed ? 'default' : 'outline'}
                              className={`text-[10px] gap-1 ${signed ? GROUP_META[g].color : 'opacity-50'}`}
                            >
                              {signed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {GROUP_META[g].emoji} {g.toUpperCase()}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="p-4 bg-muted/30 border-dashed text-xs space-y-1">
          <p className="font-semibold">📋 Quy trình</p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
            <li>Kết nối ví GOV đã đăng ký (<Link to="/gov-sign" className="underline">trang multisig cũ</Link>)</li>
            <li>Bấm "Ký" → ký EIP-191 message off-chain (không tốn gas)</li>
            <li>Đủ 3/3 nhóm → cron 30 phút tự gọi <code>transfer()</code> từ treasury</li>
            <li>User bấm Activate → Claim về ví Web3</li>
          </ol>
          <p className="pt-1">
            Treasury: <code className="font-mono">0x02D5…9a0D</code> · Token: <a href="https://bscscan.com/token/0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">FUN <ExternalLink className="w-3 h-3" /></a>
          </p>
        </Card>
      </div>
    </div>
  );
}
