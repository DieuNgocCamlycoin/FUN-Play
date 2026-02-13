import { useState, useMemo } from "react";
import funplayPlanetLogo from "@/assets/funplay-planet-logo.png";
import { MainLayout } from "@/components/Layout/MainLayout";
import { usePublicUsersDirectory, PublicUserStat } from "@/hooks/usePublicUsersDirectory";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Users, Search, ArrowUpDown, BadgeCheck, Calendar, ChevronDown, ChevronUp, ExternalLink, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, subDays } from "date-fns";
import { RewardBreakdownGrid, ThreeSegmentProgress } from "@/components/Rewards/RewardBreakdownGrid";

type SortKey = "camly" | "posts" | "videos" | "donations_sent" | "donations_received" | "fun_minted" | "activity";
type TimeFilter = "all" | "week" | "month" | "3months";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "camly", label: "CAMLY Rewards" },
  { value: "activity", label: "Hoạt động" },
  { value: "videos", label: "Videos" },
  { value: "posts", label: "Bài viết" },
  { value: "donations_sent", label: "Đã tặng" },
  { value: "donations_received", label: "Được nhận" },
  { value: "fun_minted", label: "FUN Minted" },
];

const timeFilterOptions: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "3months", label: "3 tháng" },
];

function getSortValue(u: PublicUserStat, key: SortKey): number {
  switch (key) {
    case "camly": return u.total_camly_rewards;
    case "posts": return u.posts_count;
    case "videos": return u.videos_count;
    case "donations_sent": return u.donations_sent_total;
    case "donations_received": return u.donations_received_total;
    case "fun_minted": return u.minted_fun_total;
    case "activity": return u.views_count + u.likes_count + u.comments_count + u.shares_count;
    default: return 0;
  }
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

const UsersDirectory = () => {
  const { data, loading, error } = usePublicUsersDirectory();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("camly");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const now = new Date();
    let cutoff: Date | null = null;
    if (timeFilter === "week") cutoff = subDays(now, 7);
    else if (timeFilter === "month") cutoff = subDays(now, 30);
    else if (timeFilter === "3months") cutoff = subDays(now, 90);

    return data
      .filter(u => {
        if (q && !(u.display_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q))) return false;
        if (cutoff && new Date(u.created_at) < cutoff) return false;
        return true;
      })
      .sort((a, b) => getSortValue(b, sortBy) - getSortValue(a, sortBy));
  }, [data, search, sortBy, timeFilter]);

  const goToChannel = (e: React.MouseEvent, u: PublicUserStat) => {
    e.stopPropagation();
    navigate(u.username ? `/c/${u.username}` : `/channel/${u.user_id}`);
  };

  const goToProfile = (u: PublicUserStat) => {
    navigate(u.username ? `/c/${u.username}` : `/user/${u.user_id}`);
  };

  const ExpandedRow = ({ u }: { u: PublicUserStat }) => {
    const claimed = u.claimed_camly;
    const unclaimed = u.unclaimed_camly;
    // approximate approved vs pending from unclaimed (public view doesn't have this split)
    const total = u.total_camly_rewards;

    return (
      <div className="p-4 bg-muted/20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-amber-500" /> Phân rã CAMLY theo hoạt động
            </h4>
            <RewardBreakdownGrid breakdown={u} />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold mb-2">Tiến trình nhận thưởng</h4>
            <ThreeSegmentProgress claimed={claimed} approved={0} pending={unclaimed} total={total} />
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2">
              <div>📝 Bài viết: <span className="text-foreground font-medium">{fmt(u.posts_count)}</span></div>
              <div>🎬 Videos: <span className="text-foreground font-medium">{fmt(u.videos_count)}</span></div>
              <div>💬 Comments: <span className="text-foreground font-medium">{fmt(u.comments_count)}</span></div>
              <div>👁 Views: <span className="text-foreground font-medium">{fmt(u.views_count)}</span></div>
              <div>🎁 Đã tặng: <span className="text-foreground font-medium">{fmt(u.donations_sent_total)}</span></div>
              <div>🎁 Được nhận: <span className="text-foreground font-medium">{fmt(u.donations_received_total)}</span></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => goToProfile(u)}>
                <ExternalLink className="w-3 h-3 mr-1" /> Xem Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img src={funplayPlanetLogo} alt="FUN Play" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Users Directory</h1>
              <p className="text-sm text-muted-foreground">{filtered.length} / {data.length} thành viên</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo tên hoặc username..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={timeFilter} onValueChange={v => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeFilterOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={v => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        )}

        {error && (
          <Card><CardContent className="py-8 text-center text-destructive">{error}</CardContent></Card>
        )}

        {/* Desktop Table */}
        {!loading && !error && !isMobile && (
          <Card className="max-h-[calc(100vh-220px)] overflow-auto">
            <Table wrapperClassName="overflow-visible">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">👁 Views</TableHead>
                  <TableHead className="text-right">👍 Likes</TableHead>
                  <TableHead className="text-right">💬 Comments</TableHead>
                  <TableHead className="text-right">🔗 Shares</TableHead>
                  <TableHead className="text-right">Tổng CAMLY</TableHead>
                  <TableHead className="text-right">Videos</TableHead>
                  <TableHead className="text-right">FUN</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u, i) => (
                  <Collapsible key={u.user_id} asChild open={expandedId === u.user_id} onOpenChange={() => setExpandedId(expandedId === u.user_id ? null : u.user_id)}>
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedId(expandedId === u.user_id ? null : u.user_id)}>
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div onClick={(e) => goToChannel(e, u)} className="cursor-pointer rounded-full ring-2 ring-transparent hover:ring-primary/50 transition-all">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={u.avatar_url || undefined} />
                                <AvatarFallback>{(u.display_name || u.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium truncate">{u.display_name || u.username}</span>
                                {u.avatar_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                              </div>
                              <span className="text-xs text-muted-foreground">@{u.username}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{fmt(u.views_count)}</TableCell>
                        <TableCell className="text-right">{fmt(u.likes_count)}</TableCell>
                        <TableCell className="text-right">{fmt(u.comments_count)}</TableCell>
                        <TableCell className="text-right">{fmt(u.shares_count)}</TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">{fmt(u.total_camly_rewards)}</TableCell>
                        <TableCell className="text-right">{fmt(u.videos_count)}</TableCell>
                        <TableCell className="text-right text-primary font-medium">{fmt(u.minted_fun_total)}</TableCell>
                        <TableCell>
                          {expandedId === u.user_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </TableCell>
                      </TableRow>
                      {expandedId === u.user_id && (
                        <TableRow>
                          <TableCell colSpan={10} className="p-0">
                            <ExpandedRow u={u} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  </Collapsible>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Không tìm thấy user nào</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Mobile Cards */}
        {!loading && !error && isMobile && (
          <div className="space-y-3">
            {filtered.map((u, i) => (
              <Collapsible key={u.user_id} open={expandedId === u.user_id} onOpenChange={() => setExpandedId(expandedId === u.user_id ? null : u.user_id)}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div onClick={(e) => goToChannel(e, u)} className="cursor-pointer rounded-full ring-2 ring-transparent hover:ring-primary/50 transition-all">
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback>{(u.display_name || u.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">{i + 1}</span>
                        </div>
                         <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                             <span className="font-semibold truncate">{u.display_name || u.username}</span>
                             {u.avatar_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                           </div>
                           <span className="text-xs text-muted-foreground">@{u.username}</span>
                           <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                             <span>👁 {fmt(u.views_count)}</span>
                             <span>👍 {fmt(u.likes_count)}</span>
                             <span>💬 {fmt(u.comments_count)}</span>
                             <span>🔗 {fmt(u.shares_count)}</span>
                           </div>
                         </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-amber-600 text-sm">{fmt(u.total_camly_rewards)}</p>
                          <p className="text-[10px] text-muted-foreground">CAMLY</p>
                        </div>
                        {expandedId === u.user_id ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      <ThreeSegmentProgress claimed={u.claimed_camly} approved={0} pending={u.unclaimed_camly} total={u.total_camly_rewards} />
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chi tiết thưởng theo hoạt động</h4>
                      <RewardBreakdownGrid breakdown={u} compact />
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                        <div>🎬 Videos: <span className="text-foreground font-medium">{fmt(u.videos_count)}</span></div>
                        <div>👁 Views: <span className="text-foreground font-medium">{fmt(u.views_count)}</span></div>
                        <div>🎁 Tặng: <span className="text-foreground font-medium">{fmt(u.donations_sent_total)}</span></div>
                        <div>🎁 Nhận: <span className="text-foreground font-medium">{fmt(u.donations_received_total)}</span></div>
                        <div>💎 FUN: <span className="text-primary font-medium">{fmt(u.minted_fun_total)}</span></div>
                        <div>📅 {format(new Date(u.created_at), "dd/MM/yyyy")}</div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
            {filtered.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Không tìm thấy user nào</CardContent></Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UsersDirectory;
