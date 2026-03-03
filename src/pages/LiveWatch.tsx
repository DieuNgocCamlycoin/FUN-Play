import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { LivePlayer } from "@/components/Live/LivePlayer";
import { LiveChat } from "@/components/Live/LiveChat";
import { LiveReactions } from "@/components/Live/LiveReactions";
import { LiveDonationAlert } from "@/components/Live/LiveDonationAlert";
import { useWebRTCViewer } from "@/hooks/useWebRTC";
import { useLivestream } from "@/hooks/useLivestream";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, RefreshCw } from "lucide-react";
import { LiveBadge } from "@/components/Live/LiveBadge";
import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";
import { supabase } from "@/integrations/supabase/client";

const LiveWatch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { livestream, isLoading } = useLivestream(id);
  const { remoteStream, connectionState, connect, reconnectAttempts, maxReconnectAttempts, manualRetry } = useWebRTCViewer(
    id || "",
    livestream?.user_id || ""
  );
  const [donateModalOpen, setDonateModalOpen] = useState(false);

  useEffect(() => {
    if (livestream?.status === "live" && livestream.user_id) {
      const heartbeat = livestream.last_heartbeat_at
        ? new Date(livestream.last_heartbeat_at).getTime()
        : null;
      const isZombie = heartbeat && Date.now() - heartbeat > 60_000;

      if (!isZombie) {
        connect();
      }
    }
  }, [livestream?.status, livestream?.user_id, connect]);

  const handleDonationSuccess = async (transaction: any) => {
    if (!id) return;
    try {
      await supabase.from("livestream_chat").insert({
        livestream_id: id,
        user_id: transaction.sender_id,
        content: `💝 Đã tặng ${transaction.amount} CAMLY${transaction.message ? ` - "${transaction.message}"` : ""}`,
        message_type: "donation",
      });
    } catch (err) {
      console.error("Failed to send donation chat message:", err);
    }
  };

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
  const isReconnecting = (connectionState === "disconnected" || connectionState === "failed") && reconnectAttempts > 0 && reconnectAttempts <= maxReconnectAttempts;
  const isConnectionFailed = reconnectAttempts > maxReconnectAttempts;

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
                    className="aspect-video md:aspect-video"
                  />
                  <LiveDonationAlert livestreamId={livestream.id} />
                  <div className="absolute bottom-3 right-3">
                    <LiveReactions livestreamId={livestream.id} />
                  </div>

                  {/* Reconnection overlay */}
                  {isReconnecting && (
                    <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                      <div className="text-center text-white">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="font-medium">Đang kết nối lại...</p>
                        <p className="text-sm text-white/70">Lần {reconnectAttempts}/{maxReconnectAttempts}</p>
                      </div>
                    </div>
                  )}
                  {isConnectionFailed && (
                    <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                      <div className="text-center text-white">
                        <p className="font-medium mb-2">Không thể kết nối</p>
                        <Button variant="outline" size="sm" onClick={manualRetry} className="text-white border-white/30">
                          <RefreshCw className="h-4 w-4 mr-1" /> Thử lại
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Info */}
            <div className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Avatar
                  className="h-10 w-10 cursor-pointer shrink-0"
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
                    <p className="text-sm text-muted-foreground mt-2 hidden sm:block">{livestream.description}</p>
                  )}
                </div>

                {/* Donate button */}
                {!isEnded && user && livestream.user_id !== user.id && (
                  <Button
                    onClick={() => setDonateModalOpen(true)}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 shrink-0"
                    size="sm"
                  >
                    <Gift className="h-4 w-4" />
                    <span className="hidden sm:inline">Tặng CAMLY</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="h-[50vh] lg:h-[calc(100vh-12rem)]">
            <LiveChat livestreamId={livestream.id} streamerId={livestream.user_id} className="h-full" />
          </div>
        </div>
      </div>

      {/* Donate Modal */}
      <EnhancedDonateModal
        open={donateModalOpen}
        onOpenChange={setDonateModalOpen}
        defaultReceiverId={livestream.user_id}
        defaultReceiverName={livestream.profile?.display_name || livestream.profile?.username || "Streamer"}
        defaultReceiverAvatar={livestream.profile?.avatar_url || undefined}
        contextType="livestream"
        contextId={livestream.id}
        onSuccess={handleDonationSuccess}
      />
    </div>
  );
};

export default LiveWatch;
