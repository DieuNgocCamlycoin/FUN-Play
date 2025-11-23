import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VideoCardProps {
  thumbnail: string;
  title: string;
  channel: string;
  views: string;
  timestamp: string;
  onTip?: () => void;
}

export const VideoCard = ({
  thumbnail,
  title,
  channel,
  views,
  timestamp,
  onTip,
}: VideoCardProps) => {
  return (
    <Card className="group overflow-hidden bg-card border-0 hover:bg-hover-blue dark:hover:bg-hover-blue-dark transition-all duration-300 cursor-pointer">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-2 right-2 bg-background/90 px-1.5 py-0.5 rounded text-xs font-semibold">
          10:24
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {channel[0]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{channel}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{views}</span>
            <span>•</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>

      {/* Tip button */}
      <div className="px-3 pb-3">
        <Button
          onClick={onTip}
          size="sm"
          className="w-full gap-2 bg-fun-yellow text-primary-foreground hover:bg-fun-yellow/90 font-semibold"
        >
          <Coins className="h-4 w-4" />
          <span className="text-xs">⚡ Tip Creator</span>
        </Button>
      </div>
    </Card>
  );
};
