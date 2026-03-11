import { useState, useRef, useCallback } from "react";

interface UseMediaRecorderReturn {
  isRecording: boolean;
  startRecording: (stream: MediaStream) => boolean;
  stopRecording: () => Promise<Blob | null>;
  actualMimeType: string | null;
}

// Detect iOS/Safari to prioritize mp4
const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Mac") && "ontouchend" in document);

const MIME_CANDIDATES = isIOSSafari
  ? [
      "video/mp4",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ]
  : [
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];

export const useMediaRecorder = (): UseMediaRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback((stream: MediaStream): boolean => {
    chunksRef.current = [];
    mimeRef.current = null;

    try {
      if (typeof MediaRecorder === "undefined") {
        console.error("[MediaRecorder] Not supported in this browser");
        return false;
      }

      // Validate tracks are active
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      console.log("[MediaRecorder] Stream tracks:", {
        video: videoTracks.map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })),
        audio: audioTracks.map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })),
      });

      const hasLiveTrack = [...videoTracks, ...audioTracks].some(t => t.readyState === "live");
      if (!hasLiveTrack) {
        console.error("[MediaRecorder] No live tracks in stream");
        return false;
      }

      // Use the source stream directly so track replacements (flip camera, screen share)
      // are automatically picked up by MediaRecorder
      const recordingStream = stream;
      streamRef.current = null; // No clone to clean up

      const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || "";

      if (!mimeType) {
        console.error("[MediaRecorder] No supported mime type found. Browser:", navigator.userAgent);
        return false;
      }

      console.log("[MediaRecorder] Using mime type:", mimeType);
      const recorder = new MediaRecorder(recordingStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log(`[MediaRecorder] Chunk #${chunksRef.current.length}: ${(e.data.size / 1024).toFixed(1)} KB`);
        }
      };

      recorder.onerror = (e) => {
        console.error("[MediaRecorder] Recording error:", e);
      };

      // Monitor track health periodically
      const trackMonitor = setInterval(() => {
        const tracks = recordingStream.getTracks();
        const allEnded = tracks.every(t => t.readyState === "ended");
        if (allEnded && recorderRef.current?.state === "recording") {
          console.warn("[MediaRecorder] All tracks ended while recording - stopping");
          clearInterval(trackMonitor);
        }
      }, 5000);

      recorder.onstop = () => clearInterval(trackMonitor);

      recorder.start(1000);
      recorderRef.current = recorder;
      mimeRef.current = mimeType;
      setIsRecording(true);
      console.log("[MediaRecorder] Started recording on SOURCE stream successfully");
      return true;
    } catch (err) {
      console.error("[MediaRecorder] Failed to start recording:", err);
      return false;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        console.warn("[MediaRecorder] stopRecording called but recorder is inactive/null");
        // Still try to build blob from any chunks we have
        if (chunksRef.current.length > 0) {
          const blobType = mimeRef.current || "video/webm";
          const blob = new Blob(chunksRef.current, { type: blobType });
          console.log(`[MediaRecorder] Built blob from ${chunksRef.current.length} orphan chunks: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
          chunksRef.current = [];
          cleanupStream();
          setIsRecording(false);
          resolve(blob.size > 0 ? blob : null);
        } else {
          cleanupStream();
          setIsRecording(false);
          resolve(null);
        }
        return;
      }

      // Flush any buffered data before stopping
      try {
        if (recorder.state === "recording") {
          recorder.requestData();
        }
      } catch (e) {
        console.warn("[MediaRecorder] requestData before stop failed:", e);
      }

      // Safety timeout: if onstop never fires, resolve with whatever we have
      const safetyTimeout = setTimeout(() => {
        console.warn("[MediaRecorder] onstop timeout (5s) - resolving with collected chunks");
        const chunks = chunksRef.current;
        if (chunks.length > 0) {
          const blobType = mimeRef.current || "video/webm";
          const blob = new Blob(chunks, { type: blobType });
          console.log(`[MediaRecorder] Safety blob: ${(blob.size / 1024 / 1024).toFixed(2)} MB from ${chunks.length} chunks`);
          chunksRef.current = [];
          recorderRef.current = null;
          cleanupStream();
          setIsRecording(false);
          resolve(blob.size > 0 ? blob : null);
        } else {
          recorderRef.current = null;
          cleanupStream();
          setIsRecording(false);
          resolve(null);
        }
      }, 5000);

      recorder.onstop = () => {
        clearTimeout(safetyTimeout);
        const blobType = mimeRef.current || "video/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        console.log(`[MediaRecorder] Stopped. Blob: ${(blob.size / 1024 / 1024).toFixed(2)} MB, chunks: ${chunksRef.current.length}`);
        chunksRef.current = [];
        recorderRef.current = null;
        cleanupStream();
        setIsRecording(false);

        if (blob.size === 0) {
          console.error("[MediaRecorder] Empty blob after stop");
          resolve(null);
        } else {
          resolve(blob);
        }
      };

      try {
        recorder.stop();
      } catch (e) {
        clearTimeout(safetyTimeout);
        console.error("[MediaRecorder] stop() threw:", e);
        // Try to salvage chunks
        if (chunksRef.current.length > 0) {
          const blobType = mimeRef.current || "video/webm";
          const blob = new Blob(chunksRef.current, { type: blobType });
          chunksRef.current = [];
          recorderRef.current = null;
          cleanupStream();
          setIsRecording(false);
          resolve(blob.size > 0 ? blob : null);
        } else {
          recorderRef.current = null;
          cleanupStream();
          setIsRecording(false);
          resolve(null);
        }
      }
    });
  }, []);

  const cleanupStream = () => {
    // No-op: source stream lifecycle is managed by useWebRTC
    streamRef.current = null;
  };

  return { isRecording, startRecording, stopRecording, actualMimeType: mimeRef.current };
};
