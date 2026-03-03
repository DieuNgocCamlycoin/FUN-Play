import { useEffect, useRef } from "react";
import { LiveBadge } from "./LiveBadge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  viewerCount?: number;
  className?: string;
  muted?: boolean;
}

export const LivePlayer = ({ stream, isLocal, viewerCount = 0, className, muted }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn("relative bg-black rounded-xl overflow-hidden aspect-video", className)}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Đang chờ kết nối...</p>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <LiveBadge />
        <div className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          <Users className="h-3 w-3" />
          <span>{viewerCount}</span>
        </div>
      </div>
    </div>
  );
};
