/**
 * FUN Money Approval Tab - Admin Dashboard
 * Redesigned: Full-width table, batch actions, expandable detail
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Search,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from 'lucide-react';
import { useAdminMintRequest } from '@/hooks/useAdminMintRequest';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { formatFunAmount } from '@/lib/fun-money/pplp-engine';
import { validateBeforeMint, mintFunMoney } from '@/lib/fun-money/contract-helpers';
import { KNOWN_ADDRESSES } from '@/lib/fun-money/web3-config';
import { cn } from '@/lib/utils';
import type { MintRequest } from '@/hooks/useFunMoneyMintRequest';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  minted: 'bg-green-500/20 text-green-500 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
  failed: 'bg-orange-500/20 text-orange-500 border-orange-500/30'
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  approved: <CheckCircle className="w-3.5 h-3.5" />,
  minted: <Coins className="w-3.5 h-3.5" />,
  rejected: <XCircle className="w-3.5 h-3.5" />,
  failed: <AlertTriangle className="w-3.5 h-3.5" />
};

export function FunMoneyApprovalTab() {
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [actionToRegister, setActionToRegister] = useState('LIGHT_ACTIVITY');
  const [isRegisteringAll, setIsRegisteringAll] = useState(false);
  const [profileCache, setProfileCache] = useState<Record<string, { display_name: string | null; avatar_url: string | null; username: string; banned?: boolean }>>({});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    loading, error, requests, pendingCount,
    fetchPendingRequests, fetchAllRequests,
    approveRequest, rejectRequest, saveMintResult, markAsFailed
  } = useAdminMintRequest();

  const {
    isConnected, address: adminAddress,
    connect: connectWallet, getSigner,
    isCorrectChain, switchToBscTestnet
  } = useFunMoneyWallet();

  const isAttesterWallet = adminAddress?.toLowerCase() === KNOWN_ADDRESSES.angelAiAttester.toLowerCase();

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingRequests();
    } else {
      fetchAllRequests(activeTab === 'all' ? undefined : activeTab, 100);
    }
    setSelectedIds(new Set());
    setExpandedId(null);
  }, [activeTab, fetchPendingRequests, fetchAllRequests]);

  // Fetch profiles for all visible requests
  useEffect(() => {
    const userIds = [...new Set(requests.map(r => r.user_id))].filter(id => !profileCache[id]);
    if (userIds.length === 0) return;
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, username, banned')
      .in('id', userIds)
      .then(({ data }) => {
        if (data) {
          setProfileCache(prev => {
            const next = { ...prev };
            data.forEach((p: any) => { next[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url, username: p.username, banned: p.banned || false }; });
            return next;
          });
        }
      });
  }, [requests]);

  // Auto-reject mint requests from banned users
  useEffect(() => {
    if (activeTab !== 'pending') return;
    const bannedPendingRequests = requests.filter(r => 
      r.status === 'pending' && profileCache[r.user_id]?.banned === true
    );
    bannedPendingRequests.forEach(async (r) => {
      await rejectRequest(r.id, 'Tự động từ chối: Tài khoản đã bị đình chỉ (banned)');
      toast.info(`🚫 Tự động từ chối yêu cầu từ user bị ban: ${profileCache[r.user_id]?.display_name || r.user_wallet_address.slice(0, 10)}`);
    });
    if (bannedPendingRequests.length > 0) {
      fetchPendingRequests();
    }
  }, [requests, profileCache, activeTab]);

  const filteredRequests = requests.filter(r => {
    // Hide banned users' requests from all tabs
    if (profileCache[r.user_id]?.banned) return false;
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return r.platform_id.toLowerCase().includes(q) ||
      r.action_type.toLowerCase().includes(q) ||
      r.user_wallet_address.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (profileCache[r.user_id]?.display_name?.toLowerCase().includes(q) ?? false);
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableIds = filteredRequests.filter(r => r.status === 'pending').map(r => r.id);
    if (selectableIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const handleApprove = async (request: MintRequest) => {
    const success = await approveRequest(request.id, 'Approved by admin');
    if (success) {
      toast.success('✅ Đã duyệt yêu cầu!');
      setExpandedId(null);
    } else {
      toast.error('Không thể duyệt yêu cầu');
    }
  };

  const handleReject = async (request: MintRequest) => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    const success = await rejectRequest(request.id, rejectReason);
    if (success) {
      toast.success('Đã từ chối yêu cầu');
      setExpandedId(null);
      setRejectReason('');
    } else {
      toast.error('Không thể từ chối yêu cầu');
    }
  };

  const handleMint = async (request: MintRequest) => {
    if (!isConnected || !adminAddress) {
      toast.error('Vui lòng kết nối ví Attester trước');
      return;
    }
    setIsMinting(true);
    try {
      // Auto-switch to BSC Testnet if needed
      if (!isCorrectChain) {
        toast.info('🔄 Đang chuyển sang BSC Testnet...');
        await switchToBscTestnet();
        // Wait a moment for chain switch to propagate
        await new Promise(r => setTimeout(r, 1500));
      }
      const signer = await getSigner();
      const provider = signer.provider as import('ethers').BrowserProvider;
      const validation = await validateBeforeMint(provider, adminAddress, request.action_type);
      if (!validation.canMint) {
        toast.error(`Không thể mint: ${validation.issues.join(', ')}`);
        return;
      }
      const txHash = await mintFunMoney(signer, request.user_wallet_address, request.action_type, BigInt(request.calculated_amount_atomic), request.action_evidence);
      const saved = await saveMintResult(request.id, txHash, adminAddress);
      if (saved) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span>✨ Mint thành công!</span>
            <a href={`https://testnet.bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
              Xem trên BSCScan →
            </a>
          </div>
        );
        setExpandedId(null);
      }
    } catch (err: any) {
      console.error('Mint error:', err);
      toast.error(`Mint thất bại: ${err.message?.slice(0, 100)}`);
      if (request.status === 'approved') {
        await markAsFailed(request.id, err.message?.slice(0, 200) || 'Lỗi không xác định');
      }
    } finally {
      setIsMinting(false);
    }
  };

  const handleApproveAndMint = async (request: MintRequest) => {
    if (!isConnected || !adminAddress || !isAttesterWallet) {
      toast.error('Vui lòng kết nối ví Attester');
      return;
    }
    const approved = await approveRequest(request.id, 'Approved & minted by admin');
    if (!approved) { toast.error('Không thể duyệt'); return; }
    await handleMint({ ...request, status: 'approved' });
  };

  // Batch approve
  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchProcessing(true);
    let success = 0, fail = 0;
    for (const id of selectedIds) {
      const ok = await approveRequest(id, 'Batch approved by admin');
      if (ok) success++; else fail++;
    }
    toast.success(`✅ Đã duyệt ${success}/${selectedIds.size} yêu cầu${fail > 0 ? ` (${fail} thất bại)` : ''}`);
    setSelectedIds(new Set());
    setIsBatchProcessing(false);
    fetchPendingRequests();
  };

  // Batch approve + mint
  const handleBatchApproveAndMint = async () => {
    if (selectedIds.size === 0 || !isConnected || !isAttesterWallet || !adminAddress) return;
    setIsBatchProcessing(true);
    // Auto-switch to BSC Testnet if needed
    if (!isCorrectChain) {
      toast.info('🔄 Đang chuyển sang BSC Testnet...');
      await switchToBscTestnet();
      await new Promise(r => setTimeout(r, 1500));
    }
    let success = 0, fail = 0;
    for (const id of selectedIds) {
      const request = requests.find(r => r.id === id);
      if (!request) { fail++; continue; }
      try {
        const approved = await approveRequest(id, 'Batch approved & minted');
        if (!approved) { fail++; continue; }
        const signer = await getSigner();
        const txHash = await mintFunMoney(signer, request.user_wallet_address, request.action_type, BigInt(request.calculated_amount_atomic), request.action_evidence);
        await saveMintResult(id, txHash, adminAddress);
        success++;
        toast.success(`✨ Mint ${success}/${selectedIds.size}: ${request.calculated_amount_formatted || formatFunAmount(request.calculated_amount_atomic)} FUN`);
      } catch (err: any) {
        fail++;
        await markAsFailed(id, err.message?.slice(0, 200) || 'Batch mint error');
        toast.error(`❌ Lỗi mint ${request.user_wallet_address.slice(0, 8)}...: ${err.message?.slice(0, 60)}`);
      }
    }
    toast.success(`🎉 Hoàn tất: ${success} thành công, ${fail} thất bại`);
    setSelectedIds(new Set());
    setIsBatchProcessing(false);
    fetchPendingRequests();
  };

  // All action types that need govRegisterAction
  const ALL_ACTIONS = [
    // FUN_PLAY
    'WATCH_VIDEO', 'LIKE_VIDEO', 'COMMENT', 'SHARE', 'UPLOAD_VIDEO', 'SIGNUP', 'WALLET_CONNECT', 'CREATE_POST',
    // ANGEL_AI
    'AI_REVIEW_HELPFUL', 'FRAUD_REPORT_VALID', 'MODERATION_HELP', 'MODEL_IMPROVEMENT',
    // FUN_PROFILE
    'CONTENT_CREATE', 'CONTENT_REVIEW', 'MENTOR_HELP', 'COMMUNITY_BUILD',
    // FUN_CHARITY
    'DONATE', 'VOLUNTEER', 'CAMPAIGN_DELIVERY_PROOF', 'IMPACT_REPORT',
    // FUN_EARTH
    'TREE_PLANT', 'CLEANUP_EVENT', 'PARTNER_VERIFIED_REPORT',
    // FUN_ACADEMY
    'LEARN_COMPLETE', 'PROJECT_SUBMIT', 'PEER_REVIEW',
    // FUN_PLANET
    'COMMUNITY_ACTION', 'SOCIAL_IMPACT', 'SUSTAINABILITY_REPORT',
    // Special
    'LIGHT_ACTIVITY',
  ];

  const handleRegisterAction = async () => {
    if (!isConnected || !actionToRegister.trim()) return;
    setIsRegistering(true);
    try {
      const signer = await getSigner();
      const { Contract } = await import('ethers');
      const { getContractAddress, FUN_MONEY_ABI } = await import('@/lib/fun-money/web3-config');
      const contract = new Contract(getContractAddress(), FUN_MONEY_ABI, signer);
      const tx = await contract.govRegisterAction(actionToRegister.trim(), 1);
      const receipt = await tx.wait();
      toast.success(`✅ Action "${actionToRegister}" đã đăng ký!`);
    } catch (err: any) {
      toast.error(`Lỗi: ${err.reason || err.message?.slice(0, 100)}`);
    } finally {
      setIsRegistering(false);
    }
  };


  const handleRegisterAllActions = async () => {
    if (!isConnected) return;
    setIsRegisteringAll(true);
    let success = 0;
    let skipped = 0;
    let failed = 0;

    try {
      const signer = await getSigner();
      const { Contract } = await import('ethers');
      const { getContractAddress, FUN_MONEY_ABI } = await import('@/lib/fun-money/web3-config');
      const contract = new Contract(getContractAddress(), FUN_MONEY_ABI, signer);

      for (const action of ALL_ACTIONS) {
        try {
          toast.info(`⏳ Đăng ký ${action} (${success + skipped + failed + 1}/${ALL_ACTIONS.length})...`);
          const tx = await contract.govRegisterAction(action, 1);
          await tx.wait();
          success++;
          toast.success(`✅ ${action} đã đăng ký! (${success}/${ALL_ACTIONS.length})`);
        } catch (err: any) {
          const msg = err.reason || err.message || '';
          if (msg.includes('already') || msg.includes('registered') || msg.includes('ACTION_EXISTS')) {
            skipped++;
            toast.info(`⏭️ ${action} đã tồn tại, bỏ qua.`);
          } else {
            failed++;
            toast.error(`❌ ${action}: ${msg.slice(0, 80)}`);
          }
        }
      }

      toast.success(`🎉 Hoàn tất: ${success} đăng ký, ${skipped} đã tồn tại, ${failed} lỗi`);
    } catch (err: any) {
      toast.error(`Lỗi kết nối: ${err.reason || err.message?.slice(0, 100)}`);
    } finally {
      setIsRegisteringAll(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const selectableCount = filteredRequests.filter(r => r.status === 'pending').length;
  const allSelected = selectableCount > 0 && filteredRequests.filter(r => r.status === 'pending').every(r => selectedIds.has(r.id));

  return (
    <div className="space-y-4">
      {/* Top Bar: Wallet + Stats */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Pending Count */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <Clock className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-bold">{pendingCount}</span>
          <span className="text-xs text-muted-foreground">Chờ duyệt</span>
        </div>

        {/* Wallet Status */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border",
          isConnected && isAttesterWallet
            ? "bg-green-500/10 border-green-500/20"
            : isConnected
            ? "bg-yellow-500/10 border-yellow-500/20"
            : "bg-red-500/10 border-red-500/20"
        )}>
          <Wallet className={cn(
            "w-4 h-4",
            isConnected && isAttesterWallet ? "text-green-500" : isConnected ? "text-yellow-500" : "text-red-500"
          )} />
          <span className="text-xs font-medium">
            {isConnected
              ? isAttesterWallet
                ? `✅ Attester ${adminAddress?.slice(0, 6)}...${adminAddress?.slice(-4)}`
                : `⚠️ Sai ví (cần ${KNOWN_ADDRESSES.angelAiAttester.slice(0, 6)}...)`
              : 'Chưa kết nối ví'}
          </span>
          {!isConnected && (
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={connectWallet}>
              Kết nối
            </Button>
          )}
        </div>

        {/* Register Action (compact) */}
        {isConnected && (
          <div className="flex items-center gap-1 ml-auto">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <Input
              value={actionToRegister}
              onChange={(e) => setActionToRegister(e.target.value)}
              placeholder="Action name"
              className="h-8 w-36 font-mono text-xs"
            />
            <Button size="sm" className="h-8 gap-1" onClick={handleRegisterAction} disabled={isRegistering}>
              {isRegistering ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Register
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 gap-1 text-xs border-primary/30" 
              onClick={handleRegisterAllActions} 
              disabled={isRegisteringAll}
            >
              {isRegisteringAll ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
              Register All ({ALL_ACTIONS.length})
            </Button>
          </div>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-1 text-xs">
              <Clock className="w-3 h-3" />
              Chờ duyệt
              {pendingCount > 0 && <Badge variant="destructive" className="h-4 px-1 text-[10px] ml-1">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">Đã duyệt</TabsTrigger>
            <TabsTrigger value="minted" className="text-xs">Đã mint</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">Từ chối</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">Tất cả</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 w-full sm:max-w-xs ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <Button variant="ghost" size="sm" className="h-8" onClick={() => activeTab === 'pending' ? fetchPendingRequests() : fetchAllRequests()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <ListChecks className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Đã chọn {selectedIds.size} yêu cầu</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs"
              onClick={handleBatchApprove}
              disabled={isBatchProcessing}
            >
              {isBatchProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Duyệt tất cả
            </Button>
            {isConnected && isAttesterWallet && (
              <Button
                size="sm"
                className="h-8 gap-1 text-xs bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                onClick={handleBatchApproveAndMint}
                disabled={isBatchProcessing}
              >
                {isBatchProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                ⚡ Duyệt & Mint tất cả
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setSelectedIds(new Set())}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {/* Request Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Không tìm thấy yêu cầu nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === 'pending' && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead className="text-xs">Người nhận</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs text-right">Số FUN</TableHead>
                  <TableHead className="text-xs text-center">Trạng thái</TableHead>
                  <TableHead className="text-xs text-center">Điểm</TableHead>
                  <TableHead className="text-xs">Thời gian</TableHead>
                  <TableHead className="text-xs text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <RequestTableRow
                    key={request.id}
                    request={request}
                    isExpanded={expandedId === request.id}
                    isSelected={selectedIds.has(request.id)}
                    showCheckbox={activeTab === 'pending'}
                    isConnected={isConnected}
                    isAttesterWallet={isAttesterWallet}
                    isMinting={isMinting}
                    isBatchProcessing={isBatchProcessing}
                    rejectReason={rejectReason}
                    onToggleExpand={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    onToggleSelect={() => toggleSelect(request.id)}
                    onApprove={() => handleApprove(request)}
                    onReject={() => handleReject(request)}
                    onMint={() => handleMint(request)}
                    onApproveAndMint={() => handleApproveAndMint(request)}
                    onRejectReasonChange={setRejectReason}
                    onCopy={copyToClipboard}
                    profile={profileCache[request.user_id]}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// ===== Table Row with expandable detail =====
function RequestTableRow({
  request, isExpanded, isSelected, showCheckbox,
  isConnected, isAttesterWallet, isMinting, isBatchProcessing,
  rejectReason, profile,
  onToggleExpand, onToggleSelect,
  onApprove, onReject, onMint, onApproveAndMint,
  onRejectReasonChange, onCopy
}: {
  request: MintRequest;
  isExpanded: boolean;
  isSelected: boolean;
  showCheckbox: boolean;
  isConnected: boolean;
  isAttesterWallet: boolean;
  isMinting: boolean;
  isBatchProcessing: boolean;
  rejectReason: string;
  profile?: { display_name: string | null; avatar_url: string | null; username: string; banned?: boolean };
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMint: () => void;
  onApproveAndMint: () => void;
  onRejectReasonChange: (v: string) => void;
  onCopy: (t: string) => void;
}) {
  const pillarScores = request.pillar_scores as { S: number; T: number; H: number; C: number; U: number };
  const unitySignals = request.unity_signals as Record<string, boolean> | null;
  const colSpan = showCheckbox ? 8 : 7;
  const displayName = profile?.display_name || profile?.username || 'Unknown';
  const walletShort = `${request.user_wallet_address.slice(0, 6)}...${request.user_wallet_address.slice(-4)}`;

  return (
    <>
      <TableRow className={cn(
        "cursor-pointer transition-colors",
        isExpanded && "bg-accent/50",
        isSelected && "bg-primary/5"
      )}>
        {showCheckbox && (
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
          </TableCell>
        )}
        <TableCell onClick={onToggleExpand}>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 shrink-0">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate max-w-[140px]">{displayName}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{walletShort}</span>
            </div>
          </div>
        </TableCell>
        <TableCell onClick={onToggleExpand}>
          <div className="flex flex-col gap-0.5">
            <Badge variant="outline" className="text-[10px] w-fit">{request.platform_id}</Badge>
            <span className="text-xs font-medium">{request.action_type}</span>
          </div>
        </TableCell>
        <TableCell onClick={onToggleExpand} className="text-right">
          <span className="font-bold text-primary">
            {request.calculated_amount_formatted || formatFunAmount(request.calculated_amount_atomic)}
          </span>
        </TableCell>
        <TableCell onClick={onToggleExpand} className="text-center">
          <Badge className={cn("gap-1 text-[10px]", STATUS_COLORS[request.status])}>
            {STATUS_ICONS[request.status]}
            {request.status}
          </Badge>
        </TableCell>
        <TableCell onClick={onToggleExpand} className="text-center">
          <span className="text-xs">{request.light_score}</span>
        </TableCell>
        <TableCell onClick={onToggleExpand}>
          <span className="text-xs text-muted-foreground">
            {new Date(request.created_at).toLocaleDateString('vi-VN')}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            {/* Quick actions for pending */}
            {request.status === 'pending' && (
              <>
                {isConnected && isAttesterWallet && (
                  <Button
                    size="sm"
                    className="h-7 px-2 text-[10px] gap-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                    onClick={(e) => { e.stopPropagation(); onApproveAndMint(); }}
                    disabled={isMinting || isBatchProcessing}
                  >
                    <Zap className="w-3 h-3" />
                    Mint
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-[10px] gap-1"
                  onClick={(e) => { e.stopPropagation(); onApprove(); }}
                  disabled={isBatchProcessing}
                >
                  <CheckCircle className="w-3 h-3" />
                  Duyệt
                </Button>
              </>
            )}
            {request.status === 'approved' && isConnected && isAttesterWallet && (
              <Button
                size="sm"
                className="h-7 px-2 text-[10px] gap-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                onClick={(e) => { e.stopPropagation(); onMint(); }}
                disabled={isMinting}
              >
                <Zap className="w-3 h-3" />
                Mint
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={onToggleExpand}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Detail */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={colSpan} className="bg-accent/30 p-0">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Amount + Wallet */}
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg text-center">
                    <p className="text-2xl font-black text-primary">
                      {request.calculated_amount_formatted || formatFunAmount(request.calculated_amount_atomic)}
                    </p>
                    <p className="text-xs text-muted-foreground">Base: {formatFunAmount(request.base_reward_atomic)}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Ví người nhận</label>
                    <div className="flex items-center gap-1 mt-1">
                      <code className="flex-1 p-1.5 bg-muted rounded text-xs truncate">{request.user_wallet_address}</code>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onCopy(request.user_wallet_address)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {request.tx_hash && (
                    <a href={`https://testnet.bscscan.com/tx/${request.tx_hash}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:underline text-xs">
                      <ExternalLink className="w-3 h-3" /> Xem trên BSCScan
                    </a>
                  )}
                  {request.decision_reason && ['rejected', 'failed'].includes(request.status) && (
                    <div className="p-2 bg-destructive/10 rounded text-xs">
                      <span className="text-muted-foreground">Lý do: </span>{request.decision_reason}
                    </div>
                  )}
                </div>

                {/* Pillar Scores + Multipliers */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">5 Trụ cột</label>
                    <div className="space-y-1.5 mt-1">
                      {Object.entries(pillarScores).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="w-4 text-[10px] font-bold">{key}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", value >= 70 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500")}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="w-6 text-[10px] text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Hệ số nhân</label>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {[
                        { k: 'Q', v: request.multiplier_q },
                        { k: 'I', v: request.multiplier_i },
                        { k: 'K', v: request.multiplier_k },
                        { k: 'Ux', v: request.multiplier_ux }
                      ].map(({ k, v }) => (
                        <div key={k} className="p-1.5 bg-muted/50 rounded text-center">
                          <p className="font-bold text-sm">{Number(v).toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">{k}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="p-1.5 bg-muted/50 rounded text-center flex-1">
                      <p className="font-bold text-sm">{request.light_score}</p>
                      <p className="text-[10px] text-muted-foreground">Light</p>
                    </div>
                    <div className="p-1.5 bg-muted/50 rounded text-center flex-1">
                      <p className="font-bold text-sm">{request.unity_score}</p>
                      <p className="text-[10px] text-muted-foreground">Unity</p>
                    </div>
                  </div>
                  {unitySignals && Object.keys(unitySignals).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(unitySignals).map(([key, val]) => val && (
                        <Badge key={key} variant="outline" className="text-[10px]">✓ {key}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {request.status === 'pending' && (
                    <>
                      {isConnected && isAttesterWallet && (
                        <Button
                          className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                          onClick={onApproveAndMint}
                          disabled={isMinting}
                        >
                          {isMinting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang mint...</> : <><Zap className="w-4 h-4" /> ⚡ Duyệt & Mint Ngay</>}
                        </Button>
                      )}
                      <Button variant="outline" className="w-full gap-2" onClick={onApprove}>
                        <CheckCircle className="w-4 h-4" /> Chỉ Duyệt (mint sau)
                      </Button>
                      <Textarea
                        placeholder="Lý do từ chối (bắt buộc)"
                        value={rejectReason}
                        onChange={(e) => onRejectReasonChange(e.target.value)}
                        className="resize-none text-xs"
                        rows={2}
                      />
                      <Button variant="destructive" className="w-full gap-2" onClick={onReject}>
                        <XCircle className="w-4 h-4" /> Từ chối
                      </Button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <>
                      <Button
                        className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                        onClick={onMint}
                        disabled={!isConnected || !isAttesterWallet || isMinting}
                      >
                        {isMinting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang mint...</> : <><Zap className="w-4 h-4" /> Ký & Mint On-Chain</>}
                      </Button>
                      {!isConnected && <p className="text-xs text-center text-muted-foreground">Kết nối ví Attester để mint</p>}
                      {isConnected && !isAttesterWallet && <p className="text-xs text-center text-yellow-500">⚠️ Cần ví Attester</p>}
                    </>
                  )}
                  {request.status === 'minted' && (
                    <div className="text-center py-4 text-green-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Đã mint thành công</p>
                    </div>
                  )}
                  {request.status === 'rejected' && (
                    <div className="text-center py-4 text-red-500">
                      <XCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Đã từ chối</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
