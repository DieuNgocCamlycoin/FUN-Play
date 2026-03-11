import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface StreamerControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onFlipCamera?: () => void;
  className?: string;
}

export const StreamerControls = ({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onFlipCamera,
  className,
}: StreamerControlsProps) => {
  const isMobile = useIsMobile();
  const supportsScreenShare = typeof navigator.mediaDevices?.getDisplayMedia === "function";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={isMicOn ? "secondary" : "destructive"}
        size="sm"
        onClick={onToggleMic}
        className="gap-1.5"
      >
        {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        <span className="hidden sm:inline">{isMicOn ? "Mic" : "Tắt mic"}</span>
      </Button>

      <Button
        variant={isCameraOn ? "secondary" : "destructive"}
        size="sm"
        onClick={onToggleCamera}
        className="gap-1.5"
      >
        {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        <span className="hidden sm:inline">{isCameraOn ? "Camera" : "Tắt cam"}</span>
      </Button>

      {/* Flip camera - only on mobile */}
      {isMobile && onFlipCamera && (
        <Button
          variant="outline"
          size="sm"
          onClick={onFlipCamera}
          className="gap-1.5"
        >
          <SwitchCamera className="h-4 w-4" />
          <span className="hidden sm:inline">Đổi cam</span>
        </Button>
      )}

      {/* Screen share - only on desktop or when API is available */}
      {supportsScreenShare && (
        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="sm"
          onClick={onToggleScreenShare}
          className="gap-1.5"
        >
          {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          <span className="hidden sm:inline">{isScreenSharing ? "Dừng share" : "Chia sẻ"}</span>
        </Button>
      )}
    </div>
  );
};
