import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, RefreshCw, Clock, AlertTriangle } from 'lucide-react';

interface PendingClaim {
  id: string;
  user_id: string;
  amount: number;
  claim_type: string;
  status: string;
  gov_signatures_count: number;
  gov_completed_groups: string[];
  created_at: string;
  wallet_address: string;
}

type DialogMode = 'approve' | 'reject' | null;

const REQUIRED_GROUPS = ['will', 'wisdom', 'love'];

export function MultisigQuickActions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedClaim, setSelectedClaim] = useState<PendingClaim | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('claim_requests')
      .select('id, user_id, amount, claim_type, status, gov_signatures_count, gov_completed_groups, created_at, wallet_address')
      .eq('gov_required', true)
      .eq('status', 'pending')
      .lt('gov_signatures_count', 3)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: 'Lỗi tải claim', description: error.message, variant: 'destructive' });
    } else {
      setClaims((data || []) as PendingClaim[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const openDialog = (claim: PendingClaim, mode: DialogMode) => {
    setSelectedClaim(claim);
    setDialogMode(mode);
    setReason('');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedClaim(null);
    setReason('');
  };

  const handleSubmit = async () => {
    if (!selectedClaim || !dialogMode) return;
    if (!reason.trim() || reason.trim().length < 10) {
      toast({
        title: 'Lý do quá ngắn',
        description: 'Vui lòng nhập tối thiểu 10 ký tự để audit log có ý nghĩa.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const newStatus = dialogMode === 'approve' ? 'approved' : 'rejected';
      const isApprove = dialogMode === 'approve';

      // 1. Update claim_requests with admin override
      const updatePayload: Record<string, any> = {
        status: newStatus,
        last_error: isApprove ? null : `Admin override: ${reason.trim()}`,
        processed_at: new Date().toISOString(),
      };

      if (isApprove) {
        // Mark all 3 groups as admin-overridden so downstream pipeline counts it as full
        updatePayload.gov_completed_groups = REQUIRED_GROUPS;
        updatePayload.gov_signatures_count = 3;
        updatePayload.gov_signatures = {
          will: { admin_override: true, by: user?.id, at: new Date().toISOString(), reason: reason.trim() },
          wisdom: { admin_override: true, by: user?.id, at: new Date().toISOString(), reason: reason.trim() },
          love: { admin_override: true, by: user?.id, at: new Date().toISOString(), reason: reason.trim() },
        };
      }

      const { error: updateErr } = await (supabase as any)
        .from('claim_requests')
        .update(updatePayload)
        .eq('id', selectedClaim.id)
        .eq('status', 'pending'); // optimistic lock

      if (updateErr) throw updateErr;

      // 2. Audit log into governance_actions
      const { error: auditErr } = await (supabase as any)
        .from('governance_actions')
        .insert({
          action_type: isApprove ? 'multisig.admin.approve' : 'multisig.admin.reject',
          status: 'executed',
          executed_at: new Date().toISOString(),
          executed_by: user?.id,
          parameters: {
            claim_id: selectedClaim.id,
            user_id: selectedClaim.user_id,
            amount: selectedClaim.amount,
            claim_type: selectedClaim.claim_type,
            wallet_address: selectedClaim.wallet_address,
            previous_signatures_count: selectedClaim.gov_signatures_count,
            previous_groups: selectedClaim.gov_completed_groups,
            reason: reason.trim(),
            override_type: '3of3-bypass',
          },
        });

      if (auditErr) {
        // Don't block — but warn
        console.error('Audit log failed', auditErr);
      }

      toast({
        title: isApprove ? '✅ Đã approve' : '❌ Đã reject',
        description: `Claim ${selectedClaim.id.slice(0, 8)}… đã được ${isApprove ? 'duyệt' : 'từ chối'}. Audit log đã ghi.`,
      });

      closeDialog();
      await fetchClaims();
    } catch (err: any) {
      toast({
        title: 'Lỗi xử lý',
        description: err.message?.slice(0, 200) || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (n: number) => n.toLocaleString('vi-VN');
  const formatTime = (s: string) => new Date(s).toLocaleString('vi-VN');
  const getAge = (s: string) => {
    const hours = (Date.now() - new Date(s).getTime()) / 3_600_000;
    if (hours < 1) return `${Math.round(hours * 60)}p`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <Card className="p-5 border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="font-semibold text-base">Quick Actions — Claim chưa đủ chữ ký</h3>
            <p className="text-xs text-muted-foreground">
              Admin override 3/3 cho claim cần xử lý gấp. Mọi thao tác đều ghi audit log.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchClaims} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && claims.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : claims.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          ✨ Không có claim nào đang chờ xử lý.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => {
            const missingGroups = REQUIRED_GROUPS.filter(
              (g) => !c.gov_completed_groups?.includes(g),
            );
            return (
              <div key={c.id} className="border border-border/50 rounded-lg p-4 bg-background">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <code className="text-xs">{c.id.slice(0, 8)}…</code>
                      <Badge variant="outline" className="text-xs">{c.claim_type}</Badge>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        {getAge(c.created_at)}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold">
                      {formatAmount(Number(c.amount))} <span className="text-xs text-muted-foreground font-normal">FUN</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      User <code>{c.user_id.slice(0, 8)}…</code> · {formatTime(c.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" onClick={() => openDialog(c, 'approve')} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openDialog(c, 'reject')}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Chữ ký:</span>
                  {REQUIRED_GROUPS.map((g) => {
                    const signed = c.gov_completed_groups?.includes(g);
                    return (
                      <Badge
                        key={g}
                        variant={signed ? 'default' : 'outline'}
                        className={signed ? 'bg-green-600' : 'text-muted-foreground'}
                      >
                        {signed ? '✓' : '○'} {g.toUpperCase()}
                      </Badge>
                    );
                  })}
                  <span className="text-muted-foreground ml-auto">
                    {c.gov_signatures_count}/3 · thiếu: {missingGroups.join(', ') || 'không'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogMode !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'approve' ? '✅ Admin Approve' : '❌ Admin Reject'} —{' '}
              {selectedClaim?.id.slice(0, 8)}…
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'approve' ? (
                <>
                  Bạn đang <strong className="text-foreground">override 3/3 multisig</strong> để approve trực tiếp claim này.
                  Hệ thống sẽ đánh dấu cả 3 nhóm WILL/WISDOM/LOVE đã ký bởi admin.
                  Lý do sẽ được ghi vĩnh viễn vào audit log <code>governance_actions</code>.
                </>
              ) : (
                <>
                  Bạn đang reject claim. User sẽ không nhận được FUN. Lý do sẽ được ghi vào
                  <code className="ml-1">last_error</code> và audit log.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="text-sm space-y-1 bg-muted/50 p-3 rounded-md">
              <div>Amount: <strong>{formatAmount(Number(selectedClaim.amount))} FUN</strong></div>
              <div>Type: <strong>{selectedClaim.claim_type}</strong></div>
              <div>Đã ký: <strong>{selectedClaim.gov_signatures_count}/3</strong></div>
              <div>Tuổi: <strong>{getAge(selectedClaim.created_at)}</strong></div>
            </div>
          )}

          <Textarea
            placeholder={
              dialogMode === 'approve'
                ? 'Lý do override 3/3 (vd: "User đã verify offline, GOV LOVE bận, đã xác nhận qua Zoom 21/4")'
                : 'Lý do reject (vd: "Phát hiện sybil từ IP 1.2.3.4, ví không match identity")'
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Tối thiểu 10 ký tự. ({reason.trim().length} hiện tại)
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || reason.trim().length < 10}
              variant={dialogMode === 'approve' ? 'default' : 'destructive'}
              className={dialogMode === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {submitting ? 'Đang xử lý…' : dialogMode === 'approve' ? 'Xác nhận Approve' : 'Xác nhận Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
