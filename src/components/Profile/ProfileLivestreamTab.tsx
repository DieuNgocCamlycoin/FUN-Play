import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Radio, Eye, Clock, Users } from "lucide-react";
import { LiveBadge } from "@/components/Live/LiveBadge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ProfileLivestreamTabProps {
  userId: string;
}

export const ProfileLivestreamTab = ({ userId }: ProfileLivestreamTabProps) => {
  const navigate = useNavigate();

  const { data: livestreams, isLoading } = useQuery({
    queryKey: ["profile-livestreams", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("livestreams")
        .select("*, videos(id, video_url, thumbnail_url)")
        .eq("user_id", userId)
        .in("status", ["ended", "live"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const handleClick = (ls: any) => {
    if (ls.status === "live") {
      navigate(`/live/${ls.id}`);
    } else if (ls.vod_video_id) {
      navigate(`/video/${ls.vod_video_id}`);
    }
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins} phút`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h${remainMins > 0 ? remainMins + "p" : ""}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!livestreams || livestreams.length === 0) {
    return (
      <div className="text-center py-12">
        <Radio className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có Livestream nào</h3>
        <p className="text-muted-foreground text-sm">
          Các buổi phát sóng sẽ hiển thị tại đây 🎥
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
      {livestreams.map((ls) => {
        const thumbnail = ls.thumbnail_url || (ls.videos as any)?.thumbnail_url;
        const duration = formatDuration(ls.started_at, ls.ended_at);
        const hasVod = !!ls.vod_video_id;
        const isLive = ls.status === "live";

        return (
          <div
            key={ls.id}
            onClick={() => handleClick(ls)}
            className={`group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all cursor-pointer ${
              !hasVod && !isLive ? "opacity-70 cursor-default" : ""
            }`}
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-muted relative">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={ls.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Radio className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1.5">
                {isLive && <LiveBadge size="sm" />}
                {hasVod && !isLive && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground font-semibold rounded">
                    VOD
                  </span>
                )}
              </div>

              {/* Duration */}
              {duration && !isLive && (
                <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 bg-background/80 text-foreground rounded font-medium">
                  {duration}
                </span>
              )}

              {/* Live viewer count */}
              {isLive && (
                <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 bg-destructive/90 text-destructive-foreground rounded font-medium flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {ls.viewer_count}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-3 space-y-1">
              <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {ls.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {ls.started_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(ls.started_at), { addSuffix: true, locale: vi })}
                  </span>
                )}
                {ls.peak_viewers > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {ls.peak_viewers}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
