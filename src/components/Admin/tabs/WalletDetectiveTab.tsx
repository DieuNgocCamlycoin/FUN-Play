import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Ban, Loader2, AlertTriangle, UserX, Fingerprint } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface DetectiveResult {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_verified: boolean;
  wallet_address: string;
  total_amount: number;
  tx_count: number;
  created_at: string;
  banned: boolean;
}

export function WalletDetectiveTab() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [walletInput, setWalletInput] = useState("");
  const [results, setResults] = useState<DetectiveResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchedWallet, setSearchedWallet] = useState("");
  const [banning, setBanning] = useState(false);

  const isUnverified = (r: DetectiveResult) =>
    !r.avatar_url || r.username.startsWith("user_");

  const isDuplicateWallet = (r: DetectiveResult) => {
    const walletsWithMultipleUsers = results
      .reduce((acc, item) => {
        const w = item.wallet_address?.toLowerCase();
        if (w) acc.set(w, (acc.get(w) || 0) + 1);
        return acc;
      }, new Map<string, number>());
    return (walletsWithMultipleUsers.get(r.wallet_address?.toLowerCase()) || 0) > 1;
  };

  const handleTrace = async () => {
    if (!walletInput.trim() || !user) return;
    setLoading(true);
    setResults([]);
    setSearchedWallet(walletInput.trim());

    const { data, error } = await supabase.rpc("trace_wallet_detective", {
      p_wallet_address: walletInput.trim(),
      p_admin_id: user.id,
    });

    if (error) {
      toast.error("Lỗi truy vết: " + error.message);
    } else {
      setResults((data as DetectiveResult[]) || []);
      if (!data || data.length === 0) {
        toast.info("Không tìm thấy user nào liên quan đến ví này.");
      }
    }
    setLoading(false);
  };

  const handleBanAll = async () => {
    if (!user || results.length === 0) return;
    const unbanned = results.filter((r) => !r.banned);
    if (unbanned.length === 0) {
      toast.info("Tất cả users đã bị ban.");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn BAN ${unbanned.length} user liên quan?`
    );
    if (!confirmed) return;

    setBanning(true);
    let success = 0;
    for (const r of unbanned) {
      const { error } = await supabase.rpc("ban_user_permanently", {
        p_admin_id: user.id,
        p_user_id: r.user_id,
        p_reason: `Wallet Detective: liên quan đến ví ${searchedWallet}`,
      });
      if (!error) success++;
    }
    toast.success(`Đã ban ${success}/${unbanned.length} users.`);
    // Refresh
    handleTrace();
    setBanning(false);
  };

  const getRowClass = (r: DetectiveResult) => {
    if (r.banned) return "opacity-50";
    if (isDuplicateWallet(r)) return "bg-destructive/10 border-l-4 border-l-destructive";
    if (isUnverified(r)) return "bg-yellow-500/10 border-l-4 border-l-yellow-500";
    return "";
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const truncateWallet = (w: string) =>
    w ? `${w.slice(0, 6)}...${w.slice(-4)}` : "N/A";

  // Mobile card view
  const MobileResultCard = ({ r }: { r: DetectiveResult }) => (
    <Card className={`${getRowClass(r)} mb-3`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {r.avatar_url ? (
              <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <UserX className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{r.display_name || r.username}</p>
              <p className="text-xs text-muted-foreground">@{r.username}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {r.banned && <Badge variant="destructive">Banned</Badge>}
            {isDuplicateWallet(r) && (
              <Badge variant="destructive" className="text-[10px]">Multi-account</Badge>
            )}
            {isUnverified(r) && (
              <Badge className="bg-yellow-500/20 text-yellow-600 text-[10px]">Unverified</Badge>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Wallet:</span>
            <p className="font-mono">{truncateWallet(r.wallet_address)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tổng gửi:</span>
            <p className="font-semibold">{r.total_amount.toLocaleString()} ({r.tx_count} tx)</p>
          </div>
          <div>
            <span className="text-muted-foreground">Ngày tham gia:</span>
            <p>{formatDate(r.created_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-primary" />
            Wallet Detective
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Paste wallet address (to_address)..."
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrace()}
              className="font-mono text-sm"
            />
            <Button onClick={handleTrace} disabled={loading || !walletInput.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Trace
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Kết quả: {results.length} user(s) liên quan
            </CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBanAll}
              disabled={banning || results.every((r) => r.banned)}
            >
              {banning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              Ban All Related Users
            </Button>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-destructive/30" />
                <span>Suspected multi-account</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500/30" />
                <span>Unverified account</span>
              </div>
            </div>

            {isMobile ? (
              <div>
                {results.map((r) => (
                  <MobileResultCard key={r.user_id} r={r} />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead className="text-right">Tổng Gửi</TableHead>
                    <TableHead className="text-right">Số TX</TableHead>
                    <TableHead>Ngày Tham Gia</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.user_id} className={getRowClass(r)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {r.avatar_url ? (
                            <img src={r.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                              <UserX className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{r.display_name || r.username}</p>
                            <p className="text-xs text-muted-foreground">@{r.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{truncateWallet(r.wallet_address)}</TableCell>
                      <TableCell className="text-right font-semibold">{r.total_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.tx_count}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {r.banned && <Badge variant="destructive">Banned</Badge>}
                          {isDuplicateWallet(r) && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Multi-account
                            </Badge>
                          )}
                          {isUnverified(r) && (
                            <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-[10px]">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
