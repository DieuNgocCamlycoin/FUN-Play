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
  const [isEnding, setIsEnding] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const {
    localStream, viewerCount, startCamera, stopCamera, startStreaming, stopStreaming, isStreaming,
    isMicOn, isCameraOn, isScreenSharing, toggleMic, toggleCamera, toggleScreenShare,
    flipCamera,
  } = useWebRTCStreamer(livestreamId || "");
  const { createLivestream, goLive, endLive } = useCreateLivestream();
  const { isRecording, startRecording, stopRecording } = useMediaRecorder();
  const recorderStartedRef = useRef(false);

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
        const name = err?.name || "";
        if (name === "NotAllowedError") {
          toast.error("Bạn chưa cấp quyền camera/mic. Vui lòng vào Cài đặt trình duyệt → cho phép truy cập Camera & Microphone rồi thử lại.");
        } else if (name === "NotFoundError") {
          toast.error("Không tìm thấy camera hoặc microphone trên thiết bị này.");
        } else if (name === "OverconstrainedError") {
          try {
            await startCamera({ facingMode: "user" });
            setPhase("preview");
            toast.success("Camera sẵn sàng (độ phân giải thấp hơn).");
            return;
          } catch {
            toast.error("Camera không tương thích. Vui lòng thử thiết bị khác.");
          }
        } else {
          toast.error(err?.message || "Không thể bật camera");
        }
      }
    },
    [createLivestream, startCamera]
  );

  const handleGoLive = useCallback(async () => {
    if (!livestreamId) return;
    try {
      await goLive(livestreamId);
      await startStreaming();

      // Start recording - block live if recorder fails
      if (localStream) {
        const recOk = startRecording(localStream);
        if (!recOk) {
          toast.warning("Trình duyệt không hỗ trợ ghi VOD. Livestream vẫn hoạt động nhưng không có bản ghi lại.");
          recorderStartedRef.current = false;
        } else {
          recorderStartedRef.current = true;
          console.log("[GoLive] Recorder started successfully");
        }
      } else {
        console.warn("[GoLive] No localStream available for recording");
        recorderStartedRef.current = false;
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
    if (!livestreamId || isEnding) return;
    setIsEnding(true);

    try {
      // Step 1: Stop recording FIRST (before stopping camera/streaming)
      toast.info("⏹️ Đang đóng bản ghi...");
      console.log("[VOD] Step 1 - Stopping recording. recorderStarted:", recorderStartedRef.current);
      const recordedBlob = await stopRecording();
      console.log("[VOD] Step 1 - stopRecording result:", recordedBlob ? `${(recordedBlob.size / 1024 / 1024).toFixed(2)} MB, type: ${recordedBlob.type}` : "null");

      // Step 1.5: NOW stop streaming & camera (after recorder got its data)
      stopStreaming();
      stopCamera();
      await endLive(livestreamId);

      if (recordedBlob && recordedBlob.size > 1000 && user) {
        // Step 2: Upload to storage
        toast.info("📤 Đang upload bản ghi VOD...");
        const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
        const fileName = `${user.id}/vod/${livestreamId}.${ext}`;
        console.log("[VOD] Step 2 - uploading to:", fileName, "size:", recordedBlob.size);

        let uploadError: any = null;

        // Try upload with 1 retry
        for (let attempt = 1; attempt <= 2; attempt++) {
          const { error } = await supabase.storage
            .from("videos")
            .upload(fileName, recordedBlob, {
              contentType: recordedBlob.type || "video/webm",
              upsert: true,
            });

          if (!error) {
            uploadError = null;
            console.log(`[VOD] Step 2 OK - uploaded on attempt ${attempt}`);
            break;
          }

          uploadError = error;
          console.error(`[VOD] Step 2 attempt ${attempt} FAILED:`, error);
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        if (uploadError) {
          toast.error(`Lỗi upload VOD: ${uploadError.message}`);
          // Offer download as fallback
          try {
            const url = URL.createObjectURL(recordedBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `livestream-${livestreamId}.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
            toast.info("📥 Đã tải bản ghi về máy để bạn lưu trữ.");
          } catch (dlErr) {
            console.error("[VOD] Download fallback failed:", dlErr);
          }
          navigate("/studio");
          return;
        }

        // Step 3: Finalize with RPC
        toast.info("🔗 Đang tạo bản ghi VOD...");
        const { data: urlData } = supabase.storage.from("videos").getPublicUrl(fileName);

        const { data: videoId, error: rpcError } = await supabase.rpc(
          "finalize_livestream_vod" as any,
          {
            p_livestream_id: livestreamId,
            p_video_url: urlData.publicUrl,
            p_title: `[VOD] Livestream`,
          }
        );

        if (rpcError) {
          console.error("[VOD] Step 3 FAILED - RPC error:", rpcError);
          toast.error(`Lỗi tạo VOD: ${rpcError.message}`);
        } else {
          console.log("[VOD] Step 3 OK - video_id:", videoId);
          toast.success("✅ Bản ghi VOD đã được lưu thành công!");
        }
      } else {
        if (recorderStartedRef.current) {
          console.warn("[VOD] Blob is null or too small:", recordedBlob?.size);
          toast.warning("Không thể lưu bản ghi - dữ liệu ghi quá ngắn hoặc trống.");
        } else {
          console.log("[VOD] Recorder was not started, skipping VOD save");
        }
      }

      toast.success("Đã kết thúc phát sóng");
      navigate("/studio");
    } catch (err: any) {
      console.error("[VOD] handleEndLive error:", err);
      toast.error(`Lỗi khi kết thúc: ${err?.message || "Unknown"}`);
      navigate("/studio");
    } finally {
      setIsEnding(false);
    }
  }, [livestreamId, isEnding, stopRecording, stopStreaming, stopCamera, endLive, navigate, user]);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main video area */}
            <div className="md:col-span-2 space-y-3">
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
                      onFlipCamera={flipCamera}
                    />
                  )}
                </div>

                {phase === "preview" && (
                  <Button onClick={handleGoLive} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    🔴 Bắt đầu phát sóng
                  </Button>
                )}
                {phase === "live" && (
                  <Button
                    variant="outline"
                    onClick={handleEndLive}
                    disabled={isEnding}
                    className="text-destructive border-destructive/30"
                  >
                    <PhoneOff className="h-4 w-4 mr-1" />
                    {isEnding ? "Đang kết thúc..." : "Kết thúc"}
                  </Button>
                )}
              </div>
            </div>

            {/* Chat panel */}
            <div className="h-[60vh] md:h-[calc(100vh-12rem)]">
              {livestreamId && <LiveChat livestreamId={livestreamId} streamerId={user.id} className="h-full" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoLive;
