import { useState, useMemo } from "react";
import { usePublicSuspendedList } from "@/hooks/usePublicSuspendedList";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ShieldBan, AlertTriangle, Wallet } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { SuspendedEntry } from "@/hooks/usePublicSuspendedList";

const violationBadge = (level: number | null) => {
  if (!level) return null;
  const config: Record<number, { label: string; className: string }> = {
    1: { label: "Nhẹ", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    2: { label: "Nghiêm trọng", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    3: { label: "Vĩnh viễn", className: "bg-destructive/20 text-destructive border-destructive/30" },
  };
  const c = config[level] || config[3];
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
};

const truncateAddress = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

const SuspendedUsers = () => {
  const { mergedEntries, totalCount, isLoading } = usePublicSuspendedList();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return mergedEntries;
    const q = search.toLowerCase();
    return mergedEntries.filter(
      (e) =>
        e.username?.toLowerCase().includes(q) ||
        e.display_name?.toLowerCase().includes(q) ||
        e.ban_reason?.toLowerCase().includes(q) ||
        e.wallets.some((w) => w.wallet_address.toLowerCase().includes(q))
    );
  }, [mergedEntries, search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <ShieldBan className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Danh sách đình chỉ
            </h1>
            <Badge variant="secondary" className="text-sm">
              {totalCount}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            FUN Play cam kết minh bạch tuyệt đối. Tất cả tài khoản bị đình chỉ và ví bị chặn đều được công khai tại đây.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, username, địa chỉ ví..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldBan className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Không tìm thấy kết quả nào.</p>
          </div>
        ) : (
          <Table wrapperClassName="border border-border rounded-lg">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 hidden md:table-cell">#</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Ví liên kết</TableHead>
                <TableHead className="hidden sm:table-cell">Lý do</TableHead>
                <TableHead className="hidden sm:table-cell">Mức độ</TableHead>
                <TableHead className="hidden md:table-cell">Ngày đình chỉ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry, idx) => (
                <SuspendedRow key={entry.user_id || `orphan-${idx}`} entry={entry} index={idx + 1} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

function SuspendedRow({ entry, index }: { entry: SuspendedEntry; index: number }) {
  const isOrphan = !entry.user_id;

  return (
    <TableRow>
      {/* # */}
      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
        {index}
      </TableCell>

      {/* User */}
      <TableCell>
        <div className="flex items-center gap-3">
          {isOrphan ? (
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <Avatar className="h-9 w-9 opacity-40 grayscale shrink-0">
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {(entry.display_name || entry.username || "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm text-foreground line-through decoration-destructive/50 truncate">
              {isOrphan ? "Không xác định" : (entry.display_name || entry.username)}
            </p>
            {!isOrphan && (
              <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
            )}
            {/* Mobile-only: show reason & level inline */}
            <div className="flex items-center gap-2 mt-1 sm:hidden">
              <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {entry.ban_reason || "Vi phạm quy định"}
              </span>
              {violationBadge(entry.violation_level)}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Wallets */}
      <TableCell>
        {entry.wallets.length === 0 ? (
          <span className="text-muted-foreground text-xs">—</span>
        ) : (
          <div className="space-y-1">
            {entry.wallets.map((w) => (
              <div key={w.id} className="flex items-center gap-1.5">
                <code className="text-xs font-mono text-foreground/80">
                  {truncateAddress(w.wallet_address)}
                </code>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    w.is_permanent
                      ? "bg-destructive/20 text-destructive border-destructive/30"
                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  }`}
                >
                  {w.is_permanent ? "Vĩnh viễn" : "Tạm thời"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </TableCell>

      {/* Reason - hidden on mobile */}
      <TableCell className="hidden sm:table-cell">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {entry.ban_reason || "Vi phạm quy định"}
          </span>
        </div>
      </TableCell>

      {/* Level - hidden on mobile */}
      <TableCell className="hidden sm:table-cell">
        {violationBadge(entry.violation_level)}
      </TableCell>

      {/* Date - hidden on mobile */}
      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
        {entry.banned_at
          ? format(new Date(entry.banned_at), "dd/MM/yyyy HH:mm", { locale: vi })
          : "—"}
      </TableCell>
    </TableRow>
  );
}

export default SuspendedUsers;
