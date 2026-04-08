import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ExternalLink, BarChart3, Rocket, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFunDisplay } from '@/lib/fun-money/web3-config';
import { REQUIRED_GROUPS, GOV_GROUPS } from '@/lib/fun-money/pplp-multisig-config';
import { useMintSubmit } from '@/hooks/useMintSubmit';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import type { MultisigSignatures, PPLPMintRequest } from '@/lib/fun-money/pplp-multisig-types';
import type { GovGroupName } from '@/lib/fun-money/pplp-multisig-config';

interface MintRequest {
  id: string;
  user_id: string;
  recipient_address: string;
  action_type: string;
  amount_wei: string;
  status: string;
  multisig_signatures: MultisigSignatures;
  multisig_completed_groups: GovGroupName[];
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_sig: { label: 'Chờ ký', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  signing: { label: 'Đang ký', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  signed: { label: 'Đã ký đủ', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  submitted: { label: 'Đã submit', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  confirmed: { label: 'Thành công', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  failed: { label: 'Thất bại', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

const FILTER_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'signing', label: 'Đang ký' },
  { value: 'signed', label: 'Đã ký đủ' },
  { value: 'onchain', label: 'On-chain' },
  { value: 'failed', label: 'Lỗi' },
];

export function MintProgressTracker() {
  const [requests, setRequests] = useState<MintRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { isConnected } = useWalletContext();
  const { submitMint, isSubmitting } = useMintSubmit();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pplp_mint_requests')
      .select('*')
      .order('created_at', { ascending: false });

    const rows = (data || []) as unknown as MintRequest[];
    setRequests(rows);

    // Fetch user profiles
    const userIds = [...new Set(rows.map(r => r.user_id))];
    if (userIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      const map: Record<string, UserProfile> = {};
      (pData || []).forEach(p => { map[p.id] = p as UserProfile; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('mint-progress-tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pplp_mint_requests' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const filtered = requests.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'signing') return r.status === 'pending_sig' || r.status === 'signing';
    if (filter === 'signed') return r.status === 'signed';
    if (filter === 'onchain') return r.status === 'submitted' || r.status === 'confirmed';
    if (filter === 'failed') return r.status === 'failed';
    return true;
  });

  // Stats
  const stats = {
    total: requests.length,
    signing: requests.filter(r => r.status === 'pending_sig' || r.status === 'signing').length,
    signed: requests.filter(r => r.status === 'signed').length,
    confirmed: requests.filter(r => r.status === 'confirmed').length,
    failed: requests.filter(r => r.status === 'failed').length,
  };

  const handleMintSubmit = useCallback(async (req: MintRequest) => {
    if (!isConnected) {
      toast.error('Vui lòng kết nối ví trước');
      return;
    }
    try {
      const result = await submitMint(req as unknown as PPLPMintRequest);
      toast.success(`✅ Mint thành công! TX: ${result.txHash?.slice(0, 10)}...`);
    } catch (err: any) {
      toast.error(`❌ Mint thất bại: ${err.message?.slice(0, 100)}`);
    }
  }, [isConnected, submitMint]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          📊 Lịch sử & Tiến trình Mint FUN
        </h3>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Tổng', value: stats.total, color: 'text-foreground' },
          { label: 'Đang ký', value: stats.signing, color: 'text-blue-400' },
          { label: 'Đủ 3/3', value: stats.signed, color: 'text-emerald-400' },
          { label: 'Thành công', value: stats.confirmed, color: 'text-green-300' },
          { label: 'Lỗi', value: stats.failed, color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label} className="p-2 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="w-full">
          {FILTER_TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1 text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter}>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">
              Không có request nào.
            </Card>
          ) : (
            <Table wrapperClassName="max-h-[400px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs text-right">FUN</TableHead>
                  {REQUIRED_GROUPS.map(g => (
                    <TableHead key={g} className="text-xs text-center w-12">
                      {GOV_GROUPS[g].emoji}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">TX</TableHead>
                  <TableHead className="text-xs text-center">Mint</TableHead>
                  <TableHead className="text-xs">Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(req => {
                  const sigs = (req.multisig_signatures || {}) as MultisigSignatures;
                  const completed = (req.multisig_completed_groups || []) as GovGroupName[];
                  const profile = profiles[req.user_id];
                  const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending_sig;

                  return (
                    <TableRow key={req.id}>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                              {(profile?.display_name || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium truncate max-w-[100px]">
                            {profile?.display_name || req.recipient_address.slice(0, 8) + '...'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs font-bold whitespace-nowrap">
                        {formatFunDisplay(req.amount_wei)}
                      </TableCell>
                      {REQUIRED_GROUPS.map(g => (
                        <TableCell key={g} className="py-2 text-center text-xs">
                          {completed.includes(g) ? (
                            <span className="text-emerald-400" title={sigs[g]?.signer_name}>✓</span>
                          ) : (
                            <span className="text-muted-foreground">✗</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`text-[10px] ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {req.tx_hash ? (
                          <a
                            href={`https://testnet.bscscan.com/tx/${req.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {req.tx_hash.slice(0, 6)}...
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {req.status === 'signed' ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-7 px-2"
                            onClick={() => handleMintSubmit(req)}
                            disabled={isSubmitting === req.id}
                          >
                            {isSubmitting === req.id ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Đang gửi...</>
                            ) : (
                              <><Rocket className="w-3 h-3 mr-1" />Submit TX</>
                            )}
                          </Button>
                        ) : req.status === 'submitted' ? (
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />Đang xử lý
                          </Badge>
                        ) : req.status === 'confirmed' ? (
                          <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />Thành công
                          </Badge>
                        ) : req.status === 'failed' ? (
                          <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
                            <XCircle className="w-3 h-3 mr-1" />Thất bại
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
