import { useState, useRef, useCallback } from "react";

interface UseMediaRecorderReturn {
  isRecording: boolean;
  startRecording: (stream: MediaStream) => boolean;
  stopRecording: () => Promise<Blob | null>;
}

export const useMediaRecorder = (): UseMediaRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback((stream: MediaStream): boolean => {
    chunksRef.current = [];

    try {
      if (typeof MediaRecorder === "undefined") {
        console.error("[MediaRecorder] Not supported in this browser");
        return false;
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";

      if (!mimeType) {
        console.error("[MediaRecorder] No supported mime type found");
        return false;
      }

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = (e) => {
        console.error("[MediaRecorder] Recording error:", e);
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
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
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        chunksRef.current = [];
        recorderRef.current = null;
        setIsRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  return { isRecording, startRecording, stopRecording };
};
