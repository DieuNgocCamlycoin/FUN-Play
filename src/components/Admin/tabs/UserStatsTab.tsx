import { useState, useMemo } from "react";
import { useUsersDirectoryStats, UserDirectoryStat } from "@/hooks/useUsersDirectoryStats";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, Download, ChevronDown, ChevronUp, RefreshCw, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

type SortKey = "total_camly_rewards" | "posts_count" | "videos_count" | "donations_sent_total" | "donations_received_total" | "minted_fun_total" | "display_name";
type SortDir = "asc" | "desc";

export function UserStatsTab() {
  const { data, loading, error, refetch } = useUsersDirectoryStats();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("total_camly_rewards");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let list = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => 
        u.display_name?.toLowerCase().includes(q) || 
        u.username?.toLowerCase().includes(q) ||
        u.wallet_address?.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [data, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const exportCSV = () => {
    const headers = ["Username", "Display Name", "Posts", "Videos", "Comments", "Likes", "Shares", "CAMLY Total", "CAMLY Pending", "CAMLY Approved", "Donations Sent", "Donations Received", "FUN Minted"];
    const rows = filtered.map(u => [
      u.username, u.display_name, u.posts_count, u.videos_count, u.comments_count, u.likes_count, u.shares_count,
      u.total_camly_rewards, u.pending_rewards, u.approved_reward,
      u.donations_sent_total, u.donations_received_total, u.minted_fun_total
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive mb-2">Lỗi: {error}</p>
        <Button onClick={refetch} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" />Thử lại</Button>
      </Card>
    );
  }

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(n % 1 === 0 ? 0 : 2);

  const ExpandedDetails = ({ user }: { user: UserDirectoryStat }) => (
    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><span className="text-muted-foreground">Posts:</span> <span className="font-medium">{user.posts_count}</span></div>
        <div><span className="text-muted-foreground">Videos:</span> <span className="font-medium">{user.videos_count}</span></div>
        <div><span className="text-muted-foreground">Comments:</span> <span className="font-medium">{user.comments_count}</span></div>
        <div><span className="text-muted-foreground">Views:</span> <span className="font-medium">{user.views_count}</span></div>
        <div><span className="text-muted-foreground">Likes:</span> <span className="font-medium">{user.likes_count}</span></div>
        <div><span className="text-muted-foreground">Shares:</span> <span className="font-medium">{user.shares_count}</span></div>
      </div>
      <div className="border-t border-border pt-3">
        <h4 className="text-sm font-semibold mb-2">CAMLY Rewards</h4>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div><span className="text-muted-foreground">Tổng:</span> <span className="font-medium text-primary">{fmt(user.total_camly_rewards)}</span></div>
          <div><span className="text-muted-foreground">Chờ duyệt:</span> <span className="font-medium text-yellow-500">{fmt(user.pending_rewards)}</span></div>
          <div><span className="text-muted-foreground">Đã duyệt:</span> <span className="font-medium text-green-500">{fmt(user.approved_reward)}</span></div>
        </div>
      </div>
      <div className="border-t border-border pt-3">
        <h4 className="text-sm font-semibold mb-2">Donations</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Đã gửi:</span> <span className="font-medium">{user.donations_sent_count} lần ({fmt(user.donations_sent_total)})</span></div>
          <div><span className="text-muted-foreground">Đã nhận:</span> <span className="font-medium">{user.donations_received_count} lần ({fmt(user.donations_received_total)})</span></div>
        </div>
      </div>
      <div className="border-t border-border pt-3 flex items-center gap-2">
        <h4 className="text-sm font-semibold">FUN Money:</h4>
        <span className="text-sm">{user.mint_requests_count} mint requests · {fmt(user.minted_fun_total)} FUN đã mint</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate(`/user/${user.user_id}`)}>
        <ExternalLink className="w-3 h-3 mr-1" />Xem Profile
      </Button>
    </div>
  );

  // Mobile card layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm user..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" size="icon" onClick={exportCSV}><Download className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={refetch}><RefreshCw className="w-4 h-4" /></Button>
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} users</p>
        {filtered.map(user => (
          <Collapsible key={user.user_id} open={expandedId === user.user_id} onOpenChange={() => setExpandedId(expandedId === user.user_id ? null : user.user_id)}>
            <Card className="p-3">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>{user.display_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm truncate">{user.display_name || user.username}</p>
                      {user.banned && <Badge variant="destructive" className="text-[10px] h-4">Banned</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-primary">{fmt(user.total_camly_rewards)} CAMLY</p>
                    <p className="text-muted-foreground">{fmt(user.minted_fun_total)} FUN</p>
                  </div>
                  {expandedId === user.user_id ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <ExpandedDetails user={user} />
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm user..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
        <Button variant="outline" size="sm" onClick={refetch}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} users</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("posts_count")}>Hoạt động<SortIcon k="posts_count" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("total_camly_rewards")}>CAMLY<SortIcon k="total_camly_rewards" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("minted_fun_total")}>FUN Money<SortIcon k="minted_fun_total" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("donations_sent_total")}>Donation Gửi<SortIcon k="donations_sent_total" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("donations_received_total")}>Donation Nhận<SortIcon k="donations_received_total" /></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(user => (
            <Collapsible key={user.user_id} asChild open={expandedId === user.user_id} onOpenChange={() => setExpandedId(expandedId === user.user_id ? null : user.user_id)}>
              <>
                <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedId(expandedId === user.user_id ? null : user.user_id)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="text-xs">{user.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm">{user.display_name || user.username}</p>
                          {user.banned && <Badge variant="destructive" className="text-[10px] h-4">Banned</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span title="Posts/Videos/Comments">{user.posts_count}P · {user.videos_count}V · {user.comments_count}C</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium text-primary">{fmt(user.total_camly_rewards)}</span>
                      <div className="text-[11px] text-muted-foreground">
                        {fmt(user.pending_rewards)} chờ · {fmt(user.approved_reward)} duyệt
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{fmt(user.minted_fun_total)}</TableCell>
                  <TableCell className="text-sm">{user.donations_sent_count} ({fmt(user.donations_sent_total)})</TableCell>
                  <TableCell className="text-sm">{user.donations_received_count} ({fmt(user.donations_received_total)})</TableCell>
                  <TableCell>
                    {expandedId === user.user_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </TableCell>
                </TableRow>
                {expandedId === user.user_id && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <ExpandedDetails user={user} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            </Collapsible>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
