import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

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
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const userIdRef = useRef<string>("");

  const startCamera = useCallback(async (videoConstraints?: MediaTrackConstraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints || { width: 1280, height: 720, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
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
    setLocalStream(null);
  }, []);

  const createPeerConnection = useCallback((viewerId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

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
        setViewerCount(peersRef.current.size);
      }
    };

    peersRef.current.set(viewerId, pc);
    setViewerCount(peersRef.current.size);
    return pc;
  }, []);

  const startStreaming = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    userIdRef.current = user.id;

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
  }, [livestreamId, createPeerConnection]);

  const stopStreaming = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setIsStreaming(false);
    setViewerCount(0);
  }, []);

  useEffect(() => {
    return () => {
      stopStreaming();
      stopCamera();
    };
  }, [stopStreaming, stopCamera]);

  return { isStreaming, viewerCount, localStream, startCamera, stopCamera, startStreaming, stopStreaming };
}

export function useWebRTCViewer(livestreamId: string, streamerId: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userIdRef = useRef<string>("");

  const connect = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    userIdRef.current = user.id;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0] || null);
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

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
        await pc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
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
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn("Failed to add ICE candidate:", e);
        }
      }
    });

    await channel.subscribe();
    channelRef.current = channel;

    // Send join signal
    channel.send({
      type: "broadcast",
      event: "signal",
      payload: {
        type: "join",
        senderId: userIdRef.current,
      } as SignalPayload,
    });
  }, [livestreamId, streamerId]);

  const disconnect = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setRemoteStream(null);
    setConnectionState("closed");
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { remoteStream, connectionState, connect, disconnect };
}
