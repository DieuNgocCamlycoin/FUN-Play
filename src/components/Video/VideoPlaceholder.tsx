import { Play } from "lucide-react";

interface VideoPlaceholderProps {
  className?: string;
}

/**
 * Placeholder component for videos without thumbnails.
 * Displays a cosmic gradient background with a play icon.
 */
export const VideoPlaceholder = ({ className = "" }: VideoPlaceholderProps) => {
  return (
    <div 
      className={`w-full h-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta flex items-center justify-center ${className}`}
    >
      <Play className="h-12 w-12 text-white/50 fill-white/30" />
    </div>
  );
};
