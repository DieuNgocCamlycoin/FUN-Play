import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Shield, UserPlus, Trash2, Search, Loader2, Mail, User, Users } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin";
}

interface SearchUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const AdminManagementTab = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  
  // Username search
  const [usernameSearch, setUsernameSearch] = useState("");
  const [usernameResults, setUsernameResults] = useState<SearchUser[]>([]);
  const [searchingUsername, setSearchingUsername] = useState(false);
  
  // Email search
  const [emailSearch, setEmailSearch] = useState("");
  const [emailResults, setEmailResults] = useState<SearchUser[]>([]);
  const [searchingEmail, setSearchingEmail] = useState(false);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "owner"]);

      if (error) throw error;

      if (roles && roles.length > 0) {
        const userIds = roles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);

        const adminList: AdminUser[] = roles.map((r) => {
          const profile = profiles?.find((p) => p.id === r.user_id);
          return {
            id: r.user_id,
            username: profile?.username || "Không xác định",
            display_name: profile?.display_name,
            avatar_url: profile?.avatar_url,
            role: r.role as "owner" | "admin",
          };
        });

        setAdmins(adminList);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkOwnerStatus = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("is_owner", { _user_id: user.id });
    setIsOwner(data === true);
  };

  useEffect(() => {
    fetchAdmins();
    checkOwnerStatus();
  }, [user]);

  // Sort admins: Owner first, then by display_name
  const sortedAdmins = useMemo(() => {
    return [...admins].sort((a, b) => {
      if (a.role === "owner" && b.role !== "owner") return -1;
      if (b.role === "owner" && a.role !== "owner") return 1;
      const nameA = a.display_name || a.username;
      const nameB = b.display_name || b.username;
      return nameA.localeCompare(nameB);
    });
  }, [admins]);

  const ownerCount = admins.filter((a) => a.role === "owner").length;
  const adminCount = admins.filter((a) => a.role === "admin").length;

  const searchByUsername = async () => {
    if (!usernameSearch.trim()) return;
    setSearchingUsername(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${usernameSearch}%,display_name.ilike.%${usernameSearch}%`)
        .limit(10);

      if (error) throw error;

      const existingIds = admins.map((a) => a.id);
      const filtered = data?.filter((u) => !existingIds.includes(u.id)) || [];
      setUsernameResults(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Lỗi khi tìm kiếm");
    } finally {
      setSearchingUsername(false);
    }
  };

  const searchByEmail = async () => {
    if (!emailSearch.trim() || emailSearch.trim().length < 3) {
      toast.error("Vui lòng nhập ít nhất 3 ký tự");
      return;
    }
    setSearchingEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-users-by-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email: emailSearch.trim() }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || "Lỗi khi tìm kiếm");
        return;
      }

      setEmailResults(result.users || []);
    } catch (error) {
      console.error("Error searching by email:", error);
      toast.error("Lỗi khi tìm kiếm bằng email");
    } finally {
      setSearchingEmail(false);
    }
  };

  const addAdmin = async (targetUserId: string) => {
    if (!user) return;
    setActionLoading(targetUserId);
    try {
      const { error } = await supabase.rpc("add_admin_role", {
        p_owner_id: user.id,
        p_target_user_id: targetUserId,
      });

      if (error) throw error;

      toast.success("Đã thêm Admin thành công!");
      setUsernameSearch("");
      setUsernameResults([]);
      setEmailSearch("");
      setEmailResults([]);
      await fetchAdmins();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi thêm Admin");
    } finally {
      setActionLoading(null);
    }
  };

  const removeAdmin = async (targetUserId: string) => {
    if (!user) return;
    setActionLoading(targetUserId);
    try {
      const { error } = await supabase.rpc("remove_admin_role", {
        p_owner_id: user.id,
        p_target_user_id: targetUserId,
      });

      if (error) throw error;

      toast.success("Đã xóa quyền Admin!");
      await fetchAdmins();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi xóa Admin");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-amber-500" />
              <div>
                <div className="text-2xl font-bold text-amber-500">{ownerCount}</div>
                <div className="text-sm text-muted-foreground">Owner</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">{adminCount}</div>
                <div className="text-sm text-muted-foreground">Admin</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-muted col-span-2 md:col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{admins.length}</div>
                <div className="text-sm text-muted-foreground">Tổng Team</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Admin Section - Only for Owner */}
      {isOwner && (
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <UserPlus className="w-5 h-5" />
              Thêm Admin Mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="username" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="username" className="gap-2">
                  <User className="w-4 h-4" />
                  Tìm theo tên
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Tìm theo email
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="username" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tìm theo username hoặc tên..."
                    value={usernameSearch}
                    onChange={(e) => setUsernameSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchByUsername()}
                  />
                  <Button onClick={searchByUsername} disabled={searchingUsername}>
                    {searchingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {usernameResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {usernameResults.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback>{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{u.display_name || u.username}</div>
                            <div className="text-sm text-muted-foreground">@{u.username}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addAdmin(u.id)}
                          disabled={actionLoading === u.id}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Thêm
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {usernameSearch && usernameResults.length === 0 && !searchingUsername && (
                  <div className="text-center py-4 text-muted-foreground">
                    Không tìm thấy user hoặc user đã là Admin
                  </div>
                )}
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập email để tìm kiếm..."
                    type="email"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchByEmail()}
                  />
                  <Button onClick={searchByEmail} disabled={searchingEmail}>
                    {searchingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {emailResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {emailResults.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback>{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{u.display_name || u.username}</div>
                            <div className="text-sm text-muted-foreground">@{u.username}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addAdmin(u.id)}
                          disabled={actionLoading === u.id}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Thêm
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {emailSearch && emailResults.length === 0 && !searchingEmail && (
                  <div className="text-center py-4 text-muted-foreground">
                    Không tìm thấy user hoặc user đã là Admin
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Danh Sách Admin Team ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedAdmins.map((admin) => (
              <div
                key={admin.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  admin.role === "owner" 
                    ? "bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/30" 
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={admin.avatar_url || undefined} />
                    <AvatarFallback>{admin.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {admin.display_name || admin.username}
                      </span>
                      {admin.role === "owner" ? (
                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50">
                          <Crown className="w-3 h-3 mr-1" />
                          Owner
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">@{admin.username}</div>
                  </div>
                </div>

                {/* Remove button - Only for Owner, cannot remove Owner */}
                {isOwner && admin.role !== "owner" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAdmin(admin.id)}
                    disabled={actionLoading === admin.id}
                  >
                    {actionLoading === admin.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Xóa Admin
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}

            {admins.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có Admin nào được thêm
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permission Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Phân quyền:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="text-amber-500 font-medium">Owner:</span> Có thể thêm/xóa Admin, tìm kiếm bằng email, truy cập toàn bộ Admin Dashboard
              </li>
              <li>
                <span className="text-primary font-medium">Admin:</span> Xem danh sách team, truy cập Admin Dashboard, quản lý users/videos/rewards
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagementTab;
