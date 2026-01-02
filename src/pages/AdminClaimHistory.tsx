import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  RefreshCw, 
  Search, 
  Wallet, 
  ExternalLink, 
  ShieldX, 
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Coins,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Navigate, useNavigate } from "react-router-dom";

interface ClaimRecord {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
  profile?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

export default function AdminClaimHistory() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(data === true);
      setCheckingRole(false);
    };
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchClaims();
    }
  }, [isAdmin]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const { data: claimsData, error } = await supabase
        .from("claim_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Fetch profiles for all users
      const userIds = [...new Set(claimsData?.map(c => c.user_id) || [])];
      let profileMap = new Map();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .in("id", userIds);
        
        profiles?.forEach(p => {
          profileMap.set(p.id, p);
        });
      }

      const enrichedClaims = claimsData?.map(claim => ({
        ...claim,
        profile: profileMap.get(claim.user_id) || null
      })) || [];

      setClaims(enrichedClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = useMemo(() => {
    let result = claims;

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter(c => c.status === statusFilter);
    }

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.profile?.display_name?.toLowerCase().includes(search) ||
        c.profile?.username?.toLowerCase().includes(search) ||
        c.wallet_address.toLowerCase().includes(search) ||
        c.tx_hash?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [claims, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = claims.length;
    const success = claims.filter(c => c.status === 'success').length;
    const pending = claims.filter(c => c.status === 'pending').length;
    const failed = claims.filter(c => c.status === 'failed').length;
    const totalAmount = claims.filter(c => c.status === 'success').reduce((sum, c) => sum + Number(c.amount), 0);
    const uniqueUsers = new Set(claims.map(c => c.user_id)).size;

    return { total, success, pending, failed, totalAmount, uniqueUsers };
  }, [claims]);

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <ShieldX className="w-16 h-16 mx-auto text-destructive mb-4" />
          <p className="text-lg font-semibold">Truy cập bị từ chối</p>
          <p className="text-muted-foreground mt-2">Bạn không có quyền truy cập trang này</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                Lịch Sử Claim - Tất Cả Users
              </h1>
              <p className="text-muted-foreground">Quản lý và theo dõi tất cả claim requests</p>
            </div>
          </div>
          <Button onClick={fetchClaims} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <Wallet className="w-6 h-6 mx-auto text-blue-500 mb-1" />
              <div className="text-xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Tổng claims</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-1" />
              <div className="text-xl font-bold">{stats.success}</div>
              <div className="text-xs text-muted-foreground">Thành công</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
              <div className="text-xl font-bold">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Đang xử lý</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
            <CardContent className="p-4 text-center">
              <XCircle className="w-6 h-6 mx-auto text-red-500 mb-1" />
              <div className="text-xl font-bold">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Thất bại</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <Coins className="w-6 h-6 mx-auto text-amber-500 mb-1" />
              <div className="text-xl font-bold">{stats.totalAmount.toLocaleString('vi-VN')}</div>
              <div className="text-xs text-muted-foreground">Tổng CAMLY claimed</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto text-purple-500 mb-1" />
              <div className="text-xl font-bold">{stats.uniqueUsers}</div>
              <div className="text-xs text-muted-foreground">Users đã claim</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, username, wallet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="success">Thành công</SelectItem>
                <SelectItem value="pending">Đang xử lý</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              Claims ({filteredClaims.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Không có claim nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Ví nhận</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>TX Hash</TableHead>
                      <TableHead>Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {claim.profile?.display_name || claim.profile?.username || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{claim.profile?.username || claim.user_id.slice(0, 8)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-amber-500">
                          {Number(claim.amount).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {claim.wallet_address.slice(0, 6)}...{claim.wallet_address.slice(-4)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={
                              claim.status === 'success' ? "bg-green-500/20 text-green-500" :
                              claim.status === 'pending' ? "bg-yellow-500/20 text-yellow-500" :
                              "bg-red-500/20 text-red-500"
                            }
                          >
                            {claim.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {claim.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {claim.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                            {claim.status === 'success' ? 'Thành công' :
                             claim.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {claim.tx_hash ? (
                            <a
                              href={`https://bscscan.com/tx/${claim.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              {claim.tx_hash.slice(0, 8)}...
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(claim.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
