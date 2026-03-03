import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { LivePlayer } from "@/components/Live/LivePlayer";
import { LiveChat } from "@/components/Live/LiveChat";
import { LiveReactions } from "@/components/Live/LiveReactions";
import { LiveDonationAlert } from "@/components/Live/LiveDonationAlert";
import { useWebRTCViewer } from "@/hooks/useWebRTC";
import { useLivestream } from "@/hooks/useLivestream";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { LiveBadge } from "@/components/Live/LiveBadge";

const LiveWatch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { livestream, isLoading } = useLivestream(id);
  const { remoteStream, connectionState, connect } = useWebRTCViewer(
    id || "",
    livestream?.user_id || ""
  );

  useEffect(() => {
    if (livestream?.status === "live" && livestream.user_id) {
      connect();
    }
  }, [livestream?.status, livestream?.user_id, connect]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!livestream) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">Không tìm thấy livestream</p>
          <Button variant="outline" onClick={() => navigate("/live")}>
            Xem danh sách Live
          </Button>
        </div>
      </div>
    );
  }

  const isEnded = livestream.status === "ended";

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => {}} />
      <div className="pt-14 max-w-7xl mx-auto px-4 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative">
              {isEnded ? (
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold mb-1">Buổi phát sóng đã kết thúc</p>
                    <p className="text-sm text-muted-foreground">
                      {livestream.vod_video_id ? "Bản ghi đang được xử lý..." : "Không có bản ghi"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <LivePlayer
                    stream={remoteStream}
                    viewerCount={livestream.viewer_count}
                  />
                  <LiveDonationAlert livestreamId={livestream.id} />
                  <div className="absolute bottom-3 right-3">
                    <LiveReactions livestreamId={livestream.id} />
                  </div>
                </>
              )}
            </div>

            {/* Info */}
            <div className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Avatar
                  className="h-10 w-10 cursor-pointer"
                  onClick={() => navigate(`/${livestream.profile?.username}`)}
                >
                  <AvatarImage src={livestream.profile?.avatar_url || ""} />
                  <AvatarFallback>
                    {(livestream.profile?.display_name || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-lg font-bold line-clamp-1">{livestream.title}</h1>
                    {!isEnded && <LiveBadge size="sm" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {livestream.profile?.display_name || livestream.profile?.username}
                  </p>
                  {livestream.description && (
                    <p className="text-sm text-muted-foreground mt-2">{livestream.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="h-[calc(100vh-12rem)]">
            <LiveChat livestreamId={livestream.id} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveWatch;
