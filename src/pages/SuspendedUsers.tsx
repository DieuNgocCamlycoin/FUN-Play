import { useState, useMemo } from "react";
import { usePublicSuspendedList } from "@/hooks/usePublicSuspendedList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ShieldBan, Wallet, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";


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
  const { bannedUsers, blacklistedWallets, isLoading } = usePublicSuspendedList();
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!search) return bannedUsers;
    const q = search.toLowerCase();
    return bannedUsers.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.display_name?.toLowerCase().includes(q) ||
        u.ban_reason?.toLowerCase().includes(q)
    );
  }, [bannedUsers, search]);

  const filteredWallets = useMemo(() => {
    if (!search) return blacklistedWallets;
    const q = search.toLowerCase();
    return blacklistedWallets.filter(
      (w) =>
        w.wallet_address.toLowerCase().includes(q) ||
        w.reason?.toLowerCase().includes(q)
    );
  }, [blacklistedWallets, search]);

  return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <ShieldBan className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Danh sách đình chỉ
              </h1>
              <Badge variant="secondary" className="text-sm">
                {bannedUsers.length + blacklistedWallets.length}
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

          {/* Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="users" className="gap-2">
                <ShieldBan className="h-4 w-4" />
                Tài khoản ({bannedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="wallets" className="gap-2">
                <Wallet className="h-4 w-4" />
                Ví ({blacklistedWallets.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Banned Users */}
            <TabsContent value="users">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldBan className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Không tìm thấy tài khoản nào.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <Avatar className="h-12 w-12 opacity-40 grayscale">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {(user.display_name || user.username || "?")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground line-through decoration-destructive/50">
                            {user.display_name || user.username}
                          </span>
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                          {violationBadge(user.violation_level)}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                          <span className="truncate">{user.ban_reason || "Vi phạm quy định"}</span>
                        </div>
                        {user.banned_at && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {format(new Date(user.banned_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Blacklisted Wallets */}
            <TabsContent value="wallets">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredWallets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Không tìm thấy ví nào.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredWallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <Wallet className="h-5 w-5 text-destructive" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono text-foreground">
                            {truncateAddress(wallet.wallet_address)}
                          </code>
                          <Badge
                            variant="outline"
                            className={
                              wallet.is_permanent
                                ? "bg-destructive/20 text-destructive border-destructive/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            }
                          >
                            {wallet.is_permanent ? "Vĩnh viễn" : "Tạm thời"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {wallet.reason || "Không rõ lý do"}
                        </p>
                        {wallet.created_at && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {format(new Date(wallet.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
};

export default SuspendedUsers;
