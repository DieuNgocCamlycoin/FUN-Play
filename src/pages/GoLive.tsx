import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { GoLiveForm } from "@/components/Live/GoLiveForm";
import { LivePlayer } from "@/components/Live/LivePlayer";
import { StreamerControls } from "@/components/Live/StreamerControls";
import { useWebRTCStreamer } from "@/hooks/useWebRTC";
import { useCreateLivestream } from "@/hooks/useLivestream";
import { useAuth } from "@/hooks/useAuth";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { LiveChat } from "@/components/Live/LiveChat";
import { LiveReactions } from "@/components/Live/LiveReactions";
import { LiveDonationAlert } from "@/components/Live/LiveDonationAlert";
import { LiveBadge } from "@/components/Live/LiveBadge";
import { Button } from "@/components/ui/button";
import { Users, Clock, PhoneOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Phase = "setup" | "preview" | "live";

const GoLive = () => {
  const [phase, setPhase] = useState<Phase>("setup");
  const [livestreamId, setLivestreamId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const {
    localStream, viewerCount, startCamera, stopCamera, startStreaming, stopStreaming, isStreaming,
    isMicOn, isCameraOn, isScreenSharing, toggleMic, toggleCamera, toggleScreenShare,
  } = useWebRTCStreamer(livestreamId || "");
  const { createLivestream, goLive, endLive } = useCreateLivestream();
  const { isRecording, startRecording, stopRecording } = useMediaRecorder();

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
      if (localStream) {
        startRecording(localStream);
      }
      setPhase("live");
      toast.success("🔴 Đang phát sóng trực tiếp!");
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi bắt đầu phát sóng");
    }
  }, [livestreamId, goLive, startStreaming, localStream, startRecording]);

  // beforeunload handler
  useEffect(() => {
    if (phase !== "live" || !livestreamId) return;

    const handleBeforeUnload = () => {
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/livestreams?id=eq.${livestreamId}`,
      );
      supabase
        .from("livestreams")
        .update({ status: "ended", ended_at: new Date().toISOString(), viewer_count: 0 })
        .eq("id", livestreamId);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, livestreamId]);

  const handleEndLive = useCallback(async () => {
    if (!livestreamId) return;
    try {
      const recordedBlob = await stopRecording();
      
      stopStreaming();
      stopCamera();
      await endLive(livestreamId);

      if (recordedBlob && recordedBlob.size > 0 && user) {
        toast.info("Đang lưu bản ghi...");
        const fileName = `vod/${user.id}/${livestreamId}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("videos")
          .upload(fileName, recordedBlob, { contentType: "video/webm" });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("videos").getPublicUrl(fileName);
          const { data: channel } = await supabase.from("channels").select("id").eq("user_id", user.id).single();
          if (channel) {
            const { data: videoData } = await supabase.from("videos").insert({
              title: `[VOD] Livestream`,
              user_id: user.id,
              channel_id: channel.id,
              video_url: urlData.publicUrl,
              status: "published",
            }).select("id").single();

            if (videoData) {
              await supabase.from("livestreams").update({ vod_video_id: videoData.id }).eq("id", livestreamId);
              toast.success("Bản ghi đã được lưu!");
            }
          }
        } else {
          console.error("VOD upload failed:", uploadError);
          toast.error("Không thể lưu bản ghi");
        }
      }

      toast.success("Đã kết thúc phát sóng");
      navigate("/studio");
    } catch (err: any) {
      toast.error("Lỗi khi kết thúc");
    }
  }, [livestreamId, stopRecording, stopStreaming, stopCamera, endLive, navigate, user]);

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
                  className="aspect-video md:aspect-video"
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
              <div className="flex flex-wrap items-center justify-between gap-2 bg-background border border-border rounded-xl p-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {phase === "live" && (
                    <>
                      <div className="flex items-center gap-1.5 text-destructive font-medium">
                        <Clock className="h-4 w-4" />
                        {formatTime(elapsed)}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">{viewerCount} người xem</span>
                        <span className="sm:hidden">{viewerCount}</span>
                      </div>
                      {isRecording && (
                        <div className="flex items-center gap-1.5 text-destructive">
                          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                          <span className="hidden sm:inline">Đang ghi</span>
                        </div>
                      )}
                    </>
                  )}
                  {phase === "live" && (
                    <StreamerControls
                      isMicOn={isMicOn}
                      isCameraOn={isCameraOn}
                      isScreenSharing={isScreenSharing}
                      onToggleMic={toggleMic}
                      onToggleCamera={toggleCamera}
                      onToggleScreenShare={toggleScreenShare}
                    />
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
            <div className="h-[60vh] lg:h-[calc(100vh-12rem)]">
              {livestreamId && <LiveChat livestreamId={livestreamId} streamerId={user.id} className="h-full" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoLive;
