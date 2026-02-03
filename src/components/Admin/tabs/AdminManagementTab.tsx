import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Shield, UserPlus, Trash2, Search, Loader2 } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Fetch all admin and owner roles
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "owner"]);

      if (error) throw error;

      if (roles && roles.length > 0) {
        // Fetch profiles for these users
        const userIds = roles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);

        const adminList: AdminUser[] = roles.map((r) => {
          const profile = profiles?.find((p) => p.id === r.user_id);
          return {
            id: r.user_id,
            username: profile?.username || "Unknown",
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

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Filter out existing admins/owners
      const existingIds = admins.map((a) => a.id);
      const filtered = data?.filter((u) => !existingIds.includes(u.id)) || [];
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
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
      setSearchQuery("");
      setSearchResults([]);
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
            <div className="flex gap-2">
              <Input
                placeholder="Tìm theo username hoặc tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((u) => (
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
                          Thêm Admin
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Danh Sách Admin ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
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
                <span className="text-amber-500 font-medium">Owner:</span> Có thể thêm/xóa Admin, truy cập toàn bộ Admin Dashboard
              </li>
              <li>
                <span className="text-primary font-medium">Admin:</span> Truy cập Admin Dashboard, quản lý users/videos/rewards
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagementTab;
