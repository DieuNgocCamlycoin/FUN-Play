import { useState, useMemo } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { usePublicUsersDirectory, PublicUserStat } from "@/hooks/usePublicUsersDirectory";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, ArrowUpDown, MessageSquare, Video, Heart, Eye, Share2, Gift, Coins, BadgeCheck, Calendar, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, subDays } from "date-fns";

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

function claimPercent(u: PublicUserStat): number {
  if (u.total_camly_rewards <= 0) return 0;
  return Math.min(100, Math.round((u.claimed_camly / u.total_camly_rewards) * 100));
}

const UsersDirectory = () => {
  const { data, loading, error } = usePublicUsersDirectory();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("camly");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
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

  const goToProfile = (u: PublicUserStat) => {
    if (u.username) navigate(`/@${u.username}`);
    else navigate(`/user/${u.user_id}`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Users Directory</h1>
              <p className="text-sm text-muted-foreground">{filtered.length} / {data.length} thành viên</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={timeFilter} onValueChange={v => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeFilterOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={v => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <Card><CardContent className="py-8 text-center text-destructive">{error}</CardContent></Card>
        )}

        {/* Desktop Table */}
        {!loading && !error && !isMobile && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1"><Coins className="h-3.5 w-3.5 text-amber-500" /> Tổng</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Đã nhận</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1"><Clock className="h-3.5 w-3.5 text-orange-500" /> Chưa nhận</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1"><Eye className="h-3.5 w-3.5" /> Views</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1"><Video className="h-3.5 w-3.5" /> Videos</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1"><Gift className="h-3.5 w-3.5" /> Tặng</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1"><Coins className="h-3.5 w-3.5" /> FUN</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u, i) => (
                  <TableRow key={u.user_id} className="cursor-pointer hover:bg-muted/50" onClick={() => goToProfile(u)}>
                    <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback>{(u.display_name || u.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium truncate">{u.display_name || u.username}</span>
                            {u.avatar_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                          </div>
                          <span className="text-xs text-muted-foreground">@{u.username}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-600">{fmt(u.total_camly_rewards)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">{fmt(u.claimed_camly)}</TableCell>
                    <TableCell className="text-right font-medium text-orange-500">{fmt(u.unclaimed_camly)}</TableCell>
                    <TableCell className="text-right">{fmt(u.views_count)}</TableCell>
                    <TableCell className="text-right">{fmt(u.videos_count)}</TableCell>
                    <TableCell className="text-right">{fmt(u.donations_sent_total)}</TableCell>
                    <TableCell className="text-right text-primary font-medium">{fmt(u.minted_fun_total)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy user nào
                    </TableCell>
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
              <Card key={u.user_id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => goToProfile(u)}>
                <CardContent className="p-4 space-y-3">
                  {/* User info */}
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback>{(u.display_name || u.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{u.display_name || u.username}</span>
                        {u.avatar_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <span className="text-xs text-muted-foreground">@{u.username}</span>
                    </div>
                  </div>

                  {/* CAMLY Breakdown */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-amber-600 flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" /> {fmt(u.total_camly_rewards)} CAMLY
                      </span>
                      <span className="text-xs text-muted-foreground">{claimPercent(u)}% đã nhận</span>
                    </div>
                    <Progress value={claimPercent(u)} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Đã nhận: {fmt(u.claimed_camly)}
                      </span>
                      <span className="text-orange-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Chưa nhận: {fmt(u.unclaimed_camly)}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3" /> Views: <span className="text-foreground font-medium">{fmt(u.views_count)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Video className="h-3 w-3" /> Videos: <span className="text-foreground font-medium">{fmt(u.videos_count)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" /> Comments: <span className="text-foreground font-medium">{fmt(u.comments_count)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Heart className="h-3 w-3" /> Likes: <span className="text-foreground font-medium">{fmt(u.likes_count)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gift className="h-3 w-3" /> Đã tặng: <span className="text-foreground font-medium">{fmt(u.donations_sent_total)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gift className="h-3 w-3" /> Được nhận: <span className="text-foreground font-medium">{fmt(u.donations_received_total)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-3 w-3 text-primary" /> FUN: <span className="text-primary font-medium">{fmt(u.minted_fun_total)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Share2 className="h-3 w-3" /> Shares: <span className="text-foreground font-medium">{fmt(u.shares_count)}</span>
                    </div>
                  </div>

                  {/* Join date */}
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1 border-t border-border">
                    <Calendar className="h-3 w-3" /> Tham gia: {format(new Date(u.created_at), "dd/MM/yyyy")}
                  </div>
                </CardContent>
              </Card>
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
