import { useState, useRef, useCallback } from "react";

interface UseMediaRecorderReturn {
  isRecording: boolean;
  startRecording: (stream: MediaStream) => boolean;
  stopRecording: () => Promise<Blob | null>;
  actualMimeType: string | null;
}

const MIME_CANDIDATES = [
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

  const startRecording = useCallback((stream: MediaStream): boolean => {
    chunksRef.current = [];
    mimeRef.current = null;

    try {
      if (typeof MediaRecorder === "undefined") {
        console.error("[MediaRecorder] Not supported in this browser");
        return false;
      }

      const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || "";

      if (!mimeType) {
        console.error("[MediaRecorder] No supported mime type found");
        return false;
      }

      console.log("[MediaRecorder] Using mime type:", mimeType);
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log(`[MediaRecorder] Chunk received: ${(e.data.size / 1024).toFixed(1)} KB, total chunks: ${chunksRef.current.length}`);
        }
      };

      recorder.onerror = (e) => {
        console.error("[MediaRecorder] Recording error:", e);
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      mimeRef.current = mimeType;
      setIsRecording(true);
      console.log("[MediaRecorder] Started recording successfully");
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
        resolve(null);
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
        console.warn("[MediaRecorder] onstop timeout - resolving with collected chunks");
        const chunks = chunksRef.current;
        if (chunks.length > 0) {
          const blobType = mimeRef.current || "video/webm";
          const blob = new Blob(chunks, { type: blobType });
          chunksRef.current = [];
          recorderRef.current = null;
          setIsRecording(false);
          resolve(blob.size > 0 ? blob : null);
        } else {
          recorderRef.current = null;
          setIsRecording(false);
          resolve(null);
        }
      }, 5000);

      recorder.onstop = () => {
        clearTimeout(safetyTimeout);
        const blobType = mimeRef.current || "video/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        console.log(`[MediaRecorder] Stopped. Blob size: ${(blob.size / 1024 / 1024).toFixed(2)} MB, chunks: ${chunksRef.current.length}`);
        chunksRef.current = [];
        recorderRef.current = null;
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
        recorderRef.current = null;
        setIsRecording(false);
        resolve(null);
      }
    });
  }, []);

  return { isRecording, startRecording, stopRecording, actualMimeType: mimeRef.current };
};
