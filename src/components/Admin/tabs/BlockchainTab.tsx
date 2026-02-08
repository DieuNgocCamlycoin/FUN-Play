import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Blocks, ExternalLink, RefreshCw, Wallet } from "lucide-react";
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

interface BlockchainClaim {
  id: string;
  wallet_address: string;
  amount: number;
  tx_hash: string;
  created_at: string;
  user_name?: string;
}

const BlockchainTab = () => {
  const [claims, setClaims] = useState<BlockchainClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlockchainData = async () => {
    setLoading(true);
    try {
      // Fetch claim requests with tx_hash (completed on-chain)
      const { data: claimData, error } = await supabase
        .from("claim_requests")
        .select("*")
        .not("tx_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(claimData?.map((c) => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name || p.username]));

      const enrichedClaims = claimData?.map((c) => ({
        id: c.id,
        wallet_address: c.wallet_address,
        amount: c.amount,
        tx_hash: c.tx_hash!,
        created_at: c.created_at,
        user_name: profileMap.get(c.user_id),
      })) as BlockchainClaim[];

      setClaims(enrichedClaims || []);
    } catch (error) {
      console.error("Error fetching blockchain data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBlockchainData();
    setRefreshing(false);
  };

  const totalOnChain = claims.reduce((sum, c) => sum + c.amount, 0);
  const uniqueWallets = new Set(claims.map((c) => c.wallet_address)).size;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/30">
          <CardContent className="p-4 text-center">
            <Blocks className="w-8 h-8 mx-auto text-cyan-500 mb-2" />
            <div className="text-2xl font-bold">{claims.length}</div>
            <div className="text-xs text-muted-foreground">TX on-chain</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {totalOnChain.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Tổng CAMLY on-chain</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Wallet className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">{uniqueWallets}</div>
            <div className="text-xs text-muted-foreground">Ví unique</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Blocks className="w-5 h-5 text-cyan-500" />
            Giao dịch Blockchain ({claims.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : (
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
                  {claims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">
                        {claim.user_name || "Không xác định"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">
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
                        <a
                          href={`https://bscscan.com/tx/${claim.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-cyan-500 hover:underline"
                        >
                          <span className="font-mono text-xs">
                            {claim.tx_hash.slice(0, 10)}...
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(claim.created_at), "dd/MM HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {claims.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có giao dịch on-chain
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainTab;
