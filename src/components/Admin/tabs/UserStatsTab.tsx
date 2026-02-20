import { useState, useMemo, useEffect } from "react";
import { useUsersDirectoryStats, UserDirectoryStat } from "@/hooks/useUsersDirectoryStats";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Download, ChevronDown, ChevronUp, RefreshCw, ExternalLink, FileSpreadsheet, FileText, Loader2, Coins, AlertTriangle } from "lucide-react";
import { AdminPagination, PAGE_SIZE, paginate } from "@/components/Admin/AdminPagination";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getProfileUrl } from "@/lib/adminUtils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { RewardBreakdownGrid, ThreeSegmentProgress } from "@/components/Rewards/RewardBreakdownGrid";

type SortKey = "total_camly_rewards" | "posts_count" | "videos_count" | "donations_sent_total" | "donations_received_total" | "minted_fun_total" | "display_name";
type SortDir = "asc" | "desc";

export function UserStatsTab() {
  const { data, loading, error, refetch } = useUsersDirectoryStats();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("total_camly_rewards");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, sortKey, sortDir]);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let list = data;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(u =>
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.wallet_address?.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [data, debouncedSearch, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const escCsv = (v: string | number | null | undefined) => { const s = String(v ?? ""); return `"${s.replace(/"/g, '""')}"`; };
  const fmtNum = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(2);
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(n % 1 === 0 ? 0 : 2);

  const exportCSV = async () => {
    try {
      setExporting("csv");
      const headers = ["Username","Display Name","Wallet","Trang Thai","Posts","Videos","Comments","Views","Likes","Shares","CAMLY Tong","Cho Duyet","Da Duyet","View R","Like R","Comment R","Share R","Upload R","Signup R","Bounty R","Don Gui","Don Nhan","FUN Minted"];
      const rows = filtered.map(u => [escCsv(u.username),escCsv(u.display_name),escCsv(u.wallet_address),escCsv(u.banned?"Banned":"Active"),fmtNum(u.posts_count),fmtNum(u.videos_count),fmtNum(u.comments_count),fmtNum(u.views_count),fmtNum(u.likes_count),fmtNum(u.shares_count),fmtNum(u.total_camly_rewards),fmtNum(u.pending_rewards),fmtNum(u.approved_reward),fmtNum(u.view_rewards),fmtNum(u.like_rewards),fmtNum(u.comment_rewards),fmtNum(u.share_rewards),fmtNum(u.upload_rewards),fmtNum(u.signup_rewards),fmtNum(u.bounty_rewards),fmtNum(u.donations_sent_total),fmtNum(u.donations_received_total),fmtNum(u.minted_fun_total)].join(","));
      const bom = "\uFEFF";
      const csv = bom + headers.join(",") + "\n" + rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `users-stats-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất CSV!", { description: `${filtered.length} users` });
    } catch { toast.error("Lỗi khi xuất CSV"); } finally { setExporting(null); }
  };

  const exportPDF = async () => {
    try {
      setExporting("pdf");
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(255, 215, 0); doc.text("FUN PLAY", 14, 15);
      doc.setFontSize(14); doc.setTextColor(100, 100, 100); doc.text("THONG KE USERS", 14, 23);
      doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120);
      doc.text(`Xuat ngay: ${new Date().toLocaleString("vi-VN")}`, 14, 30);
      doc.text(`Tong so users: ${filtered.length}`, 14, 36);
      autoTable(doc, {
        startY: 42,
        head: [["Username","Display","Posts","Videos","CAMLY","Pending","Approved","FUN","Don Gui","Status"]],
        body: filtered.map(u => [u.username?.substring(0,18)||"",u.display_name?.substring(0,18)||"",u.posts_count,u.videos_count,fmtNum(u.total_camly_rewards),fmtNum(u.pending_rewards),fmtNum(u.approved_reward),fmtNum(u.minted_fun_total),fmtNum(u.donations_sent_total),u.banned?"Banned":"Active"]),
        theme: "grid", headStyles: { fillColor: [255,215,0], textColor: [0,0,0], fontStyle: "bold", fontSize: 8 }, bodyStyles: { fontSize: 7 }, alternateRowStyles: { fillColor: [250,250,250] }, margin: { left: 14, right: 14 },
      });
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150,150,150); doc.text("FUN PLAY • User Statistics", doc.internal.pageSize.width/2, doc.internal.pageSize.height-10, { align: "center" }); doc.text(`Trang ${i}/${pageCount}`, doc.internal.pageSize.width-20, doc.internal.pageSize.height-10, { align: "right" }); }
      doc.save(`users-stats-${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success("Đã xuất PDF!", { description: `${filtered.length} users` });
    } catch { toast.error("Lỗi khi xuất PDF"); } finally { setExporting(null); }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  if (error) return <Card className="p-6 text-center"><p className="text-destructive mb-2">Lỗi: {error}</p><Button onClick={refetch} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" />Thử lại</Button></Card>;

  const ExpandedDetails = ({ user }: { user: UserDirectoryStat }) => {
    const claimed = Math.max(0, user.total_camly_rewards - user.pending_rewards - user.approved_reward);
    return (
      <div className="p-4 bg-muted/30 rounded-lg space-y-4">
        {/* CAMLY Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-amber-500" /> Phân rã CAMLY theo hoạt động
            </h4>
            <RewardBreakdownGrid breakdown={user} />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold mb-2">Trạng thái thưởng</h4>
            <ThreeSegmentProgress claimed={claimed} approved={user.approved_reward} pending={user.pending_rewards} total={user.total_camly_rewards} />
          </div>
        </div>

        {/* Activity & Financials */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-t border-border pt-3">
          <div><span className="text-muted-foreground">Posts:</span> <span className="font-medium">{user.posts_count}</span></div>
          <div><span className="text-muted-foreground">Videos:</span> <span className="font-medium">{user.videos_count}</span></div>
          <div><span className="text-muted-foreground">Comments:</span> <span className="font-medium">{user.comments_count}</span></div>
          <div><span className="text-muted-foreground">Views:</span> <span className="font-medium">{user.views_count}</span></div>
          <div><span className="text-muted-foreground">Likes:</span> <span className="font-medium">{user.likes_count}</span></div>
          <div><span className="text-muted-foreground">Shares:</span> <span className="font-medium">{user.shares_count}</span></div>
          <div><span className="text-muted-foreground">Đã gửi:</span> <span className="font-medium">{user.donations_sent_count} ({fmt(user.donations_sent_total)})</span></div>
          <div><span className="text-muted-foreground">Đã nhận:</span> <span className="font-medium">{user.donations_received_count} ({fmt(user.donations_received_total)})</span></div>
        </div>
        <div className="flex items-center gap-3 border-t border-border pt-3">
          <span className="text-sm"><span className="text-muted-foreground">FUN:</span> <span className="font-medium">{user.mint_requests_count} requests · {fmt(user.minted_fun_total)} minted</span></span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(`/user/${user.user_id}`)}>
            <ExternalLink className="w-3 h-3 mr-1" />Xem Profile
          </Button>
        </div>
      </div>
    );
  };

  // Mobile
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm user..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={!!exporting}>
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportCSV} disabled={!!exporting} className="gap-2 cursor-pointer"><FileSpreadsheet className="h-4 w-4 text-green-600" />CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF} disabled={!!exporting} className="gap-2 cursor-pointer"><FileText className="h-4 w-4 text-red-600" />PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" onClick={refetch}><RefreshCw className="w-4 h-4" /></Button>
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} users</p>
        {paginate(filtered, currentPage).paged.map(user => (
          <Collapsible key={user.user_id} open={expandedId === user.user_id} onOpenChange={() => setExpandedId(expandedId === user.user_id ? null : user.user_id)}>
            <Card className="p-3">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-3">
                  {(() => {
                    const profileUrl = getProfileUrl(user.username, user.user_id);
                    return profileUrl ? (
                      <a href={profileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>{user.display_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                      </a>
                    ) : (
                      <Avatar className="h-10 w-10 opacity-50">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>{user.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                    );
                  })()}
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
        <AdminPagination currentPage={currentPage} totalPages={paginate(filtered, currentPage).totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>
    );
  }

  // Desktop
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm user..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!!exporting} className="gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Xuất dữ liệu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportCSV} disabled={!!exporting} className="gap-2 cursor-pointer"><FileSpreadsheet className="h-4 w-4 text-green-600" />CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={exportPDF} disabled={!!exporting} className="gap-2 cursor-pointer"><FileText className="h-4 w-4 text-red-600" />PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={refetch}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} users</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("posts_count")}>Hoạt động<SortIcon k="posts_count" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("total_camly_rewards")}>CAMLY<SortIcon k="total_camly_rewards" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("minted_fun_total")}>FUN<SortIcon k="minted_fun_total" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("donations_sent_total")}>Gửi<SortIcon k="donations_sent_total" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("donations_received_total")}>Nhận<SortIcon k="donations_received_total" /></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginate(filtered, currentPage).paged.map(user => {
            const isAnomaly = (user.pending_rewards || 0) > 500000 || ((user.videos_count || 0) === 0 && user.total_camly_rewards > 2000000);
            return (
            <Collapsible key={user.user_id} asChild open={expandedId === user.user_id} onOpenChange={() => setExpandedId(expandedId === user.user_id ? null : user.user_id)}>
              <>
                <TableRow
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    isAnomaly && "bg-amber-500/10 border-l-4 border-amber-500"
                  )}
                  onClick={() => setExpandedId(expandedId === user.user_id ? null : user.user_id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {isAnomaly && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                      {(() => {
                        const profileUrl = getProfileUrl(user.username, user.user_id);
                        return profileUrl ? (
                          <a href={profileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback className="text-xs">{user.display_name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                          </a>
                        ) : (
                          <Avatar className="h-8 w-8 opacity-50">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback className="text-xs">{user.display_name?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                        );
                      })()}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm">{user.display_name || user.username}</p>
                          {user.banned && <Badge variant="destructive" className="text-[10px] h-4">Banned</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.posts_count}P · {user.videos_count}V · {user.comments_count}C</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium text-primary">{fmt(user.total_camly_rewards)}</span>
                      <div className="text-[11px] text-muted-foreground">{fmt(user.pending_rewards)} chờ · {fmt(user.approved_reward)} duyệt</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{fmt(user.minted_fun_total)}</TableCell>
                  <TableCell className="text-sm">{user.donations_sent_count} ({fmt(user.donations_sent_total)})</TableCell>
                  <TableCell className="text-sm">{user.donations_received_count} ({fmt(user.donations_received_total)})</TableCell>
                  <TableCell>{expandedId === user.user_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</TableCell>
                </TableRow>
                {expandedId === user.user_id && (
                  <TableRow><TableCell colSpan={7} className="p-0"><ExpandedDetails user={user} /></TableCell></TableRow>
                )}
              </>
            </Collapsible>
            );
          })}
        </TableBody>
      </Table>
      <AdminPagination currentPage={currentPage} totalPages={paginate(filtered, currentPage).totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
    </div>
  );
}
