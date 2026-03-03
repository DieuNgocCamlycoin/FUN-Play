import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { GoLiveForm } from "@/components/Live/GoLiveForm";
import { LivePlayer } from "@/components/Live/LivePlayer";
import { useWebRTCStreamer } from "@/hooks/useWebRTC";
import { useCreateLivestream } from "@/hooks/useLivestream";
import { useAuth } from "@/hooks/useAuth";
import { LiveChat } from "@/components/Live/LiveChat";
import { LiveReactions } from "@/components/Live/LiveReactions";
import { LiveDonationAlert } from "@/components/Live/LiveDonationAlert";
import { LiveBadge } from "@/components/Live/LiveBadge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Gift, PhoneOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

type Phase = "setup" | "preview" | "live";

const GoLive = () => {
  const [phase, setPhase] = useState<Phase>("setup");
  const [livestreamId, setLivestreamId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { localStream, viewerCount, startCamera, stopCamera, startStreaming, stopStreaming, isStreaming } = useWebRTCStreamer(livestreamId || "");
  const { createLivestream, goLive, endLive } = useCreateLivestream();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Elapsed timer
  useEffect(() => {
    if (phase !== "live") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleFormSubmit = useCallback(
    async (data: { title: string; description?: string; category?: string }) => {
      try {
        const ls = await createLivestream(data);
        setLivestreamId(ls.id);
        await startCamera();
        setPhase("preview");
        toast.success("Camera sẵn sàng! Xem trước và bắt đầu phát sóng.");
      } catch (err: any) {
        toast.error(err?.message || "Không thể bật camera");
      }
    },
    [createLivestream, startCamera]
  );

  const handleGoLive = useCallback(async () => {
    if (!livestreamId) return;
    try {
      await goLive(livestreamId);
      await startStreaming();
      setPhase("live");
      toast.success("🔴 Đang phát sóng trực tiếp!");
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi bắt đầu phát sóng");
    }
  }, [livestreamId, goLive, startStreaming]);

  const handleEndLive = useCallback(async () => {
    if (!livestreamId) return;
    try {
      stopStreaming();
      stopCamera();
      await endLive(livestreamId);
      toast.success("Đã kết thúc phát sóng");
      navigate("/studio");
    } catch (err: any) {
      toast.error("Lỗi khi kết thúc");
    }
  }, [livestreamId, stopStreaming, stopCamera, endLive, navigate]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => {}} />
      <div className="pt-14 max-w-7xl mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>

        {phase === "setup" && (
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <LiveBadge size="lg" pulse={false} />
              Phát sóng trực tiếp
            </h1>
            <GoLiveForm onSubmit={handleFormSubmit} />
          </div>
        )}

        {(phase === "preview" || phase === "live") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main video area */}
            <div className="lg:col-span-2 space-y-3">
              <div className="relative">
                <LivePlayer
                  stream={localStream}
                  isLocal
                  viewerCount={viewerCount}
                />
                {phase === "live" && livestreamId && (
                  <>
                    <LiveDonationAlert livestreamId={livestreamId} />
                    <div className="absolute bottom-3 right-3">
                      <LiveReactions livestreamId={livestreamId} />
                    </div>
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between bg-background border border-border rounded-xl p-3">
                <div className="flex items-center gap-4 text-sm">
                  {phase === "live" && (
                    <>
                      <div className="flex items-center gap-1.5 text-destructive font-medium">
                        <Clock className="h-4 w-4" />
                        {formatTime(elapsed)}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {viewerCount} người xem
                      </div>
                    </>
                  )}
                </div>

                {phase === "preview" && (
                  <Button onClick={handleGoLive} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    🔴 Bắt đầu phát sóng
                  </Button>
                )}
                {phase === "live" && (
                  <Button variant="outline" onClick={handleEndLive} className="text-destructive border-destructive/30">
                    <PhoneOff className="h-4 w-4 mr-1" /> Kết thúc
                  </Button>
                )}
              </div>
            </div>

            {/* Chat panel */}
            <div className="h-[calc(100vh-12rem)]">
              {livestreamId && <LiveChat livestreamId={livestreamId} className="h-full" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoLive;
