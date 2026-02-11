import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, BellOff, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  thumbnail_url: string | null;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

const FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "comment", label: "Bình luận" },
  { key: "subscription", label: "Kênh đăng ký" },
  { key: "reward", label: "Phần thưởng" },
] as const;

type FilterKey = typeof FILTER_TABS[number]["key"];

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchNotifications();
      const channel = supabase
        .channel('user-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, authLoading]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        const actorIds = [...new Set(data.filter(n => n.actor_id).map(n => n.actor_id!))];
        let actorsMap = new Map();
        if (actorIds.length > 0) {
          const { data: actors } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url")
            .in("id", actorIds);
          actorsMap = new Map(actors?.map(a => [a.id, a]) || []);
        }

        setNotifications(data.map(n => ({
          ...n,
          actor: n.actor_id ? actorsMap.get(n.actor_id) : undefined,
        })));
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user!.id)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast({ title: "Đã đánh dấu tất cả đã đọc" });
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.link) navigate(notif.link);
  };


  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = activeFilter === "all"
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeFilter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                "rounded-full shrink-0 text-sm",
                activeFilter === tab.key && "bg-primary text-primary-foreground"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notifications list */}
        {!loading && filteredNotifications.length > 0 && (
          <div className="space-y-1">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  notif.is_read
                    ? "hover:bg-muted/50"
                    : "bg-primary/5 hover:bg-primary/10"
                }`}
              >
                {notif.actor?.avatar_url ? (
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={notif.actor.avatar_url} />
                    <AvatarFallback>{notif.actor.display_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.is_read ? 'text-foreground' : 'text-foreground font-semibold'}`}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatTimestamp(notif.created_at)}
                  </p>
                </div>

                {notif.thumbnail_url && (
                  <img
                    src={notif.thumbnail_url}
                    alt=""
                    className="w-20 h-12 rounded object-cover shrink-0"
                  />
                )}

                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BellOff className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {activeFilter === "all" ? "Chưa có thông báo" : "Không có thông báo trong mục này"}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {activeFilter === "all"
                ? "Thông báo về video mới, bình luận và hoạt động sẽ xuất hiện ở đây."
                : "Thử chọn mục khác để xem thông báo."}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Notifications;
