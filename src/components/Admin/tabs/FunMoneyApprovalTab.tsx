/**
 * FUN Money Approval Tab - Admin Dashboard
 * Redesigned: Full-width table, batch actions, expandable detail
 */

import { useState, useEffect, useCallback } from 'react';
import { MintProgressTracker } from '@/components/Multisig/MintProgressTracker';
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
import { CONTRACT_ACTION } from '@/lib/fun-money/contract-helpers';
import { KNOWN_ADDRESSES } from '@/lib/fun-money/web3-config';
import { createMultisigRequest, createConsolidatedMultisigRequests } from '@/lib/fun-money/pplp-multisig-helpers';
import type { MintRequestForMultisig } from '@/lib/fun-money/pplp-multisig-helpers';
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
  const [routedIds, setRoutedIds] = useState<Set<string>>(new Set());
  
  const [profileCache, setProfileCache] = useState<Record<string, { display_name: string | null; avatar_url: string | null; username: string; banned?: boolean; wallet_address?: string | null }>>({});

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

  // Pre-populate routedIds from pplp_mint_requests to persist across reloads
  useEffect(() => {
    const loadRoutedIds = async () => {
      const requestIds = requests.map(r => r.id);
      if (requestIds.length === 0) return;
      
      // Check which requests have decision_reason indicating routing
      const alreadyRouted = requests
        .filter(r => r.decision_reason?.includes('pplp_mint_requests') || r.decision_reason?.includes('Multisig'))
        .map(r => r.id);
      
      // Also check pplp_mint_requests table for source_mint_request_id matches
      const { data: multisigRecords } = await supabase
        .from('pplp_mint_requests')
        .select('source_mint_request_id')
        .in('source_mint_request_id', requestIds);
      
      const fromDb = (multisigRecords || []).map((m: any) => m.source_mint_request_id).filter(Boolean);
      
      const allRouted = new Set([...alreadyRouted, ...fromDb]);
      if (allRouted.size > 0) {
        setRoutedIds(prev => {
          const next = new Set(prev);
          allRouted.forEach(id => next.add(id));
          return next;
        });
      }
    };
    loadRoutedIds();
  }, [requests]);

  // Fetch profiles for all visible requests
  useEffect(() => {
    const userIds = [...new Set(requests.map(r => r.user_id))].filter(id => !profileCache[id]);
    if (userIds.length === 0) return;
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, username, banned, wallet_address')
      .in('id', userIds)
      .then(({ data }) => {
        if (data) {
          setProfileCache(prev => {
            const next = { ...prev };
            data.forEach((p: any) => { next[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url, username: p.username, banned: p.banned || false, wallet_address: p.wallet_address }; });
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

  const handleRouteToMultisig = async (request: MintRequest) => {
    if (!isConnected || !adminAddress) {
      toast.error('Vui lòng kết nối ví trước để đọc nonce on-chain');
      return;
    }
    setIsMinting(true);
    try {
      // Auto-switch to BSC Testnet if needed
      if (!isCorrectChain) {
        toast.info('🔄 Đang chuyển sang BSC Testnet...');
        await switchToBscTestnet();
        await new Promise(r => setTimeout(r, 1500));
      }
      const signer = await getSigner();
      const provider = signer.provider as import('ethers').BrowserProvider;

      // Wallet mismatch check
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', request.user_id)
        .single();

      if (currentProfile?.wallet_address && 
          currentProfile.wallet_address.toLowerCase() !== request.user_wallet_address.toLowerCase()) {
        const proceed = window.confirm(
          `⚠️ CẢNH BÁO: Ví không khớp!\n\n` +
          `Ví trong yêu cầu: ${request.user_wallet_address}\n` +
          `Ví hiện tại: ${currentProfile.wallet_address}\n\n` +
          `User có thể đã đổi ví sau khi tạo yêu cầu.\nBạn có muốn tiếp tục không?`
        );
        if (!proceed) {
          toast.warning('Đã hủy do ví không khớp');
          return;
        }
      }

      const multisigRecord = await createMultisigRequest({
        mintRequest: {
          id: request.id,
          user_id: request.user_id,
          user_wallet_address: request.user_wallet_address,
          action_type: request.action_type,
          calculated_amount_atomic: request.calculated_amount_atomic,
          calculated_amount_formatted: request.calculated_amount_formatted,
          action_evidence: request.action_evidence,
          platform_id: request.platform_id,
        },
        provider,
      });

      toast.success(
        <div className="flex flex-col gap-1">
          <span>✅ Đã chuyển sang Multisig 3/3</span>
          <span className="text-xs text-muted-foreground">
            Chờ 3 nhóm GOV (WILL + WISDOM + LOVE) ký. ID: {multisigRecord.id.slice(0, 8)}...
          </span>
        </div>
      );
      setRoutedIds(prev => new Set(prev).add(request.id));
      setExpandedId(null);
      // Refresh list
      if (activeTab === 'pending') fetchPendingRequests();
      else fetchAllRequests();
    } catch (err: any) {
      console.error('Route to multisig error:', err);
      toast.error(`Lỗi chuyển Multisig: ${err.message?.slice(0, 100)}`);
    } finally {
      setIsMinting(false);
    }
  };

  const handleApproveAndRouteToMultisig = async (request: MintRequest) => {
    if (!isConnected || !adminAddress) {
      toast.error('Vui lòng kết nối ví để đọc nonce on-chain');
      return;
    }
    await handleRouteToMultisig(request);
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

  // Approve ALL pending (no selection needed)
  const handleApproveAll = async () => {
    const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
    if (pendingRequests.length === 0) { toast.info('Không có yêu cầu nào chờ duyệt'); return; }
    
    // Auto-reject 0 FUN requests
    const zeroFunRequests = pendingRequests.filter(r => !r.calculated_amount_atomic || r.calculated_amount_atomic === '0' || r.calculated_amount_atomic === '');
    const validRequests = pendingRequests.filter(r => r.calculated_amount_atomic && r.calculated_amount_atomic !== '0' && r.calculated_amount_atomic !== '');
    
    if (!window.confirm(`Duyệt ${validRequests.length} yêu cầu hợp lệ${zeroFunRequests.length > 0 ? ` và từ chối ${zeroFunRequests.length} yêu cầu 0 FUN` : ''}?`)) return;
    setIsBatchProcessing(true);
    let success = 0, fail = 0, rejected = 0;
    
    // Auto-reject 0 FUN
    for (const r of zeroFunRequests) {
      const ok = await rejectRequest(r.id, '0 FUN — Tự động từ chối');
      if (ok) rejected++; else fail++;
    }
    
    // Approve valid requests
    for (const r of validRequests) {
      const ok = await approveRequest(r.id, 'Batch approved all by admin');
      if (ok) success++; else fail++;
    }
    toast.success(`✅ Đã duyệt ${success} yêu cầu${rejected > 0 ? `, từ chối ${rejected} (0 FUN)` : ''}${fail > 0 ? `, ${fail} thất bại` : ''}`);
    setSelectedIds(new Set());
    setIsBatchProcessing(false);
    fetchPendingRequests();
  };

  // Approve ALL + route to multisig — CONSOLIDATED per user (1 multisig per user)
  const handleApproveAllAndRoute = async () => {
    const pendingRequests = filteredRequests.filter(r => r.status === 'pending' && r.calculated_amount_atomic !== '0' && r.calculated_amount_atomic !== '');
    if (pendingRequests.length === 0 || !isConnected || !adminAddress) return;
    
    // Count unique users
    const uniqueUsers = new Set(pendingRequests.map(r => r.user_id));
    if (!window.confirm(
      `Gom ${pendingRequests.length} yêu cầu → ${uniqueUsers.size} lệnh Multisig 3/3 (1 per user).\nTiếp tục?`
    )) return;
    
    setIsBatchProcessing(true);
    if (!isCorrectChain) {
      toast.info('🔄 Đang chuyển sang BSC Testnet...');
      await switchToBscTestnet();
      await new Promise(r => setTimeout(r, 1500));
    }
    
    try {
      const signer = await getSigner();
      const provider = signer.provider as import('ethers').BrowserProvider;
      
      const mintRequests: MintRequestForMultisig[] = pendingRequests.map(r => ({
        id: r.id, user_id: r.user_id, user_wallet_address: r.user_wallet_address,
        action_type: r.action_type, calculated_amount_atomic: r.calculated_amount_atomic,
        calculated_amount_formatted: r.calculated_amount_formatted,
        action_evidence: r.action_evidence, platform_id: r.platform_id,
      }));
      
      const result = await createConsolidatedMultisigRequests(mintRequests, provider);
      
      result.details.forEach(d => toast.info(d));
      toast.success(`🎉 Hoàn tất: ${result.success} users → Multisig, ${result.fail} thất bại`);
    } catch (err: any) {
      toast.error(`❌ Lỗi: ${err.message?.slice(0, 80)}`);
    }
    
    setSelectedIds(new Set());
    setIsBatchProcessing(false);
    fetchPendingRequests();
  };

  // Batch approve + route to multisig — CONSOLIDATED per user
  const handleBatchApproveAndRoute = async () => {
    if (selectedIds.size === 0 || !isConnected || !adminAddress) return;
    setIsBatchProcessing(true);
    if (!isCorrectChain) {
      toast.info('🔄 Đang chuyển sang BSC Testnet...');
      await switchToBscTestnet();
      await new Promise(r => setTimeout(r, 1500));
    }
    try {
      const signer = await getSigner();
      const provider = signer.provider as import('ethers').BrowserProvider;
      
      const selectedRequests = requests.filter(r => selectedIds.has(r.id) && r.calculated_amount_atomic !== '0' && r.calculated_amount_atomic !== '');
      const mintRequests: MintRequestForMultisig[] = selectedRequests.map(r => ({
        id: r.id, user_id: r.user_id, user_wallet_address: r.user_wallet_address,
        action_type: r.action_type, calculated_amount_atomic: r.calculated_amount_atomic,
        calculated_amount_formatted: r.calculated_amount_formatted,
        action_evidence: r.action_evidence, platform_id: r.platform_id,
      }));
      
      const result = await createConsolidatedMultisigRequests(mintRequests, provider);
      result.details.forEach(d => toast.info(d));
      toast.success(`🎉 Hoàn tất: ${result.success} users → Multisig, ${result.fail} thất bại`);
    } catch (err: any) {
      toast.error(`❌ Lỗi: ${err.message?.slice(0, 80)}`);
    }
    setSelectedIds(new Set());
    setIsBatchProcessing(false);
    fetchPendingRequests();
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

        {/* Attester info */}
        {isConnected && isAttesterWallet && (
          <div className="flex items-center gap-1 ml-auto">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-xs font-mono text-muted-foreground">Attester • {CONTRACT_ACTION}</span>
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

      {/* Always-visible Approve All buttons for pending tab */}
      {activeTab === 'pending' && selectableCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">{selectableCount} yêu cầu chờ duyệt</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs border-green-500/30 hover:bg-green-500/10"
              onClick={handleApproveAll}
              disabled={isBatchProcessing}
            >
              {isBatchProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 text-green-500" />}
              ✅ Duyệt tất cả ({selectableCount})
            </Button>
            {isConnected && (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                onClick={handleApproveAllAndRoute}
                disabled={isBatchProcessing}
              >
                {isBatchProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                🔐 Multisig 3/3 tất cả ({selectableCount})
              </Button>
            )}
          </div>
        </div>
      )}

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
            {isConnected && (
              <Button
                size="sm"
                className="h-8 gap-1 text-xs bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                onClick={handleBatchApproveAndRoute}
                disabled={isBatchProcessing}
              >
                {isBatchProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                🔐 Chuyển Multisig 3/3 tất cả
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
                    hasMultisig={routedIds.has(request.id) || (request.status === 'approved' && !!request.decision_reason?.includes('pplp_mint_requests'))}
                    onToggleExpand={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    onToggleSelect={() => toggleSelect(request.id)}
                    onApprove={() => handleApprove(request)}
                    onReject={() => handleReject(request)}
                    onRouteToMultisig={() => handleRouteToMultisig(request)}
                    onApproveAndRoute={() => handleApproveAndRouteToMultisig(request)}
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

      {/* Bảng thống kê toàn bộ tiến trình Mint */}
      <div className="border-t pt-6 mt-6">
        <MintProgressTracker />
      </div>
    </div>
  );
}

// ===== Table Row with expandable detail =====
function RequestTableRow({
  request, isExpanded, isSelected, showCheckbox,
  isConnected, isAttesterWallet, isMinting, isBatchProcessing,
  rejectReason, profile, hasMultisig,
  onToggleExpand, onToggleSelect,
  onApprove, onReject, onRouteToMultisig, onApproveAndRoute,
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
  profile?: { display_name: string | null; avatar_url: string | null; username: string; banned?: boolean; wallet_address?: string | null };
  hasMultisig: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRouteToMultisig: () => void;
  onApproveAndRoute: () => void;
  onRejectReasonChange: (v: string) => void;
  onCopy: (t: string) => void;
}) {
  const pillarScores = request.pillar_scores as { S: number; T: number; H: number; C: number; U: number };
  const unitySignals = request.unity_signals as Record<string, boolean> | null;
  const colSpan = showCheckbox ? 8 : 7;
  const displayName = profile?.display_name || profile?.username || 'Unknown';
  const walletShort = `${request.user_wallet_address.slice(0, 6)}...${request.user_wallet_address.slice(-4)}`;
  const hasWalletMismatch = profile?.wallet_address && 
    profile.wallet_address.toLowerCase() !== request.user_wallet_address.toLowerCase();

  return (
    <>
      <TableRow className={cn(
        "cursor-pointer transition-colors",
        isExpanded && "bg-accent/50",
        isSelected && "bg-primary/5",
        !isSelected && !isExpanded && request.status === 'pending' && "bg-yellow-500/5 border-l-2 border-l-yellow-500"
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
              <div className="flex items-center gap-1">
                <span className="font-mono text-[10px] text-muted-foreground">{walletShort}</span>
                {hasWalletMismatch && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 gap-0.5" title={`Ví hiện tại: ${profile?.wallet_address}`}>
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Ví đã đổi
                  </Badge>
                )}
              </div>
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
              (request.calculated_amount_atomic === '0' || request.calculated_amount_atomic === '' || !request.calculated_amount_atomic) ? (
                <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/30">
                  0 FUN — Tự động từ chối
                </Badge>
              ) : (
              <>
                {isConnected && (
                  hasMultisig ? (
                    <Badge className="text-[10px] gap-1 cursor-not-allowed bg-green-500/20 text-green-600 border border-green-500/30">
                      <CheckCircle className="w-3 h-3" />
                      ✅ Đã chuyển Multisig
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 px-2 text-[10px] gap-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                      onClick={(e) => { e.stopPropagation(); onApproveAndRoute(); }}
                      disabled={isMinting || isBatchProcessing}
                    >
                      <Shield className="w-3 h-3" />
                      Multisig 3/3
                    </Button>
                  )
                )}
                {!hasMultisig && (
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
                )}
              </>
              )
            )}
            {request.status === 'approved' && (
              hasMultisig ? (
                <Badge className="text-[10px] gap-1 cursor-not-allowed bg-green-500/20 text-green-600 border border-green-500/30">
                  <CheckCircle className="w-3 h-3" />
                  ✅ Đã chuyển Multisig
                </Badge>
              ) : isConnected && (request.calculated_amount_atomic === '0' || request.calculated_amount_atomic === '') ? (
                <Badge variant="outline" className="text-[10px] gap-1 opacity-50 text-muted-foreground">
                  0 FUN
                </Badge>
              ) : isConnected ? (
                <Button
                  size="sm"
                  className="h-7 px-2 text-[10px] gap-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                  onClick={(e) => { e.stopPropagation(); onRouteToMultisig(); }}
                  disabled={isMinting}
                >
                  <Shield className="w-3 h-3" />
                  Multisig 3/3
                </Button>
              ) : null
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
                      {isConnected && (
                        <Button
                          className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                          onClick={onApproveAndRoute}
                          disabled={isMinting}
                        >
                          {isMinting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><Shield className="w-4 h-4" /> 🔐 Chuyển Multisig 3/3</>}
                        </Button>
                      )}
                      <Button variant="outline" className="w-full gap-2" onClick={onApprove}>
                        <CheckCircle className="w-4 h-4" /> Chỉ Duyệt
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
                        onClick={onRouteToMultisig}
                        disabled={!isConnected || isMinting}
                      >
                        {isMinting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><Shield className="w-4 h-4" /> 🔐 Chuyển Multisig 3/3</>}
                      </Button>
                      {!isConnected && <p className="text-xs text-center text-muted-foreground">Kết nối ví để đọc nonce on-chain</p>}
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
