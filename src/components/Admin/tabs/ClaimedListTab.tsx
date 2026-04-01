import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Search, Wallet, ExternalLink, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface ClaimRecord {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
  profile?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

const ClaimedListTab = () => {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchClaims = async () => {
      const { data, error } = await supabase
        .from("claim_requests")
        .select("*")
        .neq("claim_type", "fun_money")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error fetching claims:", error);
        return;
      }

      // Fetch profiles for users
      const userIds = [...new Set(data?.map((c) => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      const enrichedClaims = data?.map((c) => ({
        ...c,
        profile: profileMap.get(c.user_id),
      })) as ClaimRecord[];

      setClaims(enrichedClaims || []);
      setLoading(false);
    };

    fetchClaims();
  }, []);

  const completedClaims = useMemo(() => {
    // Sửa filter: status phải là "success" VÀ có tx_hash
    return claims.filter((c) => c.status === "success" && c.tx_hash);
  }, [claims]);

  const filteredClaims = useMemo(() => {
    if (!searchTerm.trim()) return completedClaims;
    const term = searchTerm.toLowerCase();
    return completedClaims.filter(
      (c) =>
        c.profile?.display_name?.toLowerCase().includes(term) ||
        c.profile?.username?.toLowerCase().includes(term) ||
        c.wallet_address?.toLowerCase().includes(term)
    );
  }, [completedClaims, searchTerm]);

  const stats = useMemo(() => {
    const uniqueUsers = new Set(completedClaims.map((c) => c.user_id)).size;
    const totalClaimed = completedClaims.reduce((sum, c) => sum + c.amount, 0);
    const pendingClaims = claims.filter((c) => c.status === "pending").length;
    const avgClaim = uniqueUsers > 0 ? totalClaimed / uniqueUsers : 0;

    return { uniqueUsers, totalClaimed, pendingClaims, avgClaim };
  }, [claims, completedClaims]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/30">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-cyan-500 mb-2" />
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <div className="text-xs text-muted-foreground">TK đã claim</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="p-4 text-center">
            <Download className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold text-green-500">
              {stats.totalClaimed.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Tổng claim về ví</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <div className="text-2xl font-bold">{stats.pendingClaims}</div>
            <div className="text-xs text-muted-foreground">Đang chờ</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Wallet className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">{Math.round(stats.avgClaim).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Avg claim/user</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên hoặc wallet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-500" />
            Lịch sử Claim ({filteredClaims.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>TX Hash</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.slice(0, 50).map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={claim.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {(claim.profile?.display_name || claim.profile?.username)?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px]">
                          {claim.profile?.display_name || claim.profile?.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs truncate max-w-[100px]">
                          {claim.wallet_address.slice(0, 6)}...{claim.wallet_address.slice(-4)}
                        </span>
                        <a
                          href={`https://bscscan.com/address/${claim.wallet_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">{claim.amount.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>
                      {claim.tx_hash ? (
                        <a
                          href={`https://bscscan.com/tx/${claim.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-cyan-500 hover:underline"
                        >
                          <span className="font-mono text-xs">
                            {claim.tx_hash.slice(0, 8)}...
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(claim.created_at), "dd/MM HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClaims.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có claim nào
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClaimedListTab;
