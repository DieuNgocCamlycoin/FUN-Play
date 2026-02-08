/**
 * FUN Money Approval Tab - Admin Dashboard
 * Phase 2A: Admin Approval Panel with EIP-712 signing
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Coins, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Wallet,
  ExternalLink,
  Copy,
  RefreshCw,
  Filter,
  Search,
  Zap,
  Shield,
  User,
  FileText
} from 'lucide-react';
import { useAdminMintRequest } from '@/hooks/useAdminMintRequest';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { formatFunAmount } from '@/lib/fun-money/pplp-engine';
import { validateBeforeMint, mintFunMoney } from '@/lib/fun-money/contract-helpers';
import { cn } from '@/lib/utils';
import type { MintRequest } from '@/hooks/useFunMoneyMintRequest';

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  minted: 'bg-green-500/20 text-green-500 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
  failed: 'bg-orange-500/20 text-orange-500 border-orange-500/30'
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  minted: <Coins className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  failed: <AlertTriangle className="w-4 h-4" />
};

export function FunMoneyApprovalTab() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<MintRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  const { 
    loading, 
    error, 
    requests, 
    pendingCount,
    fetchPendingRequests,
    fetchAllRequests,
    approveRequest,
    rejectRequest,
    saveMintResult,
    markAsFailed
  } = useAdminMintRequest();

  const { 
    isConnected, 
    address: adminAddress, 
    connect: connectWallet,
    signer,
    provider
  } = useFunMoneyWallet();

  // Fetch data on tab change
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingRequests();
    } else {
      fetchAllRequests(activeTab === 'all' ? undefined : activeTab, 100);
    }
  }, [activeTab, fetchPendingRequests, fetchAllRequests]);

  // Filter requests by search
  const filteredRequests = requests.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.platform_id.toLowerCase().includes(query) ||
      r.action_type.toLowerCase().includes(query) ||
      r.user_wallet_address.toLowerCase().includes(query) ||
      r.id.toLowerCase().includes(query)
    );
  });

  // Handle approve
  const handleApprove = async (request: MintRequest) => {
    const success = await approveRequest(request.id, 'Approved by admin');
    if (success) {
      toast.success('Đã duyệt yêu cầu! Sẵn sàng mint.');
      setSelectedRequest(null);
    } else {
      toast.error('Không thể duyệt yêu cầu');
    }
  };

  // Handle reject
  const handleReject = async (request: MintRequest) => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    const success = await rejectRequest(request.id, rejectReason);
    if (success) {
      toast.success('Đã từ chối yêu cầu');
      setSelectedRequest(null);
      setRejectReason('');
    } else {
      toast.error('Không thể từ chối yêu cầu');
    }
  };

  // Handle mint (EIP-712 signing + on-chain)
  const handleMint = async (request: MintRequest) => {
    if (!isConnected || !signer || !provider || !adminAddress) {
      toast.error('Vui lòng kết nối ví trước');
      return;
    }

    setIsMinting(true);

    try {
      // 1. Validate before minting
      const validation = await validateBeforeMint(
        provider,
        adminAddress,
        request.action_type
      );

      if (!validation.canMint) {
        toast.error(`Không thể mint: ${validation.issues.join(', ')}`);
        setIsMinting(false);
        return;
      }

      // 2. Execute mint
      const txHash = await mintFunMoney(
        signer,
        request.user_wallet_address,
        request.action_type,
        BigInt(request.calculated_amount_atomic),
        request.action_evidence
      );

      // 3. Save result to database
      const saved = await saveMintResult(request.id, txHash, adminAddress);
      
      if (saved) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span>✨ Mint thành công!</span>
            <a 
              href={`https://testnet.bscscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline"
            >
              Xem trên BSCScan →
            </a>
          </div>
        );
        setSelectedRequest(null);
      }

    } catch (err: any) {
      console.error('Mint error:', err);
      toast.error(`Mint thất bại: ${err.message?.slice(0, 100)}`);
      
      // Mark as failed if it was an on-chain error
      if (request.status === 'approved') {
        await markAsFailed(request.id, err.message?.slice(0, 200) || 'Lỗi không xác định');
      }
    } finally {
      setIsMinting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Chờ duyệt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Coins className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'minted').length}
                </p>
                <p className="text-xs text-muted-foreground">Đã mint</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isConnected ? "bg-green-500/20" : "bg-red-500/20"
                )}>
                  <Wallet className={cn(
                    "w-5 h-5",
                    isConnected ? "text-green-500" : "text-red-500"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isConnected ? 'Ví đã kết nối' : 'Ví chưa kết nối'}
                  </p>
                  {adminAddress && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {adminAddress.slice(0, 6)}...{adminAddress.slice(-4)}
                    </p>
                  )}
                </div>
              </div>
              {!isConnected && (
                <Button size="sm" onClick={connectWallet}>
                  Kết nối
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Yêu cầu FUN Money
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => activeTab === 'pending' ? fetchPendingRequests() : fetchAllRequests()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="pending" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Chờ duyệt
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
                <TabsTrigger value="minted">Đã mint</TabsTrigger>
                <TabsTrigger value="rejected">Từ chối</TabsTrigger>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo nền tảng, hành động, ví..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Không tìm thấy yêu cầu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      isSelected={selectedRequest?.id === request.id}
                      onSelect={() => setSelectedRequest(request)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chi tiết yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRequest ? (
              <RequestDetailPanel
                request={selectedRequest}
                isConnected={isConnected}
                isMinting={isMinting}
                rejectReason={rejectReason}
                onRejectReasonChange={setRejectReason}
                onApprove={() => handleApprove(selectedRequest)}
                onReject={() => handleReject(selectedRequest)}
                onMint={() => handleMint(selectedRequest)}
                onCopy={copyToClipboard}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chọn một yêu cầu để xem chi tiết</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}
    </div>
  );
}

// Request Card Component
function RequestCard({ 
  request, 
  isSelected, 
  onSelect 
}: { 
  request: MintRequest;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const pillarScores = request.pillar_scores as { S: number; T: number; H: number; C: number; U: number };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-4 rounded-lg border cursor-pointer transition-all",
        isSelected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50 hover:bg-accent/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {request.platform_id}
            </Badge>
            <Badge className={cn("gap-1", STATUS_COLORS[request.status])}>
              {STATUS_ICONS[request.status]}
              {request.status}
            </Badge>
          </div>
          <p className="font-medium truncate">{request.action_type}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {request.user_wallet_address}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-primary">
            {request.calculated_amount_formatted || formatFunAmount(request.calculated_amount_atomic)}
          </p>
          <p className="text-xs text-muted-foreground">
            AS: {request.light_score}
          </p>
        </div>
      </div>

      {/* Mini Pillar Visualization */}
      <div className="flex gap-1 mt-3">
        {Object.entries(pillarScores).map(([key, value]) => (
          <div key={key} className="flex-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                style={{ width: `${value}%` }}
              />
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-0.5">
              {key}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Request Detail Panel Component
function RequestDetailPanel({
  request,
  isConnected,
  isMinting,
  rejectReason,
  onRejectReasonChange,
  onApprove,
  onReject,
  onMint,
  onCopy
}: {
  request: MintRequest;
  isConnected: boolean;
  isMinting: boolean;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onMint: () => void;
  onCopy: (text: string) => void;
}) {
  const pillarScores = request.pillar_scores as { S: number; T: number; H: number; C: number; U: number };
  const unitySignals = request.unity_signals as Record<string, boolean> | null;

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge className={cn("gap-1", STATUS_COLORS[request.status])}>
            {STATUS_ICONS[request.status]}
            {request.status.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(request.created_at).toLocaleString('vi-VN')}
          </span>
        </div>

        {/* Amount */}
        <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg text-center">
          <p className="text-3xl font-black text-primary">
            {request.calculated_amount_formatted || formatFunAmount(request.calculated_amount_atomic)}
          </p>
          <p className="text-sm text-muted-foreground">
            Base: {formatFunAmount(request.base_reward_atomic)}
          </p>
        </div>

        {/* Wallet */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ví người nhận</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded text-xs truncate">
              {request.user_wallet_address}
            </code>
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => onCopy(request.user_wallet_address)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Platform & Action */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Nền tảng</label>
            <p className="font-medium">{request.platform_id}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Hành động</label>
            <p className="font-medium">{request.action_type}</p>
          </div>
        </div>

        {/* Scores */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Điểm PPLP</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted/50 rounded text-center">
              <p className="text-lg font-bold">{request.light_score}</p>
              <p className="text-xs text-muted-foreground">Điểm Ánh Sáng</p>
            </div>
            <div className="p-2 bg-muted/50 rounded text-center">
              <p className="text-lg font-bold">{request.unity_score}</p>
              <p className="text-xs text-muted-foreground">Điểm Đoàn Kết</p>
            </div>
          </div>
        </div>

        {/* Pillar Breakdown */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">5 Trụ cột</label>
          <div className="space-y-2">
            {Object.entries(pillarScores).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-6 text-xs font-medium">{key}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full",
                      value >= 70 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Multipliers */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Hệ số nhân</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'Q', value: request.multiplier_q, label: 'Chất lượng' },
              { key: 'I', value: request.multiplier_i, label: 'Tác động' },
              { key: 'K', value: request.multiplier_k, label: 'Liêm chính' },
              { key: 'Ux', value: request.multiplier_ux, label: 'Đoàn kết' }
            ].map(({ key, value, label }) => (
              <div key={key} className="p-2 bg-muted/50 rounded text-center">
                <p className="font-bold">{Number(value).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">{key}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Unity Signals */}
        {unitySignals && Object.keys(unitySignals).length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Tín hiệu Đoàn kết</label>
            <div className="flex flex-wrap gap-1">
              {Object.entries(unitySignals).map(([key, value]) => (
                value && (
                  <Badge key={key} variant="outline" className="text-xs">
                    ✓ {key}
                  </Badge>
                )
              ))}
            </div>
          </div>
        )}

        {/* Tx Hash (if minted) */}
        {request.tx_hash && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Giao dịch</label>
            <a
              href={`https://testnet.bscscan.com/tx/${request.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:underline text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Xem trên BSCScan
            </a>
          </div>
        )}

        {/* Decision Reason (if rejected/failed) */}
        {request.decision_reason && ['rejected', 'failed'].includes(request.status) && (
          <div className="p-3 bg-destructive/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Lý do</p>
            <p className="text-sm">{request.decision_reason}</p>
          </div>
        )}

        {/* Actions */}
        {request.status === 'pending' && (
          <div className="space-y-3 pt-4 border-t">
            <Button 
              className="w-full gap-2" 
              onClick={onApprove}
            >
              <CheckCircle className="w-4 h-4" />
              Duyệt yêu cầu
            </Button>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Lý do từ chối (bắt buộc)"
                value={rejectReason}
                onChange={(e) => onRejectReasonChange(e.target.value)}
                className="resize-none"
                rows={2}
              />
              <Button 
                variant="destructive" 
                className="w-full gap-2"
                onClick={onReject}
              >
                <XCircle className="w-4 h-4" />
                Từ chối yêu cầu
              </Button>
            </div>
          </div>
        )}

        {request.status === 'approved' && (
          <div className="pt-4 border-t">
            <Button 
              className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600" 
              onClick={onMint}
              disabled={!isConnected || isMinting}
            >
              {isMinting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang mint...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Ký & Mint On-Chain
                </>
              )}
            </Button>
            {!isConnected && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Kết nối ví để mint
              </p>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
