import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletChangeLog {
  id: string;
  user_id: string;
  old_wallet: string | null;
  new_wallet: string | null;
  reason: string;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    wallet_risk_status: string | null;
    claim_freeze_until: string | null;
  };
}

const formatAddress = (addr: string | null) => {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const riskBadge = (status: string | null) => {
  switch (status) {
    case 'BLOCKED': return <Badge variant="destructive">BLOCKED</Badge>;
    case 'REVIEW': return <Badge className="bg-orange-500 text-white">REVIEW</Badge>;
    case 'WATCH': return <Badge className="bg-amber-500 text-white">WATCH</Badge>;
    default: return <Badge variant="secondary">NORMAL</Badge>;
  }
};

export default function WalletAuditTab() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WalletChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_change_log')
        .select('*, profiles!wallet_change_log_user_id_fkey(username, display_name, wallet_risk_status, claim_freeze_until)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      let filtered = (data as any[]) || [];
      if (filter !== 'all') {
        filtered = filtered.filter(l => l.profiles?.wallet_risk_status === filter);
      }
      setLogs(filtered);
    } catch (err) {
      console.error('Failed to fetch wallet audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filter]);

  const handleUnfreeze = async (userId: string) => {
    if (!user?.id) return;
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          claim_freeze_until: null, 
          wallet_risk_status: 'NORMAL',
          wallet_change_count_30d: 0,
        })
        .eq('id', userId);
      
      if (error) throw error;
      toast({ title: '✅ Đã unfreeze claim cho user' });
      fetchLogs();
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể unfreeze', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Wallet Audit Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="WATCH">WATCH</SelectItem>
                <SelectItem value="REVIEW">REVIEW</SelectItem>
                <SelectItem value="BLOCKED">BLOCKED</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Không có log đổi ví nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Ví cũ</TableHead>
                  <TableHead className="text-xs">Ví mới</TableHead>
                  <TableHead className="text-xs">Risk</TableHead>
                  <TableHead className="text-xs">Lý do</TableHead>
                  <TableHead className="text-xs">Thời gian</TableHead>
                  <TableHead className="text-xs">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-medium">
                      {log.profiles?.display_name || log.profiles?.username || log.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{formatAddress(log.old_wallet)}</TableCell>
                    <TableCell className="text-xs font-mono">{formatAddress(log.new_wallet)}</TableCell>
                    <TableCell>{riskBadge(log.profiles?.wallet_risk_status || null)}</TableCell>
                    <TableCell className="text-xs">{log.reason}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      {(log.profiles?.wallet_risk_status === 'BLOCKED' || log.profiles?.wallet_risk_status === 'REVIEW' || log.profiles?.wallet_risk_status === 'WATCH') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1"
                          disabled={actionLoading === log.user_id}
                          onClick={() => handleUnfreeze(log.user_id)}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Unfreeze
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
