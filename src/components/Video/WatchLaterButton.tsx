import { Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatchLater } from '@/hooks/useWatchLater';
import { cn } from '@/lib/utils';

interface WatchLaterButtonProps {
  videoId: string;
  variant?: 'icon' | 'button' | 'menu';
  className?: string;
}

export const WatchLaterButton = ({ 
  videoId, 
  variant = 'icon',
  className 
}: WatchLaterButtonProps) => {
  const { isInWatchLater, toggleWatchLater } = useWatchLater();
  const isAdded = isInWatchLater(videoId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await toggleWatchLater(videoId);
  };

  if (variant === 'menu') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors",
          className
        )}
      >
        {isAdded ? (
          <>
            <Check className="w-4 h-4 text-primary" />
            <span>Đã thêm vào Xem sau</span>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4" />
            <span>Xem sau</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        onClick={handleClick}
        variant={isAdded ? "secondary" : "outline"}
        size="sm"
        className={cn(
          "gap-2",
          isAdded && "bg-primary/20 border-primary",
          className
        )}
      >
        {isAdded ? (
          <>
            <Check className="w-4 h-4" />
            <span>Đã lưu</span>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4" />
            <span>Xem sau</span>
          </>
        )}
      </Button>
    );
  }

  // Icon variant (default)
  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-2 rounded-full transition-all duration-200",
        "hover:bg-accent/80 active:scale-95",
        isAdded 
          ? "bg-primary/20 text-primary" 
          : "bg-background/80 backdrop-blur-sm text-foreground hover:text-primary",
        className
      )}
      title={isAdded ? "Xóa khỏi danh sách Xem sau" : "Thêm vào Xem sau"}
    >
      {isAdded ? (
        <Check className="w-5 h-5" />
      ) : (
        <Clock className="w-5 h-5" />
      )}
    </button>
  );
};
