import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const { data, error } = await supabase.functions.invoke("get-turn-credentials");
    if (error || !data?.iceServers) return DEFAULT_ICE_SERVERS;
    return data.iceServers;
  } catch {
    return DEFAULT_ICE_SERVERS;
  }
}

type SignalPayload = {
  type: "offer" | "answer" | "candidate" | "join";
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  senderId: string;
  targetId?: string;
};

export function useWebRTCStreamer(livestreamId: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const userIdRef = useRef<string>("");
  const iceServersRef = useRef<RTCIceServer[]>(DEFAULT_ICE_SERVERS);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCamera = useCallback(async (videoConstraints?: MediaTrackConstraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints || { width: 1280, height: 720, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get media:", err);
      throw err;
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cameraTrackRef.current = null;
    setLocalStream(null);
  }, []);

  const syncViewerCount = useCallback((count: number) => {
    setViewerCount(count);
    if (livestreamId) {
      supabase.rpc("update_livestream_viewers", {
        p_livestream_id: livestreamId,
        p_count: count,
      }).then(({ error }) => {
        if (error) console.warn("Failed to sync viewer count:", error);
      });
    }
  }, [livestreamId]);

  const createPeerConnection = useCallback((viewerId: string) => {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    streamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, streamRef.current!);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "candidate",
            candidate: e.candidate.toJSON(),
            senderId: userIdRef.current,
            targetId: viewerId,
          } as SignalPayload,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        pc.close();
        peersRef.current.delete(viewerId);
        syncViewerCount(peersRef.current.size);
      }
    };

    peersRef.current.set(viewerId, pc);
    syncViewerCount(peersRef.current.size);
    return pc;
  }, [syncViewerCount]);

  // Toggle mic
  const toggleMic = useCallback(() => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  }, []);

  // Flip camera (front/back) for mobile
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const flipCamera = useCallback(async () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: newFacing },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack || !streamRef.current) return;

      // Replace old video track in stream
      const oldVideoTrack = streamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        streamRef.current.removeTrack(oldVideoTrack);
      }
      streamRef.current.addTrack(newVideoTrack);
      cameraTrackRef.current = newVideoTrack;

      // Replace track on all peer connections
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(newVideoTrack);
      });

      setLocalStream(new MediaStream(streamRef.current.getTracks()));
      setFacingMode(newFacing);
    } catch (err) {
      console.warn("Failed to flip camera:", err);
    }
  }, [facingMode]);

  // Screen share toggle
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share, restore camera
      const camTrack = cameraTrackRef.current;
      if (camTrack && streamRef.current) {
        const currentVideoTrack = streamRef.current.getVideoTracks()[0];
        if (currentVideoTrack) {
          currentVideoTrack.stop();
          streamRef.current.removeTrack(currentVideoTrack);
        }
        streamRef.current.addTrack(camTrack);
        // Replace track on all peers
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          sender?.replaceTrack(camTrack);
        });
        setLocalStream(new MediaStream(streamRef.current.getTracks()));
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (streamRef.current) {
          const currentVideoTrack = streamRef.current.getVideoTracks()[0];
          if (currentVideoTrack) {
            streamRef.current.removeTrack(currentVideoTrack);
          }
          streamRef.current.addTrack(screenTrack);
          // Replace track on all peers
          peersRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video");
            sender?.replaceTrack(screenTrack);
          });
          setLocalStream(new MediaStream(streamRef.current.getTracks()));
        }
        setIsScreenSharing(true);
        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  }, [isScreenSharing]);

  const startStreaming = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    userIdRef.current = user.id;

    iceServersRef.current = await fetchIceServers();

    const channel = supabase.channel(`livestream:${livestreamId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "signal" }, async ({ payload }) => {
      const signal = payload as SignalPayload;
      if (signal.targetId && signal.targetId !== userIdRef.current) return;

      if (signal.type === "join") {
        const pc = createPeerConnection(signal.senderId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "offer",
            sdp: offer.sdp,
            senderId: userIdRef.current,
            targetId: signal.senderId,
          } as SignalPayload,
        });
      }

      if (signal.type === "answer") {
        const pc = peersRef.current.get(signal.senderId);
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription({ type: "answer", sdp: signal.sdp });
        }
      }

      if (signal.type === "candidate") {
        const pc = peersRef.current.get(signal.senderId);
        if (pc && signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn("Failed to add ICE candidate:", e);
          }
        }
      }
    });

    await channel.subscribe();
    channelRef.current = channel;
    setIsStreaming(true);

    heartbeatRef.current = setInterval(() => {
      supabase
        .from("livestreams")
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq("id", livestreamId)
        .then(({ error }) => {
          if (error) console.warn("Heartbeat failed:", error);
        });
    }, 15_000);

    supabase
      .from("livestreams")
      .update({ last_heartbeat_at: new Date().toISOString() })
      .eq("id", livestreamId);
  }, [livestreamId, createPeerConnection]);

  const stopStreaming = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setIsStreaming(false);
    setViewerCount(0);

    if (livestreamId) {
      supabase.rpc("update_livestream_viewers", {
        p_livestream_id: livestreamId,
        p_count: 0,
      });
    }
  }, [livestreamId]);

  useEffect(() => {
    return () => {
      stopStreaming();
      stopCamera();
    };
  }, [stopStreaming, stopCamera]);

  return {
    isStreaming, viewerCount, localStream, startCamera, stopCamera, startStreaming, stopStreaming,
    isMicOn, isCameraOn, isScreenSharing, toggleMic, toggleCamera, toggleScreenShare,
  };
}

export function useWebRTCViewer(livestreamId: string, streamerId: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userIdRef = useRef<string>("");
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    // Clean up previous connection
    pcRef.current?.close();
    pcRef.current = null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    userIdRef.current = user.id;

    const iceServers = await fetchIceServers();

    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0] || null);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionState(state);

      // Auto-reconnect on disconnect/fail
      if (state === "disconnected" || state === "failed") {
        setReconnectAttempts((prev) => {
          const next = prev + 1;
          if (next <= maxReconnectAttempts) {
            reconnectTimerRef.current = setTimeout(() => {
              connect();
            }, 3000);
          }
          return next;
        });
      } else if (state === "connected") {
        setReconnectAttempts(0);
      }
    };

    // Reuse existing channel or create new
    if (!channelRef.current) {
      const channel = supabase.channel(`livestream:${livestreamId}`, {
        config: { broadcast: { self: false } },
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "candidate",
              candidate: e.candidate.toJSON(),
              senderId: userIdRef.current,
              targetId: streamerId,
            } as SignalPayload,
          });
        }
      };

      channel.on("broadcast", { event: "signal" }, async ({ payload }) => {
        const signal = payload as SignalPayload;
        if (signal.targetId && signal.targetId !== userIdRef.current) return;

        if (signal.type === "offer") {
          const currentPc = pcRef.current;
          if (!currentPc) return;
          await currentPc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
          const answer = await currentPc.createAnswer();
          await currentPc.setLocalDescription(answer);
          channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "answer",
              sdp: answer.sdp,
              senderId: userIdRef.current,
              targetId: signal.senderId,
            } as SignalPayload,
          });
        }

        if (signal.type === "candidate" && signal.candidate) {
          try {
            await pcRef.current?.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn("Failed to add ICE candidate:", e);
          }
        }
      });

      await channel.subscribe();
      channelRef.current = channel;
    } else {
      // Reusing channel, just set ice candidate handler on new pc
      pc.onicecandidate = (e) => {
        if (e.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "candidate",
              candidate: e.candidate.toJSON(),
              senderId: userIdRef.current,
              targetId: streamerId,
            } as SignalPayload,
          });
        }
      };
    }

    // Send join signal
    channelRef.current!.send({
      type: "broadcast",
      event: "signal",
      payload: {
        type: "join",
        senderId: userIdRef.current,
      } as SignalPayload,
    });
  }, [livestreamId, streamerId]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    pcRef.current?.close();
    pcRef.current = null;
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setRemoteStream(null);
    setConnectionState("closed");
    setReconnectAttempts(0);
  }, []);

  const manualRetry = useCallback(() => {
    setReconnectAttempts(0);
    connect();
  }, [connect]);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { remoteStream, connectionState, connect, disconnect, reconnectAttempts, maxReconnectAttempts, manualRetry };
}
